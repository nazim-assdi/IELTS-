/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Award, Flame, Trophy, Shield } from 'lucide-react';
import { calculateLeague } from '../utils/ielts-scoring';

interface LeaderboardModalProps {
  userXp: number;
  userStreak: number;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ userXp, userStreak, onClose }) => {
  const currentLeague = calculateLeague(userXp);

  const competitors = [
    { name: 'Sarah M.', target: 'Band 8.5', xp: Math.max(userXp + 60, 480), flag: '🇬🇧', rank: 1 },
    { name: 'Kenji T.', target: 'Band 8.0', xp: Math.max(userXp + 25, 420), flag: '🇯🇵', rank: 2 },
    { name: 'You (Candidate)', target: 'Band 8.0+', xp: userXp, flag: '🌟', rank: 3, isUser: true },
    { name: 'Priya S.', target: 'Band 7.5', xp: Math.max(userXp - 40, 310), flag: '🇮🇳', rank: 4 },
    { name: 'Lucas D.', target: 'Band 7.5', xp: Math.max(userXp - 90, 240), flag: '🇧🇷', rank: 5 },
    { name: 'Elena V.', target: 'Band 7.0', xp: Math.max(userXp - 140, 180), flag: '🇩🇪', rank: 6 },
  ].sort((a, b) => b.xp - a.xp).map((item, idx) => ({ ...item, rank: idx + 1 }));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{currentLeague.icon}</div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Weekly League</div>
              <h3 className={`text-xl font-extrabold ${currentLeague.color}`}>{currentLeague.name} Division</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Leaderboard"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3 mb-5 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200">
          <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
          <span>Top 3 advance to the <strong>Diamond Band 9 League</strong> this Sunday!</span>
        </div>

        {/* Competitor List */}
        <div className="space-y-2 mb-6">
          {competitors.map((c) => (
            <div
              key={c.name}
              className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                c.isUser
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 text-center font-extrabold text-sm ${
                  c.rank === 1 ? 'text-amber-500' : c.rank === 2 ? 'text-slate-400' : c.rank === 3 ? 'text-amber-700' : 'text-slate-400'
                }`}>
                  #{c.rank}
                </span>
                <span className="text-lg">{c.flag}</span>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{c.name}</span>
                    {c.isUser && <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-full">YOU</span>}
                  </div>
                  <div className="text-[10px] text-slate-500">{c.target} Aspirant</div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">{c.xp}</span>
                <span className="text-[10px] font-bold text-slate-400 ml-1">XP</span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold text-sm rounded-2xl hover:opacity-90"
        >
          Keep Practicing
        </button>
      </div>
    </div>
  );
};
