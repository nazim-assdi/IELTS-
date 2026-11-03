/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  OfflineStorageManager, 
  DEFAULT_LOCAL_PROGRESS, 
  OfflineAction 
} from './offline-storage.ts';

test('OfflineStorageManager.reconcileState merges offline lesson completion without duplicates', () => {
  const base = {
    ...DEFAULT_LOCAL_PROGRESS,
    completedLessons: ['u1-l1'],
    xp: 180,
    gems: 140,
    todayCompletedLessons: 2,
    todayPracticeMinutes: 10,
  };

  const offlineActions: OfflineAction[] = [
    {
      id: 'act-1',
      type: 'COMPLETE_LESSON',
      payload: { lessonId: 'u1-l2', earnedXp: 25, earnedGems: 10 },
      timestamp: Date.now() - 5000,
    },
    {
      id: 'act-2',
      type: 'COMPLETE_LESSON',
      payload: { lessonId: 'u1-l2', earnedXp: 25, earnedGems: 10 }, // Duplicate submission
      timestamp: Date.now() - 2000,
    },
  ];

  const { reconciled, processedCount } = OfflineStorageManager.reconcileState(base, offlineActions);

  // Lesson u1-l2 should be present once
  assert.equal(reconciled.completedLessons.length, 2);
  assert.ok(reconciled.completedLessons.includes('u1-l2'));
  assert.equal(processedCount, 2);
  // XP incremented
  assert.equal(reconciled.xp, 180 + 25 + 25);
  // Gems incremented
  assert.equal(reconciled.gems, 140 + 10 + 10);
});

test('OfflineStorageManager.reconcileState handles speaking evaluations and goal rewards', () => {
  const base = {
    ...DEFAULT_LOCAL_PROGRESS,
    predictedBand: 7.0,
    todayPracticeMinutes: 10,
    gems: 50,
  };

  const offlineActions: OfflineAction[] = [
    {
      id: 'act-speak',
      type: 'RECORD_SPEAKING_SESSION',
      payload: { session: { overallBand: 8.0 } },
      timestamp: Date.now() - 3000,
    },
    {
      id: 'act-goal',
      type: 'CLAIM_DAILY_GOAL',
      payload: { earnedGems: 25, earnedXp: 40 },
      timestamp: Date.now() - 1000,
    },
  ];

  const { reconciled } = OfflineStorageManager.reconcileState(base, offlineActions);
  assert.equal(reconciled.predictedBand, 8.0);
  assert.equal(reconciled.gems, 75);
  assert.equal(reconciled.todayPracticeMinutes, 15);
  assert.equal(reconciled.offlineQueue.length, 0);
});

test('DEFAULT_LOCAL_PROGRESS has valid default schema', () => {
  assert.ok(Array.isArray(DEFAULT_LOCAL_PROGRESS.completedLessons));
  assert.ok(DEFAULT_LOCAL_PROGRESS.xp >= 0);
  assert.ok(DEFAULT_LOCAL_PROGRESS.hearts === 5);
  assert.ok(DEFAULT_LOCAL_PROGRESS.predictedBand >= 5.0);
});
