/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BandScores {
  fluencyCoherence: number;
  lexicalResource: number;
  grammaticalRange: number;
  pronunciation: number;
}

export interface EvaluationResult {
  overallBand: number;
  scores: BandScores;
  criteriaFeedback: {
    fluency: string;
    lexical: string;
    grammar: string;
    pronunciation: string;
  };
  strengths: string[];
  improvements: string[];
  vocabularySuggestions: Array<{
    original: string;
    better: string;
    reason: string;
  }>;
  band9Sample: string;
}

/**
 * Calculates official IELTS overall band from 4 sub-scores.
 * Rule:
 * If the average ends in .25, it rounds UP to the next half band (e.g. 6.25 -> 6.5).
 * If the average ends in .75, it rounds UP to the next whole band (e.g. 6.75 -> 7.0).
 * If below .25, rounds down to whole band (e.g. 6.125 -> 6.0).
 * If between .25 and .75 but below .75 (e.g. 6.375 -> 6.5; 6.625 -> 6.5).
 */
export function calculateOverallBand(scores: BandScores): number {
  const { fluencyCoherence, lexicalResource, grammaticalRange, pronunciation } = scores;
  const rawAverage = (fluencyCoherence + lexicalResource + grammaticalRange + pronunciation) / 4;
  
  const whole = Math.floor(rawAverage);
  const decimal = rawAverage - whole;

  let roundedDecimal = 0;
  if (decimal < 0.25) {
    roundedDecimal = 0;
  } else if (decimal < 0.75) {
    roundedDecimal = 0.5;
  } else {
    roundedDecimal = 1.0;
  }

  const result = whole + roundedDecimal;
  return Math.min(9.0, Math.max(1.0, Number(result.toFixed(1))));
}

export interface UserStats {
  xp: number;
  streak: number;
  gems: number;
  hearts: number;
  completedLessons: string[];
  lastPracticeDate: string | null;
}

/**
 * Determines current league based on total XP
 */
export function calculateLeague(xp: number): { name: string; minXp: number; color: string; icon: string } {
  const leagues = [
    { name: 'Bronze', minXp: 0, color: 'text-amber-700', icon: '🥉' },
    { name: 'Silver', minXp: 200, color: 'text-slate-400', icon: '🥈' },
    { name: 'Gold', minXp: 500, color: 'text-yellow-500', icon: '🥇' },
    { name: 'Sapphire', minXp: 1000, color: 'text-blue-500', icon: '💎' },
    { name: 'Ruby', minXp: 2000, color: 'text-rose-500', icon: '🔮' },
    { name: 'Emerald', minXp: 3500, color: 'text-emerald-500', icon: '👑' },
    { name: 'Diamond Band 9', minXp: 5000, color: 'text-cyan-400', icon: '⚡' },
  ];

  for (let i = leagues.length - 1; i >= 0; i--) {
    if (xp >= leagues[i].minXp) {
      return leagues[i];
    }
  }
  return leagues[0];
}

/**
 * Calculates updated streak given the previous stats and current date
 */
export function updateStreak(currentStreak: number, lastDateStr: string | null, todayStr: string): number {
  if (!lastDateStr) return 1;
  if (lastDateStr === todayStr) return currentStreak;

  const lastDate = new Date(lastDateStr);
  const today = new Date(todayStr);
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 1) {
    return currentStreak + 1;
  } else if (diffDays > 1) {
    return 1; // Streak reset
  }
  return currentStreak;
}
