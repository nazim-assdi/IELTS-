/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOverallBand, calculateLeague, updateStreak } from './ielts-scoring.ts';
import { build100Units, IELTS_SECTIONS } from '../data/curriculum.ts';

test('calculateOverallBand applies official IELTS rounding rules correctly', () => {
  // Test case 1: Exact whole number
  assert.equal(calculateOverallBand({
    fluencyCoherence: 7.0,
    lexicalResource: 7.0,
    grammaticalRange: 7.0,
    pronunciation: 7.0
  }), 7.0);

  // Test case 2: Average ends in .25 -> rounds up to .5
  assert.equal(calculateOverallBand({
    fluencyCoherence: 6.0,
    lexicalResource: 6.0,
    grammaticalRange: 6.5,
    pronunciation: 6.5
  }), 6.5);

  // Test case 3: Average ends in .75 -> rounds up to next whole band
  assert.equal(calculateOverallBand({
    fluencyCoherence: 6.5,
    lexicalResource: 6.5,
    grammaticalRange: 7.0,
    pronunciation: 7.0
  }), 7.0);

  // Test case 4: Average ends in .125 -> rounds down to .0
  assert.equal(calculateOverallBand({
    fluencyCoherence: 6.0,
    lexicalResource: 6.0,
    grammaticalRange: 6.0,
    pronunciation: 6.5
  }), 6.0);

  // Test case 5: Band 9 maximum cap
  assert.equal(calculateOverallBand({
    fluencyCoherence: 9.0,
    lexicalResource: 9.0,
    grammaticalRange: 9.0,
    pronunciation: 9.0
  }), 9.0);
});

test('calculateLeague gives appropriate tiers for XP values', () => {
  assert.equal(calculateLeague(0).name, 'Bronze');
  assert.equal(calculateLeague(150).name, 'Bronze');
  assert.equal(calculateLeague(250).name, 'Silver');
  assert.equal(calculateLeague(600).name, 'Gold');
  assert.equal(calculateLeague(1200).name, 'Sapphire');
  assert.equal(calculateLeague(5500).name, 'Diamond Band 9');
});

test('updateStreak handles consecutive days and gaps properly', () => {
  assert.equal(updateStreak(0, null, '2026-11-02'), 1);
  assert.equal(updateStreak(5, '2026-11-02', '2026-11-02'), 5);
  assert.equal(updateStreak(3, '2026-11-01', '2026-11-02'), 4);
  assert.equal(updateStreak(10, '2026-10-30', '2026-11-02'), 1);
});

test('100 units curriculum generates exactly 100 complete units across 10 sections', () => {
  const units = build100Units();
  assert.equal(units.length, 100, 'Must generate exactly 100 units');
  assert.equal(IELTS_SECTIONS.length, 10, 'Must have 10 sections');

  // Verify first and last units
  assert.equal(units[0].unitNumber, 1);
  assert.equal(units[0].sectionNumber, 1);
  assert.equal(units[99].unitNumber, 100);
  assert.equal(units[99].sectionNumber, 10);

  // Verify every unit has lessons with valid interactive questions
  for (const unit of units) {
    assert.ok(unit.lessons.length >= 2, `Unit ${unit.unitNumber} must have at least 2 lessons`);
    for (const lesson of unit.lessons) {
      assert.ok(lesson.questions.length >= 2, `Lesson ${lesson.id} must have questions`);
    }
  }
});
