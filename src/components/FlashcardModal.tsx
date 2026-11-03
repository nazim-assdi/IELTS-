/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, RotateCw, Volume2, CheckCircle2, RotateCcw, Sparkles, 
  BookOpen, Lightbulb, AlertTriangle, ArrowRight, Check, Award
} from 'lucide-react';
import { sound } from '../utils/sound';

export interface Flashcard {
  id: string;
  collocation: string;
  originalSlip: string;
  definition: string;
  exampleSentence: string;
  examinerTip: string;
  category: string;
}

interface FlashcardModalProps {
  pastMistakes?: Array<{ original: string; better?: string; reason?: string }>;
  recentSpeech?: string;
  onClose: () => void;
  onEarnXp?: (amount: number) => void;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({
  pastMistakes = [],
  recentSpeech = '',
  onClose,
  onEarnXp,
}) => {
  const [cards, setCards] = useState<Flashcard[]>([
    {
      id: 'fc-default-1',
      collocation: 'Densely populated metropolis',
      originalSlip: pastMistakes[0]?.original || 'city is very crowded',
      definition: 'A large, heavily inhabited urban center with concentrated infrastructure and amenities',
      exampleSentence: 'Residing in a densely populated metropolis entails navigating relentless morning commutes, yet the cultural dividends are second to none.',
      examinerTip: 'Use in Part 1 Hometown or Part 3 Urban Planning to eliminate repetitive use of "crowded".',
      category: 'Hometown & Urban Living',
    },
    {
      id: 'fc-default-2',
      collocation: 'Marked disparity',
      originalSlip: pastMistakes[1]?.original || 'big difference',
      definition: 'A noticeable, significant inequality or gap between two conditions, socioeconomic classes, or demographics',
      exampleSentence: 'There exists a marked disparity in high-speed rail access between metropolitan corridors and rural hamlets.',
      examinerTip: 'Examiners award high Lexical Resource marks for academic nouns that replace simplistic adjectives like "big difference".',
      category: 'Abstract Debate (Part 3)',
    },
    {
      id: 'fc-default-3',
      collocation: 'Incur significant expenditure',
      originalSlip: 'cost too much money',
      definition: 'To spend or require substantial financial capital and budget allocation',
      exampleSentence: 'Municipalities incur significant expenditure when retrofitting legacy transport grids for electric fleets.',
      examinerTip: 'Replaces basic phrases like "cost a lot" with elevated professional phrasing.',
      category: 'Economics & Infrastructure',
    },
    {
      id: 'fc-default-4',
      collocation: 'Paradoxically enough',
      originalSlip: 'it is surprising that',
      definition: 'In a manner that appears contradictory on the surface yet reveals a profound underlying truth',
      exampleSentence: 'Paradoxically enough, ubiquitous smartphone usage has fostered greater emotional detachment in social settings.',
      examinerTip: 'Ideal cohesive discourse marker for opening counter-intuitive arguments in Speaking Part 3.',
      category: 'Cohesive Discourse Markers',
    },
    {
      id: 'fc-default-5',
      collocation: 'Hone professional acumen',
      originalSlip: 'learn good skills for job',
      definition: 'To sharpen, refine, and deepen insight, technical capability, and workplace judgment',
      exampleSentence: 'Interning at a multinational advisory allowed me to hone my financial acumen under tight turnaround deadlines.',
      examinerTip: 'Sophisticated collocation for Part 1 questions regarding employment, studies, and ambition.',
      category: 'Work & Ambition',
    },
    {
      id: 'fc-default-6',
      collocation: 'Second to none',
      originalSlip: 'very best in world',
      definition: 'Unrivaled, superior to all others of its kind in quality or excellence',
      exampleSentence: 'The culinary diversity across London is widely regarded as second to none.',
      examinerTip: 'A natural, authentic idiomatic phrase that avoids sounding like an overused informal cliché.',
      category: 'Idiomatic Language',
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentCard = cards[currentIndex];
  const progressPercent = ((currentIndex + 1) / cards.length) * 100;

  // British Speech synthesis for card collocation and example
  const speakText = (text: string) => {
    sound.playTap();
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Flip card handler with sound effect
  const handleFlip = () => {
    sound.playCardFlip();
    setIsFlipped(!isFlipped);
  };

  // Mark as Mastered
  const handleMastered = () => {
    sound.playCardMastered();
    setMasteredCount(prev => prev + 1);
    onEarnXp?.(5);

    advanceCard();
  };

  // Mark for Review
  const handleReview = () => {
    sound.playCardReview();
    setReviewCount(prev => prev + 1);

    // Re-queue card to end of deck
    setCards(prev => [...prev, currentCard]);
    advanceCard();
  };

  const advanceCard = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      sound.playVictory();
      setIsCompleted(true);
    }
  };

  // Generate new flashcards from Gemini based on user's past slips
  const handleGenerateWithGemini = async () => {
    setIsGenerating(true);
    sound.playTap();

    try {
      const res = await fetch('/api/gemini/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mistakes: pastMistakes.length > 0 ? pastMistakes : [
            { original: 'city is very crowded', better: 'densely populated metropolis', reason: 'High-band precision' },
            { original: 'big difference', better: 'marked disparity', reason: 'Academic contrast' },
          ],
          recentSpeech: recentSpeech || 'I come from a city that is very crowded and cost too much money.',
        }),
      });

      const data = await res.json();
      if (data && data.flashcards && data.flashcards.length > 0) {
        sound.playReward();
        setCards(data.flashcards);
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsCompleted(false);
        setMasteredCount(0);
        setReviewCount(0);
      }
    } catch (err) {
      console.error('Failed to generate cards:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Deck Complete Screen
  if (isCompleted) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl animate-in zoom-in-95">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-4xl mb-3 shadow-md">
            🎯
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
            Flashcard Review Completed!
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-6">
            You just turned your previous speaking slips into native Band 8.5 collocations.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase">Mastered</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{masteredCount}</span>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800 text-center">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block uppercase">Re-queued</span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{reviewCount}</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                sound.playTap();
                setCurrentIndex(0);
                setIsCompleted(false);
                setIsFlipped(false);
              }}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-2xl shadow-[0_4px_0_0_#059669] transition-all"
            >
              Review Deck Again
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-2xl transition-colors"
            >
              Back to Study Path
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95 flex flex-col justify-between max-h-[90vh]">
        {/* Header: Title, Generator & Close */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Personalized Error Recovery
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-400">Gemini Lexicon Studio</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Collocation & Mistake Flashcards
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateWithGemini}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold rounded-xl whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm active:translate-y-0.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'AI Generating...' : 'Refresh with Gemini'}</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close Flashcards"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress bar & Counter */}
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Card {currentIndex + 1} of {cards.length}</span>
            <span className="text-emerald-600 dark:text-emerald-400">{currentCard?.category}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 3D Flip Card Container */}
        <div className="my-2 min-h-[340px] relative cursor-pointer" onClick={handleFlip}>
          <div className={`w-full h-full min-h-[340px] rounded-3xl p-6 transition-all duration-500 flex flex-col justify-between border-2 shadow-lg relative ${
            isFlipped
              ? 'bg-slate-900 text-white border-emerald-500/60 shadow-emerald-950/20'
              : 'bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-850 dark:to-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
          }`}>
            {/* Front Card Face */}
            {!isFlipped ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Band 8.5+ Target Collocation
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(currentCard.collocation);
                      }}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
                      aria-label="Listen to pronunciation"
                    >
                      <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </button>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-4">
                    {currentCard.collocation}
                  </h2>
                </div>

                {/* Candidate's original slip note */}
                <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl my-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Your Previous Speaking Slip:</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                    "{currentCard.originalSlip}"
                  </p>
                </div>

                {/* Flip callout footer */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <RotateCw className="w-3.5 h-3.5" />
                    Tap anywhere to reveal definition & example
                  </span>
                  <span>Flip ↻</span>
                </div>
              </div>
            ) : (
              /* Back Card Face */
              <div className="flex-1 flex flex-col justify-between animate-in fade-in">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Meaning & Cambridge Descriptors
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(currentCard.exampleSentence);
                      }}
                      className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
                      aria-label="Listen to example sentence"
                    >
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    </button>
                  </div>

                  <p className="text-sm text-slate-200 font-medium leading-relaxed mb-4">
                    {currentCard.definition}
                  </p>

                  <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 mb-3">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-sky-400 mb-1">
                      <BookOpen className="w-3 h-3" />
                      <span>IELTS Speaking Example:</span>
                    </div>
                    <p className="text-xs text-slate-100 italic leading-relaxed">
                      "{currentCard.exampleSentence}"
                    </p>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-xl text-[11px] text-amber-200">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Examiner Pro-Tip: </strong>{currentCard.examinerTip}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-400 pt-2 border-t border-slate-800 mt-2">
                  <span>Tap card to flip back</span>
                  <span>Flip ↻</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons: Still Learning vs Mastered */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleReview}
            className="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 active:translate-y-0.5"
          >
            <RotateCcw className="w-4 h-4 text-amber-500" />
            <span>Still Learning (Re-queue)</span>
          </button>

          <button
            onClick={handleMastered}
            className="py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-[0_3px_0_0_#059669] transition-all flex items-center justify-center gap-2 active:translate-y-0.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mastered (+5 XP)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
