/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, Award, CheckCircle2, AlertCircle, Compass, 
  Calendar, Layers, Sparkles, Filter, ChevronRight, Mic, Info 
} from 'lucide-react';
import { 
  PracticeSessionRecord, 
  calculateAnalyticsSummary, 
  getLast10Sessions, 
  INITIAL_PRACTICE_SESSIONS 
} from '../utils/speaking-analytics';
import { sound } from '../utils/sound';

interface SpeakingAnalyticsProps {
  sessions?: PracticeSessionRecord[];
  onStartPractice?: () => void;
  isDarkTheme?: boolean;
}

export const SpeakingAnalytics: React.FC<SpeakingAnalyticsProps> = ({
  sessions = INITIAL_PRACTICE_SESSIONS,
  onStartPractice,
  isDarkTheme = false,
}) => {
  const [showSubScores, setShowSubScores] = useState<boolean>(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Take the last 10 practice sessions
  const last10 = getLast10Sessions(sessions);
  const summary = calculateAnalyticsSummary(last10);

  // Chart data format
  const chartData = last10.map((s) => ({
    sessionId: s.id,
    sessionLabel: `S${s.sessionNumber}`,
    fullLabel: `Session ${s.sessionNumber} (${s.date})`,
    overallBand: s.overallBand,
    fluency: s.fluency,
    lexical: s.lexical,
    grammar: s.grammar,
    pronunciation: s.pronunciation,
    topic: s.topic,
    part: s.part,
    notes: s.examinerNotes,
  }));

  const selectedSession = last10.find((s) => s.id === selectedSessionId) || last10[last10.length - 1];

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xl text-xs space-y-2 max-w-xs z-50">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <span className="font-extrabold text-slate-900 dark:text-white">{data.fullLabel}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
              Band {data.overallBand.toFixed(1)}
            </span>
          </div>
          <div className="text-slate-600 dark:text-slate-300 font-medium">
            <span className="font-bold text-slate-800 dark:text-slate-200">Topic: </span>
            {data.topic}
          </div>
          <div className="grid grid-cols-2 gap-1.5 py-1 text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
            <div>Fluency: <strong className="text-indigo-600 dark:text-indigo-400">{data.fluency}</strong></div>
            <div>Lexical: <strong className="text-sky-600 dark:text-sky-400">{data.lexical}</strong></div>
            <div>Grammar: <strong className="text-amber-600 dark:text-amber-400">{data.grammar}</strong></div>
            <div>Pronunciation: <strong className="text-emerald-600 dark:text-emerald-400">{data.pronunciation}</strong></div>
          </div>
          <p className="text-[11px] text-slate-500 italic">"{data.notes}"</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Benchmark Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Latest Band Card */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Latest Band Score</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {summary.latestBand.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              +{summary.bandDelta > 0 ? `+${summary.bandDelta}` : summary.bandDelta}
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block">
            Started at Band {summary.startingBand.toFixed(1)} (Session 1)
          </span>
        </div>

        {/* 10-Session Average */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>10-Session Average</span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {summary.averageBand.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-semibold">/ 9.0 Target</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block">
            Peak: Band {summary.highestBand.toFixed(1)}
          </span>
        </div>

        {/* Strongest Criterion */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Strongest Pillar</span>
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
          <div className="font-black text-lg text-slate-900 dark:text-white truncate">
            {summary.strongestCriterion.name}
          </div>
          <div className="text-xs text-teal-600 dark:text-teal-400 font-bold">
            Average Band {summary.strongestCriterion.score.toFixed(1)}
          </div>
        </div>

        {/* Primary Growth Area */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Priority Growth Area</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-black text-lg text-slate-900 dark:text-white truncate">
            {summary.weakestCriterion.name}
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400 font-bold">
            Average Band {summary.weakestCriterion.score.toFixed(1)} • Focus next
          </div>
        </div>
      </div>

      {/* Main Line Chart Section */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Band Score Progression (Last 10 Practice Sessions)
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase">
                Recharts Visualizer
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualizing trajectory toward official Cambridge IELTS Speaking Band 8.5 - 9.0
            </p>
          </div>

          {/* Sub-scores Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playTap();
                setShowSubScores(!showSubScores);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                showSubScores
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-800 dark:text-emerald-300 font-extrabold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {showSubScores ? 'Hide 4 IELTS Criteria' : 'Show 4 IELTS Criteria'}
            </button>
          </div>
        </div>

        {/* Recharts Line Chart */}
        <div className="h-72 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              onClick={(e: any) => {
                const payload = (e as any)?.activePayload;
                if (payload && payload.length) {
                  sound.playTap();
                  setSelectedSessionId(payload[0].payload.sessionId);
                }
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDarkTheme ? '#334155' : '#e2e8f0'} 
                vertical={false}
              />
              <XAxis 
                dataKey="sessionLabel" 
                stroke={isDarkTheme ? '#94a3b8' : '#64748b'} 
                fontSize={12}
                fontWeight={600}
                tickLine={false}
              />
              <YAxis 
                domain={[5.0, 9.0]} 
                ticks={[5.0, 6.0, 7.0, 8.0, 9.0]} 
                stroke={isDarkTheme ? '#94a3b8' : '#64748b'} 
                fontSize={12}
                fontWeight={600}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Cambridge Reference Target Thresholds */}
              <ReferenceLine 
                y={7.0} 
                stroke="#059669" 
                strokeDasharray="4 4" 
                label={{ value: 'Band 7.0 (Good User)', position: 'insideTopRight', fill: '#059669', fontSize: 10, fontWeight: 700 }}
              />
              <ReferenceLine 
                y={8.0} 
                stroke="#0284c7" 
                strokeDasharray="4 4" 
                label={{ value: 'Band 8.0 (Superior)', position: 'insideTopRight', fill: '#0284c7', fontSize: 10, fontWeight: 700 }}
              />

              {/* Main Overall Band Score Line */}
              <Line
                type="monotone"
                dataKey="overallBand"
                name="Overall Band"
                stroke="#10b981"
                strokeWidth={3.5}
                dot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
              />

              {/* Optional 4 IELTS Criterion Sub-lines */}
              {showSubScores && (
                <>
                  <Line
                    type="monotone"
                    dataKey="fluency"
                    name="Fluency & Coherence"
                    stroke="#6366f1"
                    strokeWidth={1.8}
                    strokeDasharray="4 2"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lexical"
                    name="Lexical Resource"
                    stroke="#0284c7"
                    strokeWidth={1.8}
                    strokeDasharray="4 2"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="grammar"
                    name="Grammatical Range"
                    stroke="#f59e0b"
                    strokeWidth={1.8}
                    strokeDasharray="4 2"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pronunciation"
                    name="Pronunciation"
                    stroke="#14b8a6"
                    strokeWidth={1.8}
                    strokeDasharray="4 2"
                    dot={{ r: 3 }}
                  />
                </>
              )}
              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Rubric Explainer Footnote */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-500" />
            <span>Scores calculated in accordance with official British Council & IDP 9-band descriptors.</span>
          </div>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            Click any point or session below to inspect feedback.
          </span>
        </div>
      </div>

      {/* Selected Session Inspector & History Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Selected Session Detailed Card */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/70 dark:from-slate-900 dark:to-slate-850 border-2 border-emerald-200 dark:border-emerald-900/60 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Selected Session Deep Dive
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold text-xs">
              Band {selectedSession.overallBand.toFixed(1)}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {selectedSession.topic}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Session {selectedSession.sessionNumber} • {selectedSession.part} • {selectedSession.date}
            </span>
          </div>

          {/* Sub-criterion Breakdown */}
          <div className="space-y-2 pt-2 border-t border-emerald-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">Fluency & Coherence</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Band {selectedSession.fluency.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">Lexical Resource</span>
              <span className="text-sky-600 dark:text-sky-400 font-extrabold">Band {selectedSession.lexical.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">Grammatical Accuracy</span>
              <span className="text-amber-600 dark:text-amber-400 font-extrabold">Band {selectedSession.grammar.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">Pronunciation</span>
              <span className="text-teal-600 dark:text-teal-400 font-extrabold">Band {selectedSession.pronunciation.toFixed(1)}</span>
            </div>
          </div>

          {/* Examiner Notes */}
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-1">
              Examiner Assessment:
            </span>
            "{selectedSession.examinerNotes}"
          </div>

          {onStartPractice && (
            <button
              onClick={() => {
                sound.playTap();
                onStartPractice();
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Mic className="w-4 h-4" />
              <span>Practice This Topic in Voice Studio</span>
            </button>
          )}
        </div>

        {/* Right 2 Cols: Complete 10-Session Log */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
              Practice Sessions History (Last 10)
            </h4>
            <span className="text-xs text-slate-400 font-medium">
              Showing 10 of {last10.length} records
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {last10.map((item) => {
              const isSelected = item.id === selectedSession.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    sound.playTap();
                    setSelectedSessionId(item.id);
                  }}
                  className={`py-3 px-3 rounded-2xl cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-700 dark:text-slate-300 shrink-0">
                      S{item.sessionNumber}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {item.topic}
                      </h5>
                      <span className="text-xs text-slate-400">
                        {item.part} • {item.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-black px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      Band {item.overallBand.toFixed(1)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
