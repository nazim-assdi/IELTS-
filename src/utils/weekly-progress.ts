/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DayProgress {
  day: string; // 'Mon', 'Tue', etc.
  fullDay: string; // 'Monday', 'Tuesday', etc.
  thisWeekXp: number;
  lastWeekXp: number;
  thisWeekMinutes: number;
  lastWeekMinutes: number;
  lessonsCompleted: number;
}

export interface WeeklySummary {
  thisWeekTotalXp: number;
  lastWeekTotalXp: number;
  xpDelta: number;
  xpDeltaPercentage: number;
  activeDaysThisWeek: number;
  activeDaysLastWeek: number;
  thisWeekTotalMinutes: number;
  lastWeekTotalMinutes: number;
  consistencyScore: number; // 0 to 100
  consistencyRating: 'Exceptional' | 'Strong' | 'Steady' | 'Needs Focus';
  consistencyFeedback: string;
}

export const INITIAL_WEEKLY_DATA: DayProgress[] = [
  { day: 'Mon', fullDay: 'Monday', thisWeekXp: 55, lastWeekXp: 40, thisWeekMinutes: 25, lastWeekMinutes: 20, lessonsCompleted: 3 },
  { day: 'Tue', fullDay: 'Tuesday', thisWeekXp: 70, lastWeekXp: 45, thisWeekMinutes: 30, lastWeekMinutes: 20, lessonsCompleted: 4 },
  { day: 'Wed', fullDay: 'Wednesday', thisWeekXp: 45, lastWeekXp: 50, thisWeekMinutes: 20, lastWeekMinutes: 25, lessonsCompleted: 2 },
  { day: 'Thu', fullDay: 'Thursday', thisWeekXp: 80, lastWeekXp: 35, thisWeekMinutes: 35, lastWeekMinutes: 15, lessonsCompleted: 5 },
  { day: 'Fri', fullDay: 'Friday', thisWeekXp: 60, lastWeekXp: 55, thisWeekMinutes: 25, lastWeekMinutes: 25, lessonsCompleted: 3 },
  { day: 'Sat', fullDay: 'Saturday', thisWeekXp: 90, lastWeekXp: 60, thisWeekMinutes: 40, lastWeekMinutes: 30, lessonsCompleted: 5 },
  { day: 'Sun', fullDay: 'Sunday', thisWeekXp: 40, lastWeekXp: 25, thisWeekMinutes: 20, lastWeekMinutes: 15, lessonsCompleted: 2 },
];

/**
 * Pure function to calculate weekly metrics from day-by-day logs.
 */
export function calculateWeeklySummary(days: DayProgress[]): WeeklySummary {
  if (!days || days.length === 0) {
    return {
      thisWeekTotalXp: 0,
      lastWeekTotalXp: 0,
      xpDelta: 0,
      xpDeltaPercentage: 0,
      activeDaysThisWeek: 0,
      activeDaysLastWeek: 0,
      thisWeekTotalMinutes: 0,
      lastWeekTotalMinutes: 0,
      consistencyScore: 0,
      consistencyRating: 'Needs Focus',
      consistencyFeedback: 'Start your first lesson today to build momentum towards Band 8+.',
    };
  }

  const thisWeekTotalXp = days.reduce((sum, d) => sum + (d.thisWeekXp || 0), 0);
  const lastWeekTotalXp = days.reduce((sum, d) => sum + (d.lastWeekXp || 0), 0);
  const thisWeekTotalMinutes = days.reduce((sum, d) => sum + (d.thisWeekMinutes || 0), 0);
  const lastWeekTotalMinutes = days.reduce((sum, d) => sum + (d.lastWeekMinutes || 0), 0);

  const activeDaysThisWeek = days.filter(d => (d.thisWeekXp || 0) > 0).length;
  const activeDaysLastWeek = days.filter(d => (d.lastWeekXp || 0) > 0).length;

  const xpDelta = thisWeekTotalXp - lastWeekTotalXp;
  const xpDeltaPercentage = lastWeekTotalXp > 0
    ? Math.round((xpDelta / lastWeekTotalXp) * 100)
    : (thisWeekTotalXp > 0 ? 100 : 0);

  // Consistency score based on active days (70%) and daily distribution balance (30%)
  const daysActiveRatio = activeDaysThisWeek / days.length;
  const consistencyScore = Math.min(100, Math.round(daysActiveRatio * 100));

  let consistencyRating: WeeklySummary['consistencyRating'] = 'Needs Focus';
  let consistencyFeedback = 'Consistency is key for IELTS reflex memory. Aim for at least 15 mins daily.';

  if (activeDaysThisWeek >= 6) {
    consistencyRating = 'Exceptional';
    consistencyFeedback = `Outstanding discipline! You practiced ${activeDaysThisWeek}/7 days, matching the daily immersion routine of Band 9 scorers.`;
  } else if (activeDaysThisWeek >= 4) {
    consistencyRating = 'Strong';
    consistencyFeedback = `Solid weekly routine with ${activeDaysThisWeek} active days and +${thisWeekTotalXp} XP. You are outpacing last week's velocity.`;
  } else if (activeDaysThisWeek >= 2) {
    consistencyRating = 'Steady';
    consistencyFeedback = `${activeDaysThisWeek} days active this week. Try adding 1 speaking mock every 2 days to maintain fluency momentum.`;
  }

  return {
    thisWeekTotalXp,
    lastWeekTotalXp,
    xpDelta,
    xpDeltaPercentage,
    activeDaysThisWeek,
    activeDaysLastWeek,
    thisWeekTotalMinutes,
    lastWeekTotalMinutes,
    consistencyScore,
    consistencyRating,
    consistencyFeedback,
  };
}

/**
 * Updates today's day progress with newly completed activity
 */
export function recordTodayActivity(
  days: DayProgress[],
  earnedXp: number,
  earnedMinutes: number,
  todayDayIndex = new Date().getDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
): DayProgress[] {
  // Convert JS Sunday-first index to Monday-first index: 0(Sun)->6, 1(Mon)->0, 2(Tue)->1, etc.
  const mappedIndex = todayDayIndex === 0 ? 6 : todayDayIndex - 1;
  const targetIndex = mappedIndex >= 0 && mappedIndex < days.length ? mappedIndex : 0;

  return days.map((day, idx) => {
    if (idx === targetIndex) {
      return {
        ...day,
        thisWeekXp: day.thisWeekXp + earnedXp,
        thisWeekMinutes: day.thisWeekMinutes + earnedMinutes,
        lessonsCompleted: day.lessonsCompleted + 1,
      };
    }
    return day;
  });
}
