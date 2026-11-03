/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateAnalyticsSummary, 
  getLast10Sessions, 
  INITIAL_PRACTICE_SESSIONS,
  PracticeSessionRecord 
} from './speaking-analytics.ts';

test('getLast10Sessions returns exactly 10 sessions when 10 or more provided', () => {
  const result = getLast10Sessions(INITIAL_PRACTICE_SESSIONS);
  assert.equal(result.length, 10);
  assert.equal(result[0].sessionNumber, 1);
  assert.equal(result[9].sessionNumber, 10);

  // If 12 sessions provided, returns the last 10
  const extraSessions: PracticeSessionRecord[] = [
    ...INITIAL_PRACTICE_SESSIONS,
    {
      id: 's-11',
      sessionNumber: 11,
      date: 'Nov 03',
      topic: 'Education Systems',
      part: 'Part 3',
      overallBand: 8.5,
      fluency: 8.5,
      lexical: 8.5,
      grammar: 8.5,
      pronunciation: 8.5,
      examinerNotes: 'Flawless',
    },
    {
      id: 's-12',
      sessionNumber: 12,
      date: 'Nov 04',
      topic: 'Space Exploration',
      part: 'Part 2',
      overallBand: 9.0,
      fluency: 9.0,
      lexical: 9.0,
      grammar: 9.0,
      pronunciation: 9.0,
      examinerNotes: 'Band 9 mastery',
    },
  ];

  const sliced = getLast10Sessions(extraSessions);
  assert.equal(sliced.length, 10);
  assert.equal(sliced[0].sessionNumber, 3);
  assert.equal(sliced[9].sessionNumber, 12);
});

test('calculateAnalyticsSummary computes metrics accurately', () => {
  const summary = calculateAnalyticsSummary(INITIAL_PRACTICE_SESSIONS);
  assert.equal(summary.totalSessions, 10);
  assert.equal(summary.startingBand, 6.0);
  assert.equal(summary.latestBand, 8.0);
  assert.equal(summary.bandDelta, 2.0); // +2.0 Band increase
  assert.ok(summary.averageBand >= 7.0 && summary.averageBand <= 7.5);
  assert.equal(summary.highestBand, 8.0);
  assert.ok(summary.strongestCriterion.name.length > 0);
});

test('calculateAnalyticsSummary handles empty array gracefully', () => {
  const empty = calculateAnalyticsSummary([]);
  assert.equal(empty.totalSessions, 0);
  assert.equal(empty.latestBand, 0);
  assert.equal(empty.bandDelta, 0);
});
