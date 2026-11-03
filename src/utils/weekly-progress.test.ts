/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateWeeklySummary, recordTodayActivity, INITIAL_WEEKLY_DATA, DayProgress } from './weekly-progress.ts';

test('calculateWeeklySummary calculates correct totals and XP delta comparison', () => {
  const summary = calculateWeeklySummary(INITIAL_WEEKLY_DATA);
  
  // This week sum: 55+70+45+80+60+90+40 = 440
  assert.equal(summary.thisWeekTotalXp, 440);
  // Last week sum: 40+45+50+35+55+60+25 = 310
  assert.equal(summary.lastWeekTotalXp, 310);
  
  // Delta: 440 - 310 = 130
  assert.equal(summary.xpDelta, 130);
  // Delta percentage: (130 / 310) * 100 ~ 42%
  assert.equal(summary.xpDeltaPercentage, 42);
  
  // Active days (all 7 have > 0 XP)
  assert.equal(summary.activeDaysThisWeek, 7);
  assert.equal(summary.consistencyScore, 100);
  assert.equal(summary.consistencyRating, 'Exceptional');
});

test('calculateWeeklySummary handles empty or zero data safely', () => {
  const emptySummary = calculateWeeklySummary([]);
  assert.equal(emptySummary.thisWeekTotalXp, 0);
  assert.equal(emptySummary.xpDeltaPercentage, 0);
  assert.equal(emptySummary.consistencyRating, 'Needs Focus');

  const zeroDays: DayProgress[] = [
    { day: 'Mon', fullDay: 'Monday', thisWeekXp: 0, lastWeekXp: 0, thisWeekMinutes: 0, lastWeekMinutes: 0, lessonsCompleted: 0 }
  ];
  const zeroSummary = calculateWeeklySummary(zeroDays);
  assert.equal(zeroSummary.thisWeekTotalXp, 0);
  assert.equal(zeroSummary.xpDelta, 0);
  assert.equal(zeroSummary.activeDaysThisWeek, 0);
});

test('calculateWeeklySummary categorizes ratings accurately based on active days', () => {
  const mockDays: DayProgress[] = [
    { day: 'Mon', fullDay: 'Monday', thisWeekXp: 50, lastWeekXp: 50, thisWeekMinutes: 20, lastWeekMinutes: 20, lessonsCompleted: 2 },
    { day: 'Tue', fullDay: 'Tuesday', thisWeekXp: 50, lastWeekXp: 50, thisWeekMinutes: 20, lastWeekMinutes: 20, lessonsCompleted: 2 },
    { day: 'Wed', fullDay: 'Wednesday', thisWeekXp: 50, lastWeekXp: 50, thisWeekMinutes: 20, lastWeekMinutes: 20, lessonsCompleted: 2 },
    { day: 'Thu', fullDay: 'Thursday', thisWeekXp: 0, lastWeekXp: 50, thisWeekMinutes: 0, lastWeekMinutes: 20, lessonsCompleted: 0 },
    { day: 'Fri', fullDay: 'Friday', thisWeekXp: 0, lastWeekXp: 50, thisWeekMinutes: 0, lastWeekMinutes: 20, lessonsCompleted: 0 },
    { day: 'Sat', fullDay: 'Saturday', thisWeekXp: 0, lastWeekXp: 50, thisWeekMinutes: 0, lastWeekMinutes: 20, lessonsCompleted: 0 },
    { day: 'Sun', fullDay: 'Sunday', thisWeekXp: 0, lastWeekXp: 50, thisWeekMinutes: 0, lastWeekMinutes: 20, lessonsCompleted: 0 },
  ];

  const summary = calculateWeeklySummary(mockDays);
  assert.equal(summary.activeDaysThisWeek, 3);
  assert.equal(summary.consistencyRating, 'Steady');
});

test('recordTodayActivity increments target day correctly without mutating original array', () => {
  const days = [...INITIAL_WEEKLY_DATA];
  const originalMonXp = days[0].thisWeekXp;

  // Simulate Monday (todayDayIndex = 1)
  const updated = recordTodayActivity(days, 30, 10, 1);
  assert.equal(updated[0].thisWeekXp, originalMonXp + 30);
  assert.equal(updated[0].thisWeekMinutes, days[0].thisWeekMinutes + 10);
  assert.equal(updated[0].lessonsCompleted, days[0].lessonsCompleted + 1);
  assert.equal(days[0].thisWeekXp, originalMonXp, 'Original array should not be mutated');
});
