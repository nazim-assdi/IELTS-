/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Flame, Gem, Heart, Trophy, BookOpen, Volume2, VolumeX, Mic, 
  Check, Lock, Star, Sparkles, ChevronRight, Gift, Award, Compass,
  Building, Briefcase, Cpu, UserCheck, Scale, Layers, CreditCard
} from 'lucide-react';
import { IELTS_CURRICULUM, IELTS_SECTIONS, Unit, Lesson } from './data/curriculum';
import { OllieMascot } from './components/OllieMascot';
import { LessonModal } from './components/LessonModal';
import { VoiceStudio } from './components/VoiceStudio';
import { LeaderboardModal } from './components/LeaderboardModal';
import { PhrasebookModal } from './components/PhrasebookModal';
import { CueCardModal } from './components/CueCardModal';
import { FlashcardModal } from './components/FlashcardModal';
import { VocabularyMastery } from './components/VocabularyMastery';
import { DailyGoalWidget } from './components/DailyGoalWidget';
import { WeeklyProgressReport } from './components/WeeklyProgressReport';
import { OfflineIndicator, OfflineBanner } from './components/OfflineIndicator';
import { useOfflineStatus } from './hooks/useOfflineStatus';
import { OfflineStorageManager } from './services/offline-storage';
import { sound } from './utils/sound';
import { calculateLeague } from './utils/ielts-scoring';
import { EyeComfortTheme, EYE_COMFORT_THEMES } from './utils/theme';
import { TrendingUp, Eye } from 'lucide-react';

