/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Clock, Play, Pause, RotateCcw, Sparkles, BookOpen, Volume2, Mic } from 'lucide-react';
import { CUE_CARDS_BANK } from '../data/curriculum';
import { sound } from '../utils/sound';

export const CueCardModal: React.FC<{ onClose: () => void; onStartPracticeWithCard?: (topic: string) => void }> = ({
  onClose,
  onStartPracticeWithCard,
}) => {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [cards, setCards] = useState(CUE_CARDS_BANK);
  const [isGenerating, setIsGenerating] = useState(false);

  // Timers
  const [prepTime, setPrepTime] = useState(60);
  const [isPrepActive, setIsPrepActive] = useState(false);
  const [speakTime, setSpeakTime] = useState(120);
  const [isSpeakActive, setIsSpeakActive] = useState(false);
  const [notes, setNotes] = useState('');

  const current = cards[activeCardIndex];

  // Prep timer effect
  useEffect(() => {
    let t: any = null;
    if (isPrepActive && prepTime > 0) {
      t = setInterval(() => setPrepTime(p => p - 1), 1000);
    } else if (prepTime === 0 && isPrepActive) {
      setIsPrepActive(false);
      sound.playReward();
    }
    return () => clearInterval(t);
  }, [isPrepActive, prepTime]);

  // Speak timer effect
  useEffect(() => {
    let t: any = null;
    if (isSpeakActive && speakTime > 0) {
      t = setInterval(() => setSpeakTime(s => s - 1), 1000);
    } else if (speakTime === 0 && isSpeakActive) {
      setIsSpeakActive(false);
      sound.playVictory();
    }
    return () => clearInterval(t);
  }, [isSpeakActive, speakTime]);

  // Reset timers on card switch
  const selectCard = (idx: number) => {
    sound.playTap();
    setActiveCardIndex(idx);
    setPrepTime(60);
    setIsPrepActive(false);
    setSpeakTime(120);
    setIsSpeakActive(false);
    setNotes('');
  };

  // Generate new cue card with Gemini
  const handleGenerateFreshCueCard = async () => {
    setIsGenerating(true);
    sound.playTap();
    try {
      const res = await fetch('/api/gemini/generate-cue-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'Environment, Culture, Modern Society' }),
      });
      const data = await res.json();
      if (data && data.topic) {
        const newCard = {
          id: `cue-${Date.now()}`,
          category: data.topic,
          title: data.promptText.split('\n')[0] || data.topic,
          promptText: data.promptText,
          prepTimeSeconds: 60,
          speakTimeSeconds: 120,
          vocabulary: data.vocabularyHints || [],
          part3Questions: data.part3FollowUps || [],
        };
        setCards(prev => [newCard, ...prev]);
        setActiveCardIndex(0);
        sound.playReward();
      }
    } catch (err) {
      console.error('Failed to generate cue card:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
          <div>
            <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1">
              IELTS Speaking Part 2
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Candidate Task Card Deck & 2-Minute Monologue
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Cue Cards"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Selector Row + AI Generator */}
        <div className="flex items-center justify-between gap-3 mb-6 overflow-x-auto pb-1">
          <div className="flex items-center gap-2">
            {cards.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => selectCard(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeCardIndex === idx
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {c.category}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerateFreshCueCard}
            disabled={isGenerating}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold rounded-xl whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm active:translate-y-0.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Drafting with Gemini...' : '+ Generate New AI Cue Card'}</span>
          </button>
        </div>

        {/* Main Task Card View */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Official Candidate Cue Card (2 Cols) */}
          <div className="md:col-span-2 bg-gradient-to-br from-amber-50/60 to-orange-50/60 dark:from-slate-800 dark:to-slate-850 border-2 border-amber-200 dark:border-amber-900/60 rounded-3xl p-6 shadow-sm">
            <div className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-3">
              IELTS Candidate Task Card
            </div>
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">
              {current.title}
            </h4>
            <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-medium mb-6">
              {current.promptText}
            </div>

            {/* High-Band Vocabulary Hints */}
            <div className="pt-4 border-t border-amber-200/80 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Band 8.5 Collocations to Weave In:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {current.vocabulary.map((v, i) => (
                  <div key={i} className="p-2 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-200/60 dark:border-slate-800 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block">{v.phrase}</span>
                    <span className="text-[10px] text-slate-500">{v.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Timers & Candidate Scratchpad (1 Col) */}
          <div className="md:col-span-1 space-y-4">
            {/* 1-Minute Prep Countdown */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Prep Time:
                </span>
                <span className="font-mono text-base font-extrabold text-amber-600 dark:text-amber-400">
                  {prepTime}s
                </span>
              </div>
              <button
                onClick={() => setIsPrepActive(!isPrepActive)}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:translate-y-0.5"
              >
                {isPrepActive ? 'Pause 1-Min Prep' : 'Start 1-Min Prep'}
              </button>
            </div>

            {/* Scratchpad */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Exam Scratchpad (Pencil Notes):
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Jot bullet points (Who, When, Climax, Feelings)..."
                rows={4}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* 2-Minute Monologue Countdown */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-emerald-500" />
                  Speech Time:
                </span>
                <span className="font-mono text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {Math.floor(speakTime / 60)}:{(speakTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <button
                onClick={() => setIsSpeakActive(!isSpeakActive)}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:translate-y-0.5"
              >
                {isSpeakActive ? 'Pause Speaking' : 'Start 2-Min Speech'}
              </button>
            </div>
          </div>
        </div>

        {/* Action Button: Jump to Live Voice Studio with this topic */}
        <button
          onClick={() => {
            sound.playTap();
            onStartPracticeWithCard?.(current.title);
            onClose();
          }}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-2xl shadow-[0_4px_0_0_#059669] active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          <Mic className="w-4 h-4" />
          <span>Practice This Cue Card Live with Dr. Arthur James</span>
        </button>
      </div>
    </div>
  );
};
