/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGoalProgress,
  getMascotGoalReaction,
  formatPracticeTime,
  DAILY_GOAL_PRESETS,
} from './daily-goal.ts';

test('calculateGoalProgress calculates percentages correctly and caps at 100', () => {
  // Test case 1: 0 progress
  const r0 = calculateGoalProgress(0, 3);
  assert.equal(r0.percent, 0);
  assert.equal(r0.isCompleted, false);
  assert.equal(r0.remaining, 3);

  // Test case 2: 2 of 3 lessons (67%)
  const r2 = calculateGoalProgress(2, 3);
  assert.equal(r2.percent, 67);
  assert.equal(r2.isCompleted, false);
  assert.equal(r2.remaining, 1);

  // Test case 3: Exact match (100%)
  const r3 = calculateGoalProgress(3, 3);
  assert.equal(r3.percent, 100);
  assert.equal(r3.isCompleted, true);
  assert.equal(r3.remaining, 0);

  // Test case 4: Over goal (e.g. 5 of 3) caps at 100%
  const rOver = calculateGoalProgress(5, 3);
  assert.equal(rOver.percent, 100);
  assert.equal(rOver.isCompleted, true);
  assert.equal(rOver.remaining, 0);

  // Test case 5: Edge case: negative current or 0 target
  const rEdge = calculateGoalProgress(-1, 0);
  assert.equal(rEdge.percent, 0);
  assert.equal(rEdge.target, 1); // safeTarget handles 0
});

test('DAILY_GOAL_PRESETS provides all expected tiers with consistent rewards', () => {
  assert.ok(DAILY_GOAL_PRESETS.casual.targetLessons >= 1);
  assert.ok(DAILY_GOAL_PRESETS.regular.targetLessons >= 3);
  assert.ok(DAILY_GOAL_PRESETS.serious.targetLessons >= 5);
  assert.ok(DAILY_GOAL_PRESETS.hero.targetLessons >= 8);

  assert.ok(DAILY_GOAL_PRESETS.hero.bonusGems > DAILY_GOAL_PRESETS.casual.bonusGems);
});

test('getMascotGoalReaction returns appropriate tone for progress brackets', () => {
  const atZero = getMascotGoalReaction(0, 'lessons', 3);
  assert.equal(atZero.mood, 'thinking');

  const midway = getMascotGoalReaction(50, 'lessons', 1);
  assert.equal(midway.mood, 'happy');

  const close = getMascotGoalReaction(80, 'minutes', 2);
  assert.equal(close.mood, 'coaching');
  assert.ok(close.message.includes('2 more minutes'));

  const completed = getMascotGoalReaction(100, 'lessons', 0);
  assert.equal(completed.mood, 'celebrate');
  assert.equal(completed.statusTag, 'Goal Smashed!');
});

test('formatPracticeTime formats correctly', () => {
  assert.equal(formatPracticeTime(0, 45), '45s');
  assert.equal(formatPracticeTime(15, 0), '15m');
  assert.equal(formatPracticeTime(12, 30), '12m 30s');
});