export default function App() {
  // Local-first loaded initial state
  const initialLocalState = OfflineStorageManager.loadProgress();

  const [currentTab, setCurrentTab] = useState<'path' | 'voice' | 'cue-cards' | 'vocabulary'>('path');
  const [voiceStudioTab, setVoiceStudioTab] = useState<'interview' | 'analytics'>('interview');
  const [selectedSection, setSelectedSection] = useState<number>(1);
  const [xp, setXp] = useState<number>(initialLocalState.xp);
  const [streak, setStreak] = useState<number>(initialLocalState.streak);
  const [gems, setGems] = useState<number>(initialLocalState.gems);
  const [hearts, setHearts] = useState<number>(initialLocalState.hearts);
  const [predictedBand, setPredictedBand] = useState<number>(initialLocalState.predictedBand);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>(initialLocalState.completedLessons);

  // Offline status & synchronization hook
  const offlineStatus = useOfflineStatus((reconciled, count) => {
    setCompletedLessons(reconciled.completedLessons);
    setXp(reconciled.xp);
    setGems(reconciled.gems);
    setTodayCompletedLessons(reconciled.todayCompletedLessons);
    setTodayPracticeMinutes(reconciled.todayPracticeMinutes);
  });

  // Eye Comfort 3 Theme state
  const [eyeTheme, setEyeTheme] = useState<EyeComfortTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ielts_eye_theme');
      if (saved === 'paper-warm' || saved === 'soft-sage' || saved === 'midnight-slate') {
        return saved;
      }
    }
    return 'paper-warm';
  });

  const handleSelectEyeTheme = (theme: EyeComfortTheme) => {
    sound.playTap();
    setEyeTheme(theme);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ielts_eye_theme', theme);
      } catch (e) {}
    }
  };

  // Daily Goal tracking state
  const [todayCompletedLessons, setTodayCompletedLessons] = useState<number>(2);
  const [todayPracticeMinutes, setTodayPracticeMinutes] = useState<number>(11);

  // Past mistakes recorded from Voice Studio
  const [pastMistakes, setPastMistakes] = useState<Array<{ original: string; better?: string; reason?: string }>>([
    { original: 'city is very crowded', better: 'densely populated metropolis', reason: 'High-band academic precision' },
    { original: 'big difference', better: 'marked disparity', reason: 'Formal analytical contrast' },
  ]);
  const [recentSpeechSample, setRecentSpeechSample] = useState<string>('');

  // Modals
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showPhrasebook, setShowPhrasebook] = useState<boolean>(false);
  const [showCueCards, setShowCueCards] = useState<boolean>(false);
  const [showFlashcards, setShowFlashcards] = useState<boolean>(false);
  const [chestModal, setChestModal] = useState<{ unitNumber: number; tip: string; gems: number } | null>(null);

  // Check ?autostart=1 query param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        setActiveLesson(IELTS_CURRICULUM[0].lessons[0]);
      }
    }
  }, []);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
    if (!nextMuted) sound.playTap();
  };

  const handleLessonComplete = (earnedXp: number, earnedGems: number) => {
    if (activeLesson) {
      const nextCompleted = [...new Set([...completedLessons, activeLesson.id])];
      const nextXp = xp + earnedXp;
      const nextGems = gems + earnedGems;
      const nextTodayLessons = todayCompletedLessons + 1;
      const nextTodayMinutes = todayPracticeMinutes + 4;

      setCompletedLessons(nextCompleted);
      setXp(nextXp);
      setGems(nextGems);
      setTodayCompletedLessons(nextTodayLessons);
      setTodayPracticeMinutes(nextTodayMinutes);

      // Save to local-first storage immediately (zero active internet needed)
      OfflineStorageManager.saveProgress({
        completedLessons: nextCompleted,
        xp: nextXp,
        gems: nextGems,
        todayCompletedLessons: nextTodayLessons,
        todayPracticeMinutes: nextTodayMinutes,
      });

      // Record offline mutation for reconciliation
      if (offlineStatus.isOffline) {
        offlineStatus.recordOfflineProgress('COMPLETE_LESSON', {
          lessonId: activeLesson.id,
          earnedXp,
          earnedGems,
        });
      }

      setActiveLesson(null);
    }
  };

  const handleHeartLost = () => {
    setHearts(prev => Math.max(0, prev - 1));
  };

  const refillHearts = () => {
    sound.playTap();
    if (gems >= 50) {
      setGems(g => g - 50);
      setHearts(5);
      sound.playReward();
    } else {
      setHearts(5); // free practice refill
      sound.playReward();
    }
  };

  const openChest = (unit: Unit) => {
    sound.playReward();
    const bonusGems = 25;
    setGems(g => g + bonusGems);
    setChestModal({
      unitNumber: unit.unitNumber,
      gems: bonusGems,
      tip: "Examiner Secret: In Speaking Part 3, never say 'I agree 100%'. Instead, use 'By and large, I concur with that proposition, albeit with certain caveats.'",
    });
  };

  const currentLeague = calculateLeague(xp);

  // Filter 100 units by currently selected section (10 units per section)
  const displayedUnits = IELTS_CURRICULUM.filter(u => u.sectionNumber === selectedSection);
  const currentSectionMeta = IELTS_SECTIONS.find(s => s.sectionNumber === selectedSection) || IELTS_SECTIONS[0];

  // Helper to get lesson icon
  const renderLessonIcon = (iconName: string) => {
    switch (iconName) {
      case 'building': return <Building className="w-6 h-6" />;
      case 'briefcase': return <Briefcase className="w-6 h-6" />;
      case 'cpu': return <Cpu className="w-6 h-6" />;
      case 'compass': return <Compass className="w-6 h-6" />;
      case 'user-check': return <UserCheck className="w-6 h-6" />;
      case 'scale': return <Scale className="w-6 h-6" />;
      default: return <Sparkles className="w-6 h-6" />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-emerald-200 transition-colors duration-300 theme-${eyeTheme} ${eyeTheme === 'midnight-slate' ? 'dark' : ''}`}>
      {/* Top Bar Contract (§2): Exactly 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 theme-header border-b-2 px-6 py-3 shadow-sm transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark with Cambridge Academic Shield Crest */}
          <button
            onClick={() => {
              sound.playTap();
              setCurrentTab('path');
            }}
            className="flex items-center gap-2.5 font-black text-xl text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0 hover:opacity-90"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-sm font-black p-1.5">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <span className="font-black tracking-tight">IELTS HERO</span>
          </button>

          {/* Zone 2: Clean single-line text links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => {
                sound.playTap();
                setCurrentTab('path');
              }}
              className={`hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 ${
                currentTab === 'path' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : ''
              }`}
            >
              100 Units Path
            </button>
            <button
              onClick={() => {
                sound.playTap();
                setVoiceStudioTab('interview');
                setCurrentTab('voice');
              }}
              className={`hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentTab === 'voice' && voiceStudioTab === 'interview' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : ''
              }`}
            >
              <Mic className="w-4 h-4 text-emerald-500" />
              <span>Realtime Examiner</span>
            </button>
            <button
              onClick={() => {
                sound.playTap();
                setVoiceStudioTab('analytics');
                setCurrentTab('voice');
              }}
              className={`hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentTab === 'voice' && voiceStudioTab === 'analytics' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Speaking Analytics</span>
            </button>
            <button
              onClick={() => {
                sound.playTap();
                setCurrentTab('vocabulary');
              }}
              className={`hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentTab === 'vocabulary' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : ''
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>Vocabulary Mastery</span>
            </button>
            <button
              onClick={() => {
                sound.playCardFlip();
                setShowFlashcards(true);
              }}
              className="hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 text-sky-600 dark:text-sky-400"
            >
              <CreditCard className="w-4 h-4" />
              <span>AI Flashcards</span>
            </button>
            <button
              onClick={() => {
                sound.playTap();
                setShowCueCards(true);
              }}
              className="hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0"
            >
              Cue Cards (Part 2)
            </button>
            <button
              onClick={() => {
                sound.playTap();
                setShowPhrasebook(true);
              }}
              className="hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0"
            >
              Band 8+ Phrasebook
            </button>
          </nav>

          {/* Zone 3: Gamified Stats + Eye Comfort Theme Switcher */}
          <div className="flex items-center gap-3 shrink-0 text-xs sm:text-sm font-extrabold">
            {/* Eye Comfort 3 Theme Switcher */}
            <div className="flex items-center gap-0.5 p-1 rounded-2xl bg-black/5 dark:bg-white/10 border border-slate-300/40 dark:border-slate-700 text-xs" title="Select Eye Comfort Theme">
              {(['paper-warm', 'soft-sage', 'midnight-slate'] as EyeComfortTheme[]).map((t) => {
                const item = EYE_COMFORT_THEMES[t];
                const isSelected = eyeTheme === t;
                return (
                  <button
                    key={t}
                    onClick={() => handleSelectEyeTheme(t)}
                    className={`px-2 py-1 rounded-xl text-xs transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-black'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                    }`}
                    title={`${item.name} (${item.subtitle})`}
                  >
                    <span>{item.icon}</span>
                    <span className="hidden lg:inline text-[11px]">{item.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Streak with sound effect */}
            <button
              onClick={() => sound.playStreak()}
              className="flex items-center gap-1 text-amber-500 hover:scale-105 transition-transform"
              title="Daily Streak (Click for fire!)"
            >
              <Flame className="w-4 h-4 fill-amber-500" />
              <span>{streak}</span>
            </button>

            {/* Gems with reward chime */}
            <button
              onClick={() => sound.playReward()}
              className="flex items-center gap-1 text-cyan-500 hover:scale-105 transition-transform"
              title="Lingots / Gems"
            >
              <Gem className="w-4 h-4 fill-cyan-500" />
              <span>{gems}</span>
            </button>

            {/* Hearts */}
            <button
              onClick={refillHearts}
              className="flex items-center gap-1 text-rose-500 hover:opacity-80 transition-opacity"
              title="Hearts (Click to Refill)"
            >
              <Heart className="w-4 h-4 fill-rose-500" />
              <span>{hearts}</span>
            </button>

            {/* Leaderboard Trophy */}
            <button
              onClick={() => {
                sound.playTap();
                setShowLeaderboard(true);
              }}
              className="p-1.5 text-slate-500 hover:text-amber-500 transition-colors"
              aria-label="Open League Leaderboard"
              title={`${currentLeague.name} League`}
            >
              <Trophy className="w-4 h-4" />
            </button>

            {/* Offline Readiness & Local Cache Status */}
            <OfflineIndicator status={offlineStatus} />

            {/* Sound Mute */}
            <button
              onClick={toggleSound}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sub-Navigation */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto px-4 py-2.5 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
        <button
          onClick={() => {
            sound.playTap();
            setCurrentTab('path');
          }}
          className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded-xl ${
            currentTab === 'path' ? 'bg-emerald-500 text-white font-extrabold' : ''
          }`}
        >
          100 Units Path
        </button>
        <button
          onClick={() => {
            sound.playTap();
            setCurrentTab('vocabulary');
          }}
          className={`whitespace-nowrap shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xl ${
            currentTab === 'vocabulary' ? 'bg-emerald-500 text-white font-extrabold' : 'text-emerald-700 dark:text-emerald-300'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Vocabulary Mastery</span>
        </button>
        <button
          onClick={() => {
            sound.playTap();
            setVoiceStudioTab('interview');
            setCurrentTab('voice');
          }}
          className={`whitespace-nowrap shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xl ${
            currentTab === 'voice' && voiceStudioTab === 'interview' ? 'bg-emerald-500 text-white font-extrabold' : ''
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Examiner</span>
        </button>
        <button
          onClick={() => {
            sound.playTap();
            setVoiceStudioTab('analytics');
            setCurrentTab('voice');
          }}
          className={`whitespace-nowrap shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xl ${
            currentTab === 'voice' && voiceStudioTab === 'analytics' ? 'bg-emerald-500 text-white font-extrabold' : ''
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Analytics</span>
        </button>
        <button
          onClick={() => {
            sound.playCardFlip();
            setShowFlashcards(true);
          }}
          className="whitespace-nowrap shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xl text-sky-600 dark:text-sky-400"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Flashcards</span>
        </button>
      </div>

      {/* Offline Alert Strip (Only visible when offline) */}
      <OfflineBanner status={offlineStatus} />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {currentTab === 'voice' ? (
          <VoiceStudio 
            initialStudioTab={voiceStudioTab}
            onBandEvaluated={(b) => {
              setPredictedBand(b);
              setTodayPracticeMinutes(prev => prev + 5);
              OfflineStorageManager.saveProgress({
                predictedBand: b,
                todayPracticeMinutes: todayPracticeMinutes + 5,
              });
              if (offlineStatus.isOffline) {
                offlineStatus.recordOfflineProgress('RECORD_SPEAKING_SESSION', {
                  session: { overallBand: b, timestamp: Date.now() },
                });
              }
            }}
            onMistakesRecorded={(mistakes, speech) => {
              setPastMistakes(mistakes);
              setRecentSpeechSample(speech);
            }}
            onOpenFlashcards={() => setShowFlashcards(true)}
            isDarkTheme={eyeTheme === 'midnight-slate'}
          />
        ) : currentTab === 'vocabulary' ? (
          <VocabularyMastery
            onOpenFlashcards={() => setShowFlashcards(true)}
            onOpenVoiceStudio={() => {
              setVoiceStudioTab('interview');
              setCurrentTab('voice');
            }}
            isDarkTheme={eyeTheme === 'midnight-slate'}
          />
        ) : (
          /* DUOLINGO 100-UNIT LEARNING PATH VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: 100-Unit Course Path with Section Switcher */}
            <div className="lg:col-span-2 space-y-8">
              {/* Journey Banner Hero */}
              <div className="relative rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900">
                <div className="h-44 sm:h-52 w-full overflow-hidden relative">
                  <img
                    src="/src/assets/images/learning_path_banner_1793681330644.jpg"
                    alt="Journey to IELTS Band 9"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-1">
                      IELTS HERO · 100 Units Complete Curriculum
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                      The 100-Unit Journey to Band 9.0
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
                      From foundational everyday idioms to Band 9 examiner mock interviews and personalized AI flashcards.
                    </p>
                  </div>
                </div>
              </div>

              {/* 100-Unit Section Jump Bar (Duolingo Chapters) */}
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <span>Select Curriculum Section (100 Units Total)</span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Units {currentSectionMeta.startUnit} – {currentSectionMeta.endUnit}
                  </span>
                </div>

                {/* Section Buttons Carousel */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  {IELTS_SECTIONS.map((sec) => (
                    <button
                      key={sec.sectionNumber}
                      onClick={() => {
                        sound.playTap();
                        setSelectedSection(sec.sectionNumber);
                      }}
                      className={`px-3 py-2 rounded-2xl font-bold whitespace-nowrap shrink-0 transition-all ${
                        selectedSection === sec.sectionNumber
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <span>Sec {sec.sectionNumber}: U{sec.startUnit}–{sec.endUnit}</span>
                    </button>
                  ))}
                </div>

                <div className="px-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <strong>Section {selectedSection}: {currentSectionMeta.title}</strong> — {currentSectionMeta.description}
                </div>
              </div>

              {/* Units in Current Section */}
              {displayedUnits.map((unit) => {
                const isEmerald = unit.accentColor === 'emerald';
                const isSky = unit.accentColor === 'sky';
                const isPurple = unit.accentColor === 'purple';
                const isIndigo = unit.accentColor === 'indigo';
                const isRose = unit.accentColor === 'rose';
                const isTeal = unit.accentColor === 'teal';

                const bannerBg = isEmerald
                  ? 'bg-emerald-500 text-white'
                  : isSky
                  ? 'bg-sky-500 text-white'
                  : isPurple
                  ? 'bg-purple-600 text-white'
                  : isIndigo
                  ? 'bg-indigo-600 text-white'
                  : isRose
                  ? 'bg-rose-600 text-white'
                  : isTeal
                  ? 'bg-teal-600 text-white'
                  : 'bg-amber-500 text-white';

                return (
                  <div key={unit.id} className="space-y-6">
                    {/* Unit Header Card */}
                    <div className={`${bannerBg} rounded-3xl p-6 shadow-md border-b-4 border-black/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-90 mb-1">
                          <span>Unit {unit.unitNumber} of 100</span>
                          <span>·</span>
                          <span>{unit.badgeText}</span>
                        </div>
                        <h3 className="text-xl font-extrabold">{unit.title}</h3>
                        <p className="text-xs opacity-90 max-w-md mt-1">{unit.description}</p>
                      </div>

                      <button
                        onClick={() => {
                          sound.playTap();
                          setCurrentTab('voice');
                        }}
                        className="py-2 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Practice with Examiner</span>
                      </button>
                    </div>

                    {/* Iconic Duolingo Snake Layout */}
                    <div className="flex flex-col items-center space-y-6 py-4">
                      {unit.lessons.map((lesson, idx) => {
                        const isCompleted = completedLessons.includes(lesson.id);
                        const isUnlocked = unit.unitNumber === 1 || isCompleted || idx === 0 || completedLessons.includes(unit.lessons[idx - 1]?.id);

                        // Sinusoidal offset
                        const offsetPx = Math.sin(idx * 1.5) * 45;

                        return (
                          <div
                            key={lesson.id}
                            className="flex flex-col items-center relative transition-transform duration-300"
                            style={{ transform: `translateX(${offsetPx}px)` }}
                          >
                            {/* Mastered Crown Badge */}
                            {isCompleted && (
                              <div className="absolute -top-3 z-10 bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                <CrownIcon className="w-3 h-3 fill-amber-950" />
                                <span>MASTERED</span>
                              </div>
                            )}

                            {/* Circular 3D Duolingo Lesson Button */}
                            <button
                              disabled={!isUnlocked}
                              onClick={() => {
                                sound.playTap();
                                setActiveLesson(lesson);
                              }}
                              className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-150 relative ${
                                isCompleted
                                  ? 'bg-amber-400 hover:bg-amber-300 border-b-6 border-amber-600 active:border-b-0 active:translate-y-1.5 text-amber-950 shadow-md'
                                  : isUnlocked
                                  ? 'bg-emerald-500 hover:bg-emerald-400 border-b-6 border-emerald-700 active:border-b-0 active:translate-y-1.5 text-white shadow-md'
                                  : 'bg-slate-200 dark:bg-slate-800 border-b-6 border-slate-300 dark:border-slate-900 text-slate-400 cursor-not-allowed'
                              }`}
                              aria-label={`Start lesson: ${lesson.title}`}
                            >
                              <div className="w-14 h-14 rounded-full flex items-center justify-center">
                                {isUnlocked ? renderLessonIcon(lesson.icon) : <Lock className="w-6 h-6 text-slate-400" />}
                              </div>
                            </button>

                            {/* Lesson Title Caption */}
                            <div className="mt-2 text-center max-w-[150px]">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                                {lesson.title}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                +{lesson.xpReward} XP
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Unit Reward Chest */}
                      {unit.hasChest && (
                        <div className="pt-2">
                          <button
                            onClick={() => openChest(unit)}
                            className="flex flex-col items-center group transition-transform active:scale-95"
                            aria-label={`Open Unit ${unit.unitNumber} Chest`}
                          >
                            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 flex items-center justify-center text-3xl shadow-md group-hover:scale-105 transition-all">
                              🎁
                            </div>
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mt-1">
                              Unit {unit.unitNumber} Bonus Chest
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Next Section Navigation Button */}
              {selectedSection < 10 && (
                <div className="pt-4 text-center">
                  <button
                    onClick={() => {
                      sound.playReward();
                      setSelectedSection(prev => prev + 1);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className="py-3.5 px-8 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold text-sm rounded-2xl shadow-md hover:opacity-90 transition-all inline-flex items-center gap-2"
                  >
                    <span>Advance to Section {selectedSection + 1}: {IELTS_SECTIONS[selectedSection]?.title}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Right 1 Col: Floating Mascot, AI Flashcards Widget, Predicted Band & Daily Stats */}
            <div className="space-y-6">
              {/* Ollie the Mascot Widget */}
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <OllieMascot
                  mood="coaching"
                  message="Welcome to IELTS HERO! 100 units crafted to take you step-by-step from Band 6.0 to a triumphant Band 9.0."
                />
              </div>

              {/* Daily Goal Progress Bar & Quest Widget */}
              <DailyGoalWidget
                completedLessonsCount={todayCompletedLessons}
                practiceMinutes={todayPracticeMinutes}
                onClaimReward={(earnedGems, earnedXp) => {
                  setGems(g => g + earnedGems);
                  setXp(x => x + earnedXp);
                }}
                onOpenVoiceStudio={() => {
                  setCurrentTab('voice');
                }}
              />

              {/* Weekly Progress Report with D3 Bar Chart */}
              <WeeklyProgressReport
                currentXp={xp}
                isDarkTheme={eyeTheme === 'midnight-slate'}
              />

              {/* NEW: Personalized AI Flashcards Widget */}
              <div className="bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-900 dark:to-slate-850 border-2 border-sky-200 dark:border-sky-900/60 rounded-3xl p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
                    <CreditCard className="w-4 h-4 text-sky-500" />
                    <span>Personalized Flashcards</span>
                  </div>
                  <span className="text-[10px] bg-sky-200 dark:bg-sky-900 text-sky-800 dark:text-sky-200 px-2 py-0.5 rounded-full font-bold">
                    Gemini AI
                  </span>
                </div>

                <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Review Your Voice Studio Slips
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Turn speaking hesitation into natural native collocations like <em>"densely populated metropolis"</em> and <em>"marked disparity"</em>.
                </p>

                <button
                  onClick={() => {
                    sound.playCardFlip();
                    setShowFlashcards(true);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-[0_2px_0_0_#0284c7] transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open 3D Flashcards Deck</span>
                </button>
              </div>

              {/* NEW: Vocabulary Mastery Spotlight Widget */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-850 border-2 border-emerald-200 dark:border-emerald-900/60 rounded-3xl p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                    <span>Vocabulary Mastery</span>
                  </div>
                  <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    100 Units
                  </span>
                </div>

                <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Categorized Lexicon & Bookmarks
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Browse Band 7.5–9.0 academic collocations, idioms, and discourse markers. Star difficult terms for rapid repetition.
                </p>

                <button
                  onClick={() => {
                    sound.playTap();
                    setCurrentTab('vocabulary');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-[0_2px_0_0_#059669] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>Explore Vocabulary & Bookmarks</span>
                </button>
              </div>

              {/* Band Score Predictor Card */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-3xl p-6 shadow-md border-b-4 border-emerald-900/40 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-90">Current Speaking Benchmark</span>
                  <Award className="w-5 h-5 text-amber-300" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black">{predictedBand.toFixed(1)}</span>
                  <span className="text-sm font-semibold opacity-90">/ 9.0 Band</span>
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  Calculated using official IELTS descriptors across Fluency, Lexical Resource, Grammar, and Pronunciation.
                </p>
                <button
                  onClick={() => {
                    sound.playTap();
                    setCurrentTab('voice');
                  }}
                  className="w-full py-3 bg-white text-emerald-900 font-extrabold text-xs rounded-2xl shadow-sm hover:bg-slate-50 transition-colors"
                >
                  Start Live Voice Evaluation
                </button>
              </div>

              {/* League Division Widget */}
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">IELTS League</h4>
                  <button
                    onClick={() => setShowLeaderboard(true)}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">{currentLeague.icon}</div>
                  <div>
                    <h5 className={`font-extrabold text-base ${currentLeague.color}`}>{currentLeague.name} League</h5>
                    <span className="text-xs text-slate-500">{xp} total XP accumulated</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (xp % 500) / 5)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-2">
                  Earn +{(500 - (xp % 500))} XP to reach the next tier!
                </span>
              </div>

              {/* Quick Practice Cue Cards Spotlight */}
              <div className="bg-amber-50 dark:bg-slate-900 border-2 border-amber-200 dark:border-amber-900/60 rounded-3xl p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  <Compass className="w-4 h-4 text-amber-500" />
                  <span>Cue Card Spotlight</span>
                </div>
                <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  "Describe a memorable journey by public transport"
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Practice 1-minute prep & 2-minute monologue with dynamic notes.
                </p>
                <button
                  onClick={() => setShowCueCards(true)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-[0_2px_0_0_#b45309] transition-all"
                >
                  Open Cue Card Studio
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Active Lesson Modal */}
      {activeLesson && (
        <LessonModal
          lesson={activeLesson}
          hearts={hearts}
          onClose={() => setActiveLesson(null)}
          onComplete={handleLessonComplete}
          onHeartLost={handleHeartLost}
        />
      )}

      {/* MODAL: Personalized AI Flashcards */}
      {showFlashcards && (
        <FlashcardModal
          pastMistakes={pastMistakes}
          recentSpeech={recentSpeechSample}
          onClose={() => setShowFlashcards(false)}
          onEarnXp={(earned) => setXp(x => x + earned)}
        />
      )}

      {/* MODAL: Weekly Leaderboard */}
      {showLeaderboard && (
        <LeaderboardModal
          userXp={xp}
          userStreak={streak}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* MODAL: Band 8+ Phrasebook */}
      {showPhrasebook && (
        <PhrasebookModal onClose={() => setShowPhrasebook(false)} />
      )}

      {/* MODAL: Cue Cards */}
      {showCueCards && (
        <CueCardModal
          onClose={() => setShowCueCards(false)}
          onStartPracticeWithCard={(topic) => {
            setCurrentTab('voice');
          }}
        />
      )}

      {/* MODAL: Surprise Chest Reward */}
      {chestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 flex items-center justify-center text-4xl mb-3 border-2 border-amber-300">
              🎁
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">
              Unit {chestModal.unitNumber} Chest Unlocked!
            </h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-extrabold text-sm mb-4">
              <span>+{chestModal.gems} Gems 💎</span>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 text-left mb-6 leading-relaxed">
              <span className="font-bold block mb-1">💡 Band 9 Examiner Tip:</span>
              {chestModal.tip}
            </div>
            <button
              onClick={() => setChestModal(null)}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-2xl shadow-[0_4px_0_0_#059669]"
            >
              Sweet! Keep Practicing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  );
}
