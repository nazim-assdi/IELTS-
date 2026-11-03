/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen, Star, Volume2, Search, Filter, Sparkles, Copy, Check,
  Bookmark, Layers, Award, RotateCcw, ArrowRight, Lightbulb, ExternalLink
} from 'lucide-react';
import {
  VOCABULARY_CATALOG,
  VocabularyItem,
  VocabularyType,
  filterVocabulary,
  toggleBookmark,
  getVocabularyStats,
  loadBookmarkedVocab,
  saveBookmarkedVocab,
} from '../utils/vocabulary-mastery';
import { IELTS_SECTIONS } from '../data/curriculum';
import { sound } from '../utils/sound';

interface VocabularyMasteryProps {
  onOpenFlashcards?: () => void;
  onOpenVoiceStudio?: () => void;
  isDarkTheme?: boolean;
}

export const VocabularyMastery: React.FC<VocabularyMasteryProps> = ({
  onOpenFlashcards,
  onOpenVoiceStudio,
}) => {
  // Bookmarked term IDs initialized from localStorage
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => loadBookmarkedVocab());

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<number | 'all'>('all');
  const [selectedBand, setSelectedBand] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<VocabularyType | 'all'>('all');
  const [bookmarkedOnly, setBookmarkedOnly] = useState<boolean>(false);

  // Interaction feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Sync bookmarks to localStorage whenever they change
  useEffect(() => {
    saveBookmarkedVocab(bookmarkedIds);
  }, [bookmarkedIds]);

  // Handle bookmark toggle
  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playTap();
    const updated = toggleBookmark(bookmarkedIds, id);
    setBookmarkedIds(updated);
  };

  // Pronounce using Web Speech API with British English accent
  const handlePronounce = (term: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playTap();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(term);
      utterance.lang = 'en-GB';
      utterance.rate = 0.9;
      setSpeakingId(id);
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Copy phrase for practice
  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playTap();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Filtered vocabulary list
  const filteredItems = useMemo(() => {
    return filterVocabulary(VOCABULARY_CATALOG, {
      searchQuery,
      sectionNumber: selectedSection,
      minBand: selectedBand,
      vocabType: selectedType,
      bookmarkedOnly,
      bookmarkedIds,
    });
  }, [searchQuery, selectedSection, selectedBand, selectedType, bookmarkedOnly, bookmarkedIds]);

  // Overall catalog statistics
  const stats = useMemo(() => {
    return getVocabularyStats(VOCABULARY_CATALOG, bookmarkedIds);
  }, [bookmarkedIds]);

  // Reset all filters helper
  const handleResetFilters = () => {
    sound.playTap();
    setSearchQuery('');
    setSelectedSection('all');
    setSelectedBand('all');
    setSelectedType('all');
    setBookmarkedOnly(false);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-emerald-100">
            <BookOpen className="w-3.5 h-3.5" />
            <span>100-Unit Curriculum Lexicon</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Vocabulary Mastery Hub
          </h1>

          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            Review academic collocations, idiomatic expressions, discourse signposts, and C2 lexis curated from all 100 units. Bookmark difficult terms to focus your daily review.
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-bold">
            <div className="bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
              <span className="text-white/80">Total Learned Lexis:</span>
              <span className="text-white font-extrabold">{stats.totalTerms} terms</span>
            </div>
            <button
              onClick={() => {
                sound.playTap();
                setBookmarkedOnly(!bookmarkedOnly);
              }}
              className={`px-3.5 py-1.5 rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
                bookmarkedOnly
                  ? 'bg-amber-400 text-slate-900 border-amber-300 font-extrabold shadow-md'
                  : 'bg-white/15 backdrop-blur-md border-white/20 text-white hover:bg-white/25'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${bookmarkedOnly ? 'fill-slate-900' : 'fill-amber-300 text-amber-300'}`} />
              <span>Difficult Terms ({stats.bookmarkedCount})</span>
            </button>
            <div className="bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-white/80">Band 8.5–9.0:</span>
              <span className="text-white font-extrabold">{stats.bandCounts.band85 + stats.bandCounts.band9}</span>
            </div>
            {onOpenFlashcards && stats.bookmarkedCount > 0 && (
              <button
                onClick={() => {
                  sound.playCardFlip();
                  onOpenFlashcards();
                }}
                className="bg-white text-emerald-800 hover:bg-emerald-50 px-3.5 py-1.5 rounded-xl font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ml-auto"
              >
                <span>Study Flashcards</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        {/* Search Input & Quick Bookmarks Toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search words, idioms, collocations, definitions, or model sentences..."
              className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => {
              sound.playTap();
              setBookmarkedOnly(!bookmarkedOnly);
            }}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shrink-0 border cursor-pointer ${
              bookmarkedOnly
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Star className={`w-4 h-4 ${bookmarkedOnly ? 'fill-white text-white' : 'text-amber-500'}`} />
            <span>Difficult Bookmarked Only ({stats.bookmarkedCount})</span>
          </button>
        </div>

        {/* Filter Dropdowns / Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          {/* Section Filter */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>Curriculum Section</span>
            </label>
            <select
              value={selectedSection}
              onChange={(e) => {
                sound.playTap();
                const val = e.target.value;
                setSelectedSection(val === 'all' ? 'all' : Number(val));
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Sections (100 Units)</option>
              {IELTS_SECTIONS.map((sec) => (
                <option key={sec.sectionNumber} value={sec.sectionNumber}>
                  Section {sec.sectionNumber}: {sec.title} (Units {sec.startUnit}–{sec.endUnit})
                </option>
              ))}
            </select>
          </div>

          {/* Band Score Filter */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              <span>Target Band Level</span>
            </label>
            <select
              value={selectedBand}
              onChange={(e) => {
                sound.playTap();
                const val = e.target.value;
                setSelectedBand(val === 'all' ? 'all' : Number(val));
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Bands (7.0 – 9.0)</option>
              <option value="7.5">Band 7.5+ (Competent & Natural)</option>
              <option value="8.0">Band 8.0+ (Academic Precision)</option>
              <option value="8.5">Band 8.5+ (Sophisticated & Fluent)</option>
              <option value="9.0">Band 9.0 (Native C2 Mastery)</option>
            </select>
          </div>

          {/* Vocabulary Type Filter */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-500" />
              <span>Lexical Category</span>
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                sound.playTap();
                setSelectedType(e.target.value as any);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="collocation">Collocations</option>
              <option value="idiom">Idioms & Natural Phrases</option>
              <option value="academic-lexis">Academic C2 Lexis</option>
              <option value="discourse-marker">Discourse & Inversion Markers</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Active Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-slate-900 dark:text-white font-extrabold">{filteredItems.length}</strong> of {stats.totalTerms} terms</span>
            {bookmarkedOnly && (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                Bookmarked Only
              </span>
            )}
          </div>

          {(searchQuery || selectedSection !== 'all' || selectedBand !== 'all' || selectedType !== 'all' || bookmarkedOnly) && (
            <button
              onClick={handleResetFilters}
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Vocabulary Cards Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const isBookmarked = bookmarkedIds.includes(item.id);
            const isSpeaking = speakingId === item.id;
            const isCopied = copiedId === item.id;

            // Type label formatting
            const typeLabel = 
              item.type === 'collocation' ? 'Collocation' :
              item.type === 'idiom' ? 'Idiom' :
              item.type === 'academic-lexis' ? 'Academic Lexis' :
              item.type === 'discourse-marker' ? 'Discourse Signpost' : 'Phrasal Verb';

            // Band badge color
            const bandColor =
              item.bandLevel >= 9.0 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800' :
              item.bandLevel >= 8.5 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
              'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800';

            return (
              <div
                key={item.id}
                className={`relative rounded-3xl p-5 border-2 transition-all flex flex-col justify-between group ${
                  isBookmarked
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600'
                }`}
              >
                {/* Card Header: Metadata & Bookmark Button */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                      <span className={`px-2 py-0.5 rounded-lg border ${bandColor}`}>
                        Band {item.bandLevel.toFixed(1)}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {typeLabel}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        Unit {item.unitNumber}
                      </span>
                    </div>

                    {/* Bookmark Toggle Star Button */}
                    <button
                      onClick={(e) => handleToggleBookmark(item.id, e)}
                      title={isBookmarked ? 'Remove from difficult terms' : 'Bookmark as difficult term'}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        isBookmarked
                          ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-500 hover:bg-amber-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      aria-label={`Bookmark ${item.term}`}
                    >
                      <Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>
                  </div>

                  {/* Term Title & Audio Pronunciation Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white capitalize tracking-tight">
                        {item.term}
                      </h3>
                      {item.phonetic && (
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {item.phonetic}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={(e) => handlePronounce(item.term, item.id, e)}
                      title="Listen to British pronunciation"
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isSpeaking
                          ? 'bg-emerald-500 text-white border-emerald-600 scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600'
                      }`}
                      aria-label={`Pronounce ${item.term}`}
                    >
                      <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>

                  {/* Definition */}
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2.5 font-medium leading-relaxed">
                    {item.definition}
                  </p>

                  {/* IELTS Model Example Sentence */}
                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-150 dark:border-slate-750 text-xs text-slate-700 dark:text-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                      IELTS Speaking Model:
                    </span>
                    <p className="italic leading-relaxed font-serif">
                      "{item.exampleSentence}"
                    </p>
                  </div>

                  {/* Examiner Tip or Alternatives if present */}
                  {item.examinerTip && (
                    <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-200 bg-amber-500/10 dark:bg-amber-400/10 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-800/40">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong>Examiner Tip:</strong> {item.examinerTip}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Origin & Quick Copy */}
                <div className="mt-4 pt-3 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="truncate max-w-[200px]" title={item.unitTitle}>
                    {item.unitTitle}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleCopy(item.term, item.id, e)}
                      className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Copy phrase"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center mx-auto">
            {bookmarkedOnly ? (
              <Star className="w-7 h-7 fill-amber-400 text-amber-500" />
            ) : (
              <Search className="w-7 h-7 text-slate-400" />
            )}
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {bookmarkedOnly
                ? 'No Difficult Terms Bookmarked Yet'
                : 'No Matching Vocabulary Found'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {bookmarkedOnly
                ? 'Click the star icon on any vocabulary card across the 100 units to bookmark terms that require extra practice.'
                : 'Try adjusting your search keywords, lowering the band filter, or selecting a different curriculum section.'}
            </p>
          </div>

          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-2xl bg-emerald-500 text-white font-bold text-xs sm:text-sm hover:bg-emerald-600 shadow-sm transition-all cursor-pointer"
          >
            Reset Filters & View All Terms
          </button>
        </div>
      )}
    </div>
  );
};
