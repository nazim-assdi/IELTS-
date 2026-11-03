/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PracticeSessionRecord {
  id: string;
  sessionNumber: number;
  date: string;
  topic: string;
  part: 'Part 1' | 'Part 2' | 'Part 3' | 'Full Mock';
  overallBand: number;
  fluency: number;
  lexical: number;
  grammar: number;
  pronunciation: number;
  examinerNotes: string;
}

export interface AnalyticsSummary {
  latestBand: number;
  startingBand: number;
  bandDelta: number;
  averageBand: number;
  highestBand: number;
  totalSessions: number;
  strongestCriterion: { name: string; score: number };
  weakestCriterion: { name: string; score: number };
}

/**
 * Calculates summary metrics for the given practice session records.
 */
export function calculateAnalyticsSummary(sessions: PracticeSessionRecord[]): AnalyticsSummary {
  if (!sessions || sessions.length === 0) {
    return {
      latestBand: 0,
      startingBand: 0,
      bandDelta: 0,
      averageBand: 0,
      highestBand: 0,
      totalSessions: 0,
      strongestCriterion: { name: 'N/A', score: 0 },
      weakestCriterion: { name: 'N/A', score: 0 },
    };
  }

  const sorted = [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
  const latest = sorted[sorted.length - 1];
  const starting = sorted[0];
  const latestBand = latest.overallBand;
  const startingBand = starting.overallBand;
  const bandDelta = Math.round((latestBand - startingBand) * 10) / 10;

  const totalBand = sorted.reduce((sum, s) => sum + s.overallBand, 0);
  const averageBand = Math.round((totalBand / sorted.length) * 10) / 10;
  const highestBand = Math.max(...sorted.map(s => s.overallBand));

  // Compute criteria averages across all sessions
  const criteriaAvg = {
    'Fluency & Coherence': sorted.reduce((sum, s) => sum + s.fluency, 0) / sorted.length,
    'Lexical Resource': sorted.reduce((sum, s) => sum + s.lexical, 0) / sorted.length,
    'Grammatical Range': sorted.reduce((sum, s) => sum + s.grammar, 0) / sorted.length,
    'Pronunciation': sorted.reduce((sum, s) => sum + s.pronunciation, 0) / sorted.length,
  };

  const criteriaEntries = Object.entries(criteriaAvg).map(([name, score]) => ({
    name,
    score: Math.round(score * 10) / 10,
  }));

  criteriaEntries.sort((a, b) => b.score - a.score);

  return {
    latestBand,
    startingBand,
    bandDelta,
    averageBand,
    highestBand,
    totalSessions: sorted.length,
    strongestCriterion: criteriaEntries[0],
    weakestCriterion: criteriaEntries[criteriaEntries.length - 1],
  };
}

/**
 * Slices the sessions to the last 10 practice sessions for charting.
 */
export function getLast10Sessions(sessions: PracticeSessionRecord[]): PracticeSessionRecord[] {
  const sorted = [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
  return sorted.slice(-10);
}

/**
 * Default benchmark sessions for initial demo state if user has fewer than 10 sessions.
 */
export const INITIAL_PRACTICE_SESSIONS: PracticeSessionRecord[] = [
  {
    id: 's-1',
    sessionNumber: 1,
    date: 'Oct 12',
    topic: 'Hometown & Daily Habits',
    part: 'Part 1',
    overallBand: 6.0,
    fluency: 6.0,
    lexical: 6.0,
    grammar: 5.5,
    pronunciation: 6.5,
    examinerNotes: 'Hesitant transitions; repeated simple vocabulary.',
  },
  {
    id: 's-2',
    sessionNumber: 2,
    date: 'Oct 14',
    topic: 'Work, Career & Studies',
    part: 'Part 1',
    overallBand: 6.5,
    fluency: 6.5,
    lexical: 6.5,
    grammar: 6.0,
    pronunciation: 6.5,
    examinerNotes: 'Improved pacing and clearer discourse markers.',
  },
  {
    id: 's-3',
    sessionNumber: 3,
    date: 'Oct 17',
    topic: 'Memorable Journey Monologue',
    part: 'Part 2',
    overallBand: 6.5,
    fluency: 6.5,
    lexical: 6.5,
    grammar: 6.5,
    pronunciation: 7.0,
    examinerNotes: 'Maintained flow throughout the 2-minute speaking cue card.',
  },
  {
    id: 's-4',
    sessionNumber: 4,
    date: 'Oct 19',
    topic: 'Environmental Preservation',
    part: 'Part 3',
    overallBand: 7.0,
    fluency: 7.0,
    lexical: 7.0,
    grammar: 6.5,
    pronunciation: 7.0,
    examinerNotes: 'Introduced nuanced collocations and complex conditionals.',
  },
  {
    id: 's-5',
    sessionNumber: 5,
    date: 'Oct 22',
    topic: 'Artificial Intelligence & Ethics',
    part: 'Part 3',
    overallBand: 7.0,
    fluency: 7.0,
    lexical: 7.5,
    grammar: 7.0,
    pronunciation: 7.0,
    examinerNotes: 'Sophisticated academic phrasing regarding technological disruption.',
  },
  {
    id: 's-6',
    sessionNumber: 6,
    date: 'Oct 25',
    topic: 'Full Cambridge Mock Exam 1',
    part: 'Full Mock',
    overallBand: 7.0,
    fluency: 7.0,
    lexical: 7.5,
    grammar: 7.0,
    pronunciation: 7.0,
    examinerNotes: 'Solid stamina across all 3 parts of the interview.',
  },
  {
    id: 's-7',
    sessionNumber: 7,
    date: 'Oct 28',
    topic: 'Urban Infrastructure & Transit',
    part: 'Part 2',
    overallBand: 7.5,
    fluency: 7.5,
    lexical: 8.0,
    grammar: 7.0,
    pronunciation: 7.5,
    examinerNotes: 'Excellent idiomatic collocations: "densely populated metropolis".',
  },
  {
    id: 's-8',
    sessionNumber: 8,
    date: 'Oct 30',
    topic: 'Global Economics & Consumerism',
    part: 'Part 3',
    overallBand: 7.5,
    fluency: 7.5,
    lexical: 8.0,
    grammar: 7.5,
    pronunciation: 7.5,
    examinerNotes: 'High-level speculative structures and natural hedging.',
  },
  {
    id: 's-9',
    sessionNumber: 9,
    date: 'Nov 01',
    topic: 'Cultural Heritage & Arts',
    part: 'Part 1',
    overallBand: 8.0,
    fluency: 8.0,
    lexical: 8.0,
    grammar: 8.0,
    pronunciation: 8.0,
    examinerNotes: 'Spontaneous flow, natural British stress patterns, zero unnatural pauses.',
  },
  {
    id: 's-10',
    sessionNumber: 10,
    date: 'Nov 02',
    topic: 'Full Cambridge Mock Exam 2',
    part: 'Full Mock',
    overallBand: 8.0,
    fluency: 8.0,
    lexical: 8.5,
    grammar: 8.0,
    pronunciation: 8.0,
    examinerNotes: 'Near-native fluency with command of Band 8.5+ Cambridge descriptors.',
  },
];
