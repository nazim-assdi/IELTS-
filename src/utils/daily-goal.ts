/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DailyGoalMode = 'lessons' | 'minutes';
export type DailyGoalDifficulty = 'casual' | 'regular' | 'serious' | 'hero';

export interface DailyGoalPreset {
  id: DailyGoalDifficulty;
  name: string;
  targetLessons: number;
  targetMinutes: number;
  description: string;
  targetBand: string;
  bonusGems: number;
  bonusXp: number;
}

export const DAILY_GOAL_PRESETS: Record<DailyGoalDifficulty, DailyGoalPreset> = {
  casual: {
    id: 'casual',
    name: 'Casual',
    targetLessons: 1,
    targetMinutes: 5,
    description: '1 lesson or 5 mins / day',
    targetBand: 'Band 6.0',
    bonusGems: 10,
    bonusXp: 15,
  },
  regular: {
    id: 'regular',
    name: 'Regular',
    targetLessons: 3,
    targetMinutes: 15,
    description: '3 lessons or 15 mins / day',
    targetBand: 'Band 7.0 - 7.5',
    bonusGems: 20,
    bonusXp: 30,
  },
  serious: {
    id: 'serious',
    name: 'Serious',
    targetLessons: 5,
    targetMinutes: 25,
    description: '5 lessons or 25 mins / day',
    targetBand: 'Band 8.0',
    bonusGems: 35,
    bonusXp: 50,
  },
  hero: {
    id: 'hero',
    name: 'IELTS Hero',
    targetLessons: 8,
    targetMinutes: 40,
    description: '8 lessons or 40 mins / day',
    targetBand: 'Band 8.5 - 9.0',
    bonusGems: 50,
    bonusXp: 80,
  },
};

export interface GoalProgressResult {
  percent: number;
  isCompleted: boolean;
  remaining: number;
  current: number;
  target: number;
}

/**
 * Calculates current progress percentage capped between 0 and 100.
 */
export function calculateGoalProgress(current: number, target: number): GoalProgressResult {
  const safeTarget = Math.max(1, target);
  const safeCurrent = Math.max(0, current);
  const rawRatio = (safeCurrent / safeTarget) * 100;
  const percent = Math.min(100, Math.round(rawRatio));
  const isCompleted = safeCurrent >= safeTarget;
  const remaining = Math.max(0, safeTarget - safeCurrent);

  return {
    percent,
    isCompleted,
    remaining,
    current: safeCurrent,
    target: safeTarget,
  };
}

/**
 * Generates Duo-style mascot contextual motivational cheers based on daily progress.
 */
export function getMascotGoalReaction(
  percent: number,
  mode: DailyGoalMode,
  remaining: number
): { message: string; mood: 'happy' | 'thinking' | 'celebrate' | 'coaching'; statusTag: string } {
  if (percent >= 100) {
    return {
      message: "Goal Smashed! 🎉 You're studying like a true Band 9 IELTS Hero today! Claim your bonus chest!",
      mood: 'celebrate',
      statusTag: 'Goal Smashed!',
    };
  }

  if (percent >= 70) {
    return {
      message: `So close! Only ${remaining} more ${mode === 'lessons' ? 'lesson' : 'minute'}${remaining === 1 ? '' : 's'} to hit today's target! Keep the momentum!`,
      mood: 'coaching',
      statusTag: 'Almost There!',
    };
  }

  if (percent >= 30) {
    return {
      message: "Halfway through your daily target! Cambridge examiners admire consistent daily conditioning.",
      mood: 'happy',
      statusTag: 'On Track',
    };
  }

  return {
    message: "Start today's first drill to lock in your daily streak and build fluent speech instincts!",
    mood: 'thinking',
    statusTag: 'Ready to Learn',
  };
}

/**
 * Formats seconds or minutes into a human-friendly study timer string.
 */
export function formatPracticeTime(minutes: number, seconds: number = 0): string {
  const totalSecs = Math.max(0, Math.floor(minutes * 60 + seconds));
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}
