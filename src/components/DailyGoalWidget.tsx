/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Target, Flame, Sparkles, CheckCircle2, Clock, BookOpen, 
  Settings2, Gift, ShieldCheck, ChevronRight, Zap, Trophy 
} from 'lucide-react';
import { 
  DailyGoalMode, 
  DailyGoalDifficulty, 
  DAILY_GOAL_PRESETS, 
  calculateGoalProgress, 
  getMascotGoalReaction,
  formatPracticeTime 
} from '../utils/daily-goal';
import { sound } from '../utils/sound';

interface DailyGoalWidgetProps {
  completedLessonsCount: number;
  practiceMinutes: number;
  onClaimReward: (gems: number, xp: number) => void;
  onQuickPractice?: () => void;
  onOpenVoiceStudio?: () => void;
}

export const DailyGoalWidget: React.FC<DailyGoalWidgetProps> = ({
  completedLessonsCount,
  practiceMinutes,
  onClaimReward,
  onQuickPractice,
  onOpenVoiceStudio,
}) => {
  const [mode, setMode] = useState<DailyGoalMode>('lessons');
  const [difficulty, setDifficulty] = useState<DailyGoalDifficulty>('regular');
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);

  const preset = DAILY_GOAL_PRESETS[difficulty];
  const targetValue = mode === 'lessons' ? preset.targetLessons : preset.targetMinutes;
  const currentValue = mode === 'lessons' ? completedLessonsCount : practiceMinutes;

  const progress = calculateGoalProgress(currentValue, targetValue);
  const reaction = getMascotGoalReaction(progress.percent, mode, progress.remaining);

  const handleClaim = () => {
    if (rewardClaimed || !progress.isCompleted) return;
    sound.playReward();
    sound.playVictory();
    setRewardClaimed(true);
    onClaimReward(preset.bonusGems, preset.bonusXp);
  };

  const handleModeSwitch = (newMode: DailyGoalMode) => {
    sound.playTap();
    setMode(newMode);
  };

  const handleSelectDifficulty = (tier: DailyGoalDifficulty) => {
    sound.playTap();
    setDifficulty(tier);
    setShowConfig(false);
  };

  return (
    <div className={`relative bg-white dark:bg-slate-900 border-2 rounded-3xl p-5 shadow-sm transition-all duration-300 ${
      progress.isCompleted 
        ? 'border-amber-400 dark:border-amber-500/80 shadow-[0_4px_20px_rgba(251,191,36,0.15)] ring-2 ring-amber-300/40' 
        : 'border-slate-200 dark:border-slate-800'
    }`}>
      {/* Top Header Row: Duolingo-styled Mascot Emblem + Title + Settings Gear */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          {/* Cambridge Academic IELTS Hero Goal Crest */}
          <div className="relative group cursor-pointer" onClick={() => sound.playStreak()}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-2 flex items-center justify-center shadow-md border-b-2 border-emerald-900/60 transition-transform active:scale-95 group-hover:scale-105">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            {/* Blinking mood status ring */}
            <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
              progress.isCompleted ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
            }`} />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                Daily Goal
              </h4>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                progress.isCompleted 
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {reaction.statusTag}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-700 dark:text-slate-300">{preset.name}</span>
              <span>•</span>
              <span>{preset.targetBand}</span>
            </div>
          </div>
        </div>

        {/* Configure Goal Button */}
        <button
          onClick={() => {
            sound.playTap();
            setShowConfig(!showConfig);
          }}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Adjust Daily Target & Difficulty"
          aria-label="Daily Goal Settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Target Difficulty Selector Dropdown / Tray (Collapsible) */}
      {showConfig && (
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Select Your Target Intensity:
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(DAILY_GOAL_PRESETS) as DailyGoalDifficulty[]).map((key) => {
              const item = DAILY_GOAL_PRESETS[key];
              const isSelected = difficulty === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectDifficulty(key)}
                  className={`p-2 rounded-xl text-left text-xs transition-all border ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 font-extrabold text-emerald-900 dark:text-emerald-300 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{item.name}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">+{item.bonusGems}💎</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {mode === 'lessons' ? `${item.targetLessons} lessons` : `${item.targetMinutes} mins`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dual Metric Mode Selector (Lessons vs Minutes) */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-3.5">
        <button
          onClick={() => handleModeSwitch('lessons')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mode === 'lessons'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>By Lessons</span>
        </button>
        <button
          onClick={() => handleModeSwitch('minutes')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mode === 'minutes'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>By Minutes</span>
        </button>
      </div>

      {/* Stats Counter & Target Row */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {mode === 'lessons' ? currentValue : formatPracticeTime(currentValue)}
          </span>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
            / {mode === 'lessons' ? `${targetValue} lessons` : `${targetValue} min goal`}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400">
          <span>{progress.percent}%</span>
          {progress.isCompleted && <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" />}
        </div>
      </div>

      {/* Duolingo-style 3D Glossy Progress Bar */}
      <div className="relative w-full h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700 shadow-inner">
        {/* Fill bar */}
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
            progress.isCompleted
              ? 'bg-gradient-to-r from-amber-400 to-yellow-400 shadow-[0_2px_0_0_#d97706]'
              : 'bg-gradient-to-r from-emerald-500 to-[#58cc02] shadow-[0_2px_0_0_#46a302]'
          }`}
          style={{ width: `${progress.percent}%` }}
        >
          {/* Subtle glossy shine top reflection */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-white/30 rounded-t-full" />
          
          {/* Animated diagonal candy stripe pattern */}
          <div 
            className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,0.4)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0.4)_75%,transparent_75%,transparent)] bg-[length:16px_16px] animate-[move-stripe_2s_linear_infinite]"
          />
        </div>

        {/* Milestone Tick Marks (25%, 50%, 75%) */}
        <div className="absolute inset-y-0 left-1/4 w-0.5 bg-white/40 pointer-events-none" />
        <div className="absolute inset-y-0 left-2/4 w-0.5 bg-white/40 pointer-events-none" />
        <div className="absolute inset-y-0 left-3/4 w-0.5 bg-white/40 pointer-events-none" />
      </div>

      {/* Motivational Advice Speech Bubble */}
      <div className="mt-3 p-3 bg-emerald-50/70 dark:bg-slate-800/60 rounded-2xl border border-emerald-100 dark:border-slate-700 flex items-start gap-2.5">
        <span className="text-base shrink-0 select-none">
          {progress.isCompleted ? '🏆' : '🎯'}
        </span>
        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
          {reaction.message}
        </p>
      </div>

      {/* Action Area: Goal Reached Reward Claim vs Quick Practice Sprint */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
        {progress.isCompleted ? (
          <div>
            {!rewardClaimed ? (
              <button
                onClick={handleClaim}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-amber-950 font-black text-xs rounded-xl shadow-[0_3px_0_0_#d97706] active:translate-y-0.5 hover:brightness-105 transition-all flex items-center justify-center gap-2"
              >
                <Gift className="w-4 h-4 fill-amber-950 animate-bounce" />
                <span>Claim Daily Goal Chest (+{preset.bonusGems} Gems & +{preset.bonusXp} XP)!</span>
              </button>
            ) : (
              <div className="flex items-center justify-between text-xs py-1 px-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Chest Claimed! Goal Met for Today
                </span>
                <span className="text-amber-600 dark:text-amber-400">+{preset.bonusGems} 💎</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            {/* Quick Practice Fluency Sprint */}
            {onOpenVoiceStudio && (
              <button
                onClick={() => {
                  sound.playTap();
                  onOpenVoiceStudio();
                }}
                className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                <span>+3 min Speaking Sprint</span>
              </button>
            )}

            {/* Streak Shield Indicator */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 font-bold shrink-0" title="Complete your goal to lock streak freeze">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
              <span>Streak Protected</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
