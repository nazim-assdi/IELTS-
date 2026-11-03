/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Volume2, Search, BookOpen, Star } from 'lucide-react';
import { sound } from '../utils/sound';

interface PhraseItem {
  phrase: string;
  category: string;
  definition: string;
  bandLevel: string;
  example: string;
}

const PHRASES_DATA: PhraseItem[] = [
  {
    phrase: 'A double-edged sword',
    category: 'Technology & Media',
    definition: 'Something that has both beneficial and harmful consequences',
    bandLevel: 'Band 8.0',
    example: 'While artificial intelligence accelerates automation, it remains a double-edged sword regarding job displacement.',
  },
  {
    phrase: 'Not only did it broaden my horizons, but it also...',
    category: 'Grammar Inversions',
    definition: 'Inversion structure demonstrating advanced grammatical range',
    bandLevel: 'Band 8.5',
    example: 'Not only did living abroad broaden my horizons, but it also cultivated unprecedented emotional resilience.',
  },
  {
    phrase: 'A burgeoning metropolitan hub',
    category: 'Hometown & Urban',
    definition: 'A rapidly expanding and developing modern city',
    bandLevel: 'Band 8.0',
    example: 'My hometown has evolved from a sleepy coastal village into a burgeoning metropolitan hub.',
  },
  {
    phrase: 'In the grand scheme of things',
    category: 'Abstract Debate (Part 3)',
    definition: 'Considering the ultimate significance in the larger picture',
    bandLevel: 'Band 8.5',
    example: 'In the grand scheme of things, short-term economic friction is trivial compared to planetary ecological collapse.',
  },
  {
    phrase: 'Hone interpersonal acumen',
    category: 'Work & Career',
    definition: 'Refine the ability to communicate and interact effectively with diverse people',
    bandLevel: 'Band 8.5',
    example: 'Navigating team projects enabled me to hone my interpersonal acumen significantly.',
  },
  {
    phrase: 'Paradoxically enough',
    category: 'Abstract Debate (Part 3)',
    definition: 'In a manner that appears contradictory yet reveals a deeper truth',
    bandLevel: 'Band 8.5',
    example: 'Paradoxically enough, heightened connectivity has yielded widespread feelings of alienation among youth.',
  },
  {
    phrase: 'Embark upon an ambitious endeavor',
    category: 'Work & Career',
    definition: 'Begin a demanding, high-stakes journey or enterprise',
    bandLevel: 'Band 8.0',
    example: 'I recently embarked upon an ambitious endeavor to launch a renewable energy consultancy.',
  },
  {
    phrase: 'Second to none',
    category: 'Hometown & Urban',
    definition: 'Unrivaled, superior to all others of its type',
    bandLevel: 'Band 8.0',
    example: 'The gastronomic scene in Tokyo is second to none, with unmatched culinary diversity.',
  },
];

export const PhrasebookModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['All', 'Hometown & Urban', 'Technology & Media', 'Work & Career', 'Abstract Debate (Part 3)', 'Grammar Inversions'];

  const filtered = PHRASES_DATA.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.phrase.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.definition.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const speakPhrase = (text: string) => {
    sound.playTap();
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Band 8+ Lexicon Bank</div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">IELTS Collocations & Idioms</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Phrasebook"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Band 8+ idioms, connectors, collocations..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => {
                  sound.playTap();
                  setSelectedCategory(c);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === c
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Cards List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{item.phrase}</h4>
                  <button
                    onClick={() => speakPhrase(item.phrase)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
                    aria-label={`Listen to pronunciation of ${item.phrase}`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {item.bandLevel}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">{item.definition}</p>

              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 italic">
                "{item.example}"
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
