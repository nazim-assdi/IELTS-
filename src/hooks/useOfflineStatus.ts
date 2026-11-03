/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { OfflineStorageManager, OfflineAction, LocalUserProgress } from '../services/offline-storage';
import { requestPrecacheCurriculum } from '../services/service-worker-registration';
import { sound } from '../utils/sound';

export interface UseOfflineStatusReturn {
  isOnline: boolean;
  isOffline: boolean;
  simulatedOffline: boolean;
  isOfflineReady: boolean;
  pendingSyncCount: number;
  lastSyncedAt: number;
  toggleSimulatedOffline: () => void;
  syncNow: () => Promise<number>;
  precacheAllUnits: () => Promise<boolean>;
  recordOfflineProgress: (actionType: OfflineAction['type'], payload: any) => void;
}

export function useOfflineStatus(
  onReconciled?: (reconciled: LocalUserProgress, count: number) => void
): UseOfflineStatusReturn {
  const [networkOnline, setNetworkOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => {
    return OfflineStorageManager.getPendingActions().length;
  });
  const [isOfflineReady, setIsOfflineReady] = useState<boolean>(() => {
    return OfflineStorageManager.isOfflineReady();
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(Date.now());

  // Effective status (either network is down or simulated offline is active)
  const isOnline = networkOnline && !simulatedOffline;
  const isOffline = !isOnline;

  // Window event listeners for online/offline
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setNetworkOnline(true);
      // Auto-trigger sync when returning online
      syncNow();
    };

    const handleOffline = () => {
      setNetworkOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending sync count periodically or when storage changes
  useEffect(() => {
    const updateCount = () => {
      setPendingSyncCount(OfflineStorageManager.getPendingActions().length);
    };

    updateCount();
    const interval = setInterval(updateCount, 4000);
    return () => clearInterval(interval);
  }, []);

  const toggleSimulatedOffline = useCallback(() => {
    sound.playTap();
    setSimulatedOffline((prev) => {
      const next = !prev;
      if (!next) {
        // Going back online -> trigger sync
        setTimeout(() => syncNow(), 200);
      }
      return next;
    });
  }, []);

  const recordOfflineProgress = useCallback((actionType: OfflineAction['type'], payload: any) => {
    OfflineStorageManager.queueAction(actionType, payload);
    setPendingSyncCount(OfflineStorageManager.getPendingActions().length);
  }, []);

  const syncNow = useCallback(async (): Promise<number> => {
    const queue = OfflineStorageManager.getPendingActions();
    if (queue.length === 0) {
      setLastSyncedAt(Date.now());
      return 0;
    }

    const currentProgress = OfflineStorageManager.loadProgress();
    const { reconciled, processedCount } = OfflineStorageManager.reconcileState(currentProgress, queue);

    OfflineStorageManager.saveProgress(reconciled);
    OfflineStorageManager.clearPendingActions();

    setPendingSyncCount(0);
    setLastSyncedAt(Date.now());

    if (processedCount > 0) {
      sound.playReward();
      onReconciled?.(reconciled, processedCount);
    }

    return processedCount;
  }, [onReconciled]);

  const precacheAllUnits = useCallback(async (): Promise<boolean> => {
    sound.playTap();
    const success = await requestPrecacheCurriculum();
    if (success) {
      OfflineStorageManager.markOfflineReady();
      setIsOfflineReady(true);
      sound.playVictory();
    }
    return success;
  }, []);

  return {
    isOnline,
    isOffline,
    simulatedOffline,
    isOfflineReady,
    pendingSyncCount,
    lastSyncedAt,
    toggleSimulatedOffline,
    syncNow,
    precacheAllUnits,
    recordOfflineProgress,
  };
}
