/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DayProgress, INITIAL_WEEKLY_DATA } from '../utils/weekly-progress';
import { PracticeSessionRecord, INITIAL_PRACTICE_SESSIONS } from '../utils/speaking-analytics';

export interface OfflineAction {
  id: string;
  type: 'COMPLETE_LESSON' | 'RECORD_SPEAKING_SESSION' | 'CLAIM_DAILY_GOAL' | 'UPDATE_XP';
  payload: any;
  timestamp: number;
}

export interface LocalUserProgress {
  completedLessons: string[];
  xp: number;
  gems: number;
  hearts: number;
  streak: number;
  predictedBand: number;
  lastActiveDate: string;
  todayCompletedLessons: number;
  todayPracticeMinutes: number;
  offlineQueue: OfflineAction[];
  lastSyncedAt: number;
}

const STORAGE_KEYS = {
  PROGRESS: 'ielts_local_user_progress',
  OFFLINE_QUEUE: 'ielts_offline_mutation_queue',
  LAST_SYNC: 'ielts_last_sync_timestamp',
  CACHED_SESSIONS: 'ielts_speaking_sessions',
  CACHED_WEEKLY: 'ielts_weekly_progress',
  CACHE_READY: 'ielts_offline_ready_flag',
};

/**
 * Default local-first initial state
 */
export const DEFAULT_LOCAL_PROGRESS: LocalUserProgress = {
  completedLessons: ['u1-l1'],
  xp: 180,
  gems: 140,
  hearts: 5,
  streak: 5,
  predictedBand: 7.5,
  lastActiveDate: new Date().toISOString().split('T')[0],
  todayCompletedLessons: 2,
  todayPracticeMinutes: 11,
  offlineQueue: [],
  lastSyncedAt: Date.now(),
};

/**
 * Local-First Storage Service
 * Guarantees that progress updates are saved locally first before any network roundtrip.
 */
export class OfflineStorageManager {
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Load local progress or return initial defaults
   */
  static loadProgress(): LocalUserProgress {
    if (!this.isBrowser()) return DEFAULT_LOCAL_PROGRESS;

    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_LOCAL_PROGRESS,
          ...parsed,
          offlineQueue: this.getPendingActions(),
        };
      }
    } catch (e) {
      console.warn('Failed to load local progress from storage, fallback to defaults', e);
    }

    return DEFAULT_LOCAL_PROGRESS;
  }

  /**
   * Persist progress to local storage synchronously
   */
  static saveProgress(progress: Partial<LocalUserProgress>): void {
    if (!this.isBrowser()) return;

    try {
      const current = this.loadProgress();
      const updated: LocalUserProgress = {
        ...current,
        ...progress,
      };
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save local progress to localStorage', e);
    }
  }

  /**
   * Enqueue an action when offline for later reconciliation
   */
  static queueAction(actionType: OfflineAction['type'], payload: any): OfflineAction {
    const action: OfflineAction = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: actionType,
      payload,
      timestamp: Date.now(),
    };

    if (this.isBrowser()) {
      try {
        const queue = this.getPendingActions();
        queue.push(action);
        localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
      } catch (e) {
        console.error('Failed to queue offline action', e);
      }
    }

    return action;
  }

  /**
   * Get all pending queued actions
   */
  static getPendingActions(): OfflineAction[] {
    if (!this.isBrowser()) return [];

    try {
      const data = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to read offline queue', e);
    }
    return [];
  }

  /**
   * Clear all pending queued actions once synchronized
   */
  static clearPendingActions(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    } catch (e) {
      console.error('Failed to clear offline queue', e);
    }
  }

  /**
   * Pure state reconciliation logic:
   * Merges queued actions into base progress without data loss.
   */
  static reconcileState(
    baseProgress: LocalUserProgress,
    queuedActions: OfflineAction[]
  ): { reconciled: LocalUserProgress; processedCount: number } {
    let reconciled = { ...baseProgress };
    let processedCount = 0;

    for (const action of queuedActions) {
      switch (action.type) {
        case 'COMPLETE_LESSON': {
          const { lessonId, earnedXp, earnedGems } = action.payload;
          if (lessonId && !reconciled.completedLessons.includes(lessonId)) {
            reconciled.completedLessons = [...reconciled.completedLessons, lessonId];
          }
          reconciled.xp += (earnedXp || 0);
          reconciled.gems += (earnedGems || 0);
          reconciled.todayCompletedLessons += 1;
          reconciled.todayPracticeMinutes += 4;
          processedCount++;
          break;
        }

        case 'RECORD_SPEAKING_SESSION': {
          const { session } = action.payload;
          if (session && session.overallBand) {
            reconciled.predictedBand = session.overallBand;
            reconciled.todayPracticeMinutes += 5;
            processedCount++;
          }
          break;
        }

        case 'CLAIM_DAILY_GOAL': {
          const { earnedGems, earnedXp } = action.payload;
          reconciled.gems += (earnedGems || 0);
          reconciled.xp += (earnedXp || 0);
          processedCount++;
          break;
        }

        case 'UPDATE_XP': {
          const { xpDelta } = action.payload;
          reconciled.xp += (xpDelta || 0);
          processedCount++;
          break;
        }
      }
    }

    reconciled.lastSyncedAt = Date.now();
    reconciled.offlineQueue = [];
    return { reconciled, processedCount };
  }

  /**
   * Mark all 100 units offline cache as ready
   */
  static markOfflineReady(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.CACHE_READY, 'true');
    } catch (e) {}
  }

  static isOfflineReady(): boolean {
    if (!this.isBrowser()) return false;
    return localStorage.getItem(STORAGE_KEYS.CACHE_READY) === 'true';
  }
}
