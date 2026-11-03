/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface OllieMascotProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  mood?: 'happy' | 'thinking' | 'celebrate' | 'coaching';
  className?: string;
}

export const OllieMascot: React.FC<OllieMascotProps> = ({
  message = "Ready to boost your Speaking band today? Let's aim for Band 8.0!",
  size = 'md',
  mood = 'happy',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24 sm:w-28 sm:h-28',
    lg: 'w-36 h-36 sm:w-44 sm:h-44',
  };

  const getMoodBadge = () => {
    switch (mood) {
      case 'celebrate':
        return '🎉 Spot on!';
      case 'thinking':
        return '🤔 Analyzing grammar...';
      case 'coaching':
        return '💡 Examiner Pro-Tip';
      default:
        return '🎓 Cambridge Band 9 Mentor';
    }
  };

  return (
    <div className={`flex items-start gap-4 ${className}`}>
      <div className="relative shrink-0">
        <div className={`${sizeClasses[size]} rounded-3xl overflow-hidden border-4 border-emerald-500 bg-emerald-50 dark:bg-slate-800 shadow-md relative group transition-transform duration-300 hover:scale-105`}>
          <img
            src="/src/assets/images/examiner_alistair_avatar_1793681330477.jpg"
            alt="Cambridge Senior IELTS Examiner"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          {/* Official Band 9 Badge */}
          <div className="absolute top-1 right-1 bg-amber-400 text-amber-950 font-black text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">
            Band 9
          </div>
        </div>
      </div>

      {message && (
        <div className="relative bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm max-w-md">
          {/* Speech bubble pointer triangle */}
          <div className="absolute top-6 -left-2.5 w-4 h-4 bg-white dark:bg-slate-800 border-l-2 border-b-2 border-slate-200 dark:border-slate-700 transform rotate-45" />
          
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {getMoodBadge()}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
            {message}
          </p>
        </div>
      )}
    </div>
  );
};
