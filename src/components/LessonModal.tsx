/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Heart, Volume2, CheckCircle2, AlertCircle, ArrowRight, Mic, Sparkles } from 'lucide-react';
import { Lesson, Question } from '../data/curriculum';
import { sound } from '../utils/sound';

interface LessonModalProps {
  lesson: Lesson;
  hearts: number;
  onClose: () => void;
  onComplete: (earnedXp: number, earnedGems: number) => void;
  onHeartLost: () => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  lesson,
  hearts,
  onClose,
  onComplete,
  onHeartLost,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  
  // State for sentence unscramble
  const [unscrambleChosen, setUnscrambleChosen] = useState<string[]>([]);
  const [unscramblePool, setUnscramblePool] = useState<string[]>([]);

  // State for collocation match
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [mismatched, setMismatched] = useState<boolean>(false);

  // State for shadowing audio
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [shadowingRecorded, setShadowingRecorded] = useState(false);

  // Evaluation drawer state
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [isFinished, setIsFinished] = useState(false);

  const currentQ: Question = lesson.questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex) / lesson.questions.length) * 100;

  // Reset question state when moving to next question
  useEffect(() => {
    setSelectedAnswer(null);
    setSelectedLeft(null);
    setMatchedPairs([]);
    setMismatched(false);
    setStatus('idle');
    setShadowingRecorded(false);

    if (currentQ?.type === 'sentence-unscramble' && currentQ.words) {
      // Shuffle words for unscramble
      const shuffled = [...currentQ.words].sort(() => Math.random() - 0.5);
      setUnscramblePool(shuffled);
      setUnscrambleChosen([]);
    }
  }, [currentQuestionIndex, currentQ]);

  // Audio synthesis helper for shadowing / reading prompts
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = 0.95;
    
    // Pick British voice if available
    const voices = window.speechSynthesis.getVoices();
    const britishVoice = voices.find(v => v.lang.includes('GB') || v.name.includes('British') || v.name.includes('UK'));
    if (britishVoice) {
      utterance.voice = britishVoice;
    }

    setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  // Handle collocation click
  const handleLeftClick = (leftWord: string) => {
    if (matchedPairs.includes(leftWord)) return;
    sound.playTap();
    setSelectedLeft(leftWord);
    setMismatched(false);
  };

  const handleRightClick = (rightWord: string) => {
    if (!selectedLeft) return;
    sound.playTap();
    
    // Check if pair matches
    const correctPair = currentQ.pairs?.find(p => p.left === selectedLeft && p.right === rightWord);
    if (correctPair) {
      const newMatched = [...matchedPairs, selectedLeft, rightWord];
      setMatchedPairs(newMatched);
      setSelectedLeft(null);
      sound.playCorrect();

      // Check if all pairs matched
      if (newMatched.length === (currentQ.pairs?.length || 0) * 2) {
        setStatus('correct');
      }
    } else {
      setMismatched(true);
      sound.playIncorrect();
      setTimeout(() => {
        setMismatched(false);
        setSelectedLeft(null);
      }, 700);
    }
  };

  // Word pool click in sentence unscramble
  const handleWordFromPool = (word: string, index: number) => {
    sound.playTap();
    setUnscrambleChosen(prev => [...prev, word]);
    setUnscramblePool(prev => prev.filter((_, i) => i !== index));
  };

  const handleWordFromChosen = (word: string, index: number) => {
    sound.playTap();
    setUnscramblePool(prev => [...prev, word]);
    setUnscrambleChosen(prev => prev.filter((_, i) => i !== index));
  };

  // Check Answer Handler
  const handleCheck = () => {
    if (status !== 'idle') return;

    let isCorrect = false;

    if (currentQ.type === 'fill-in-blank' || currentQ.type === 'error-spotting') {
      isCorrect = selectedAnswer === currentQ.correctAnswer;
    } else if (currentQ.type === 'sentence-unscramble') {
      const candidateSentence = unscrambleChosen.join(' ');
      isCorrect = candidateSentence.trim() === currentQ.correctSentence?.trim();
    } else if (currentQ.type === 'shadowing') {
      isCorrect = true; // Completing the shadowing practice counts
    }

    if (isCorrect) {
      sound.playCorrect();
      setStatus('correct');
    } else {
      sound.playIncorrect();
      setStatus('incorrect');
      onHeartLost();
    }
  };

  // Continue to next question or complete
  const handleContinue = () => {
    sound.playTap();
    if (currentQuestionIndex < lesson.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Completed lesson!
      sound.playVictory();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setIsFinished(true);
    }
  };

  // Finished Victory Screen
  if (isFinished) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 text-center shadow-2xl animate-in fade-in zoom-in-95">
          <div className="w-24 h-24 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-4xl mb-4 border-4 border-amber-300">
            🏆
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
            Lesson Completed!
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
            Outstanding work! You just sharpened your IELTS speaking fluency and lexical precision.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-amber-50 dark:bg-slate-800 border-2 border-amber-200 dark:border-slate-700 rounded-2xl p-4">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-1">XP EARNED</span>
              <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">+{lesson.xpReward}</span>
            </div>
            <div className="bg-cyan-50 dark:bg-slate-800 border-2 border-cyan-200 dark:border-slate-700 rounded-2xl p-4">
              <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 block mb-1">GEMS REWARD</span>
              <span className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">+{lesson.gemReward} 💎</span>
            </div>
          </div>

          <button
            onClick={() => onComplete(lesson.xpReward, lesson.gemReward)}
            className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 active:translate-y-0.5 text-white font-bold text-lg rounded-2xl shadow-[0_4px_0_0_#059669] transition-all"
          >
            Claim Rewards & Continue
          </button>
        </div>
      </div>
    );
  }

  // Can check button be active?
  const isCheckEnabled = () => {
    if (status !== 'idle') return false;
    if (currentQ.type === 'fill-in-blank' || currentQ.type === 'error-spotting') {
      return selectedAnswer !== null;
    }
    if (currentQ.type === 'sentence-unscramble') {
      return unscrambleChosen.length > 0;
    }
    if (currentQ.type === 'collocation-match') {
      return false; // Auto completes when all pairs matched
    }
    if (currentQ.type === 'shadowing') {
      return shadowingRecorded || true;
    }
    return false;
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col justify-between overflow-hidden">
      {/* Top Header: Progress Bar, Hearts & Close */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-6 max-w-4xl mx-auto w-full">
        <button
          onClick={onClose}
          aria-label="Exit Lesson"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Duolingo Chunky Progress Bar */}
        <div className="flex-1 h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 relative">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300 relative"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Gloss highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/40 rounded-full" />
          </div>
        </div>

        {/* Hearts counter */}
        <div className="flex items-center gap-1.5 font-bold text-rose-500 text-sm">
          <Heart className="w-5 h-5 fill-rose-500" />
          <span>{hearts}</span>
        </div>
      </div>

      {/* Main Interactive Question Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-2xl mx-auto w-full flex flex-col justify-center">
        {/* Examiner Prompt / Question Headline */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
            <Sparkles className="w-4 h-4" />
            <span>{currentQ.type.replace('-', ' ')}</span>
            <span>·</span>
            <span>Question {currentQuestionIndex + 1} of {lesson.questions.length}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
            {currentQ.prompt}
          </h2>
          {currentQ.context && (
            <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 font-medium text-base">
              {currentQ.context}
            </div>
          )}
        </div>

        {/* TYPE 1: Collocation Matching */}
        {currentQ.type === 'collocation-match' && currentQ.pairs && (
          <div className="grid grid-cols-2 gap-4">
            {/* Left column */}
            <div className="space-y-3">
              {currentQ.pairs.map((p) => {
                const isMatched = matchedPairs.includes(p.left);
                const isSelected = selectedLeft === p.left;
                return (
                  <button
                    key={p.left}
                    disabled={isMatched}
                    onClick={() => handleLeftClick(p.left)}
                    className={`w-full text-left p-4 rounded-2xl font-semibold border-2 transition-all shadow-sm ${
                      isMatched
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-600 opacity-60 cursor-default'
                        : isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-800 dark:text-sky-200 ring-2 ring-sky-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-slate-300 active:translate-y-0.5'
                    }`}
                  >
                    {p.left}
                  </button>
                );
              })}
            </div>

            {/* Right column */}
            <div className="space-y-3">
              {currentQ.pairs.map((p) => {
                const isMatched = matchedPairs.includes(p.right);
                return (
                  <button
                    key={p.right}
                    disabled={isMatched || !selectedLeft}
                    onClick={() => handleRightClick(p.right)}
                    className={`w-full text-left p-4 rounded-2xl font-semibold border-2 transition-all shadow-sm ${
                      isMatched
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-600 opacity-60 cursor-default'
                        : mismatched
                        ? 'bg-rose-50 border-rose-400 text-rose-700 animate-shake'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-slate-300 active:translate-y-0.5'
                    }`}
                  >
                    {p.right}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TYPE 2: Sentence Unscramble */}
        {currentQ.type === 'sentence-unscramble' && (
          <div className="space-y-6">
            {/* Drop / constructed area */}
            <div className="min-h-24 p-4 border-b-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-wrap gap-2 items-center">
              {unscrambleChosen.length === 0 ? (
                <span className="text-slate-400 text-sm italic">Tap words below to assemble the sentence</span>
              ) : (
                unscrambleChosen.map((word, idx) => (
                  <button
                    key={`${word}-${idx}`}
                    onClick={() => handleWordFromChosen(word, idx)}
                    className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-900/40 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 font-semibold rounded-xl shadow-sm hover:opacity-80 active:translate-y-0.5"
                  >
                    {word}
                  </button>
                ))
              )}
            </div>

            {/* Word Bank Pool */}
            <div className="flex flex-wrap gap-2.5 justify-center pt-4">
              {unscramblePool.map((word, idx) => (
                <button
                  key={`${word}-${idx}`}
                  onClick={() => handleWordFromPool(word, idx)}
                  className="px-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-800 dark:text-slate-100 font-semibold rounded-xl shadow-[0_2px_0_0_#cbd5e1] active:translate-y-0.5 active:shadow-none transition-all"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TYPE 3 & 4: Multiple Choice (Fill-in-Blank & Error Spotting) */}
        {(currentQ.type === 'fill-in-blank' || currentQ.type === 'error-spotting') && currentQ.options && (
          <div className="space-y-3">
            {currentQ.options.map((opt) => {
              const isSelected = selectedAnswer === opt;
              return (
                <button
                  key={opt}
                  onClick={() => {
                    sound.playTap();
                    setSelectedAnswer(opt);
                  }}
                  className={`w-full text-left p-4 rounded-2xl font-semibold border-2 transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-900 dark:text-sky-100 ring-2 ring-sky-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-slate-300 active:translate-y-0.5'
                  }`}
                >
                  <span>{opt}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300'}`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* TYPE 5: Shadowing / Pronunciation Practice */}
        {currentQ.type === 'shadowing' && currentQ.audioPromptText && (
          <div className="space-y-6 text-center">
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-200 dark:border-emerald-800 rounded-3xl">
              <p className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                "{currentQ.audioPromptText}"
              </p>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => speakText(currentQ.audioPromptText!)}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold border-2 transition-all ${
                    isPlayingAudio
                      ? 'bg-sky-500 text-white border-sky-600 animate-pulse'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Volume2 className="w-5 h-5 text-sky-500" />
                  <span>{isPlayingAudio ? 'Listening...' : 'Listen to Native British Accent'}</span>
                </button>

                <button
                  onClick={() => {
                    sound.playTap();
                    setShadowingRecorded(true);
                  }}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold border-2 transition-all ${
                    shadowingRecorded
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                  <span>{shadowingRecorded ? 'Shadow Recorded!' : 'Practice & Repeat'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Examiner Band Pro-Tip */}
        <div className="mt-8 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-start gap-3">
          <div className="p-1.5 bg-amber-200 dark:bg-amber-900 rounded-lg text-amber-800 dark:text-amber-200 shrink-0 text-sm">
            💡
          </div>
          <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <span className="font-bold">Band 8+ Insight: </span>
            {currentQ.bandTip}
          </div>
        </div>
      </div>

      {/* Duolingo Sticky Bottom Action Bar & Feedback Drawer */}
      <div className={`p-6 border-t transition-colors duration-200 ${
        status === 'correct'
          ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300'
          : status === 'incorrect'
          ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-300'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          {/* Status Message */}
          {status === 'correct' && (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 fill-emerald-100 shrink-0" />
              <div>
                <h4 className="font-extrabold text-emerald-900 dark:text-emerald-200 text-lg">Spot On!</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">{currentQ.explanation || 'Excellent native phrasing.'}</p>
              </div>
            </div>
          )}

          {status === 'incorrect' && (
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-rose-600 fill-rose-100 shrink-0" />
              <div>
                <h4 className="font-extrabold text-rose-900 dark:text-rose-200 text-lg">Not quite right</h4>
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  {currentQ.explanation || `Correct answer: ${currentQ.correctAnswer || currentQ.correctSentence}`}
                </p>
              </div>
            </div>
          )}

          {status === 'idle' && (
            <div className="text-xs text-slate-500 font-medium">
              Select or arrange your response to check
            </div>
          )}

          {/* Action Button */}
          {status === 'idle' ? (
            <button
              onClick={handleCheck}
              disabled={!isCheckEnabled()}
              className={`py-3.5 px-8 rounded-2xl font-bold text-base transition-all ${
                isCheckEnabled()
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_4px_0_0_#059669] active:translate-y-0.5 active:shadow-none'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              Check
            </button>
          ) : (
            <button
              onClick={handleContinue}
              className={`py-3.5 px-8 rounded-2xl font-bold text-base text-white shadow-md transition-all active:translate-y-0.5 ${
                status === 'correct'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_4px_0_0_#047857]'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-[0_4px_0_0_#be123c]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
