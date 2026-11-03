/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  TrendingUp, Calendar, Zap, Clock, CheckCircle2, 
  ArrowUpRight, ArrowDownRight, Award, BarChart3, Info 
} from 'lucide-react';
import { 
  DayProgress, 
  calculateWeeklySummary, 
  INITIAL_WEEKLY_DATA 
} from '../utils/weekly-progress';
import { sound } from '../utils/sound';

interface WeeklyProgressReportProps {
  currentXp?: number;
  isDarkTheme?: boolean;
}

export const WeeklyProgressReport: React.FC<WeeklyProgressReportProps> = ({ 
  currentXp, 
  isDarkTheme 
}) => {
  const [weeklyData, setWeeklyData] = useState<DayProgress[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ielts_weekly_progress');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return INITIAL_WEEKLY_DATA;
  });

  const [metricView, setMetricView] = useState<'xp' | 'minutes'>('xp');
  const [hoveredDay, setHoveredDay] = useState<DayProgress | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const summary = calculateWeeklySummary(weeklyData);

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ielts_weekly_progress', JSON.stringify(weeklyData));
      } catch (e) {}
    }
  }, [weeklyData]);

  // Render D3 Bar Chart
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clean up previous render

    const margin = { top: 22, right: 12, bottom: 28, left: 34 };
    const width = 340 - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const days = weeklyData.map(d => d.day);
    const subkeys = ['lastWeek', 'thisWeek'] as const;

    // Determine max value for y scale
    const maxValue = d3.max(weeklyData, d => {
      if (metricView === 'xp') {
        return Math.max(d.thisWeekXp, d.lastWeekXp);
      }
      return Math.max(d.thisWeekMinutes, d.lastWeekMinutes);
    }) || 100;

    const yDomainMax = Math.max(metricView === 'xp' ? 80 : 45, Math.ceil(maxValue * 1.15 / 10) * 10);

    // X Scale: grouped by day of week
    const x0 = d3.scaleBand()
      .domain(days)
      .rangeRound([0, width])
      .paddingInner(0.24);

    // Sub-X Scale: lastWeek vs thisWeek bars
    const x1 = d3.scaleBand()
      .domain([...subkeys])
      .rangeRound([0, x0.bandwidth()])
      .padding(0.12);

    // Y Scale
    const y = d3.scaleLinear()
      .domain([0, yDomainMax])
      .rangeRound([height, 0]);

    // Color definitions
    const thisWeekColor = isDarkTheme ? '#10b981' : '#059669'; // Emerald
    const lastWeekColor = isDarkTheme ? '#475569' : '#94a3b8'; // Slate muted

    // Horizontal grid lines
    const yAxisTicks = y.ticks(4);
    g.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(yAxisTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', isDarkTheme ? '#334155' : '#e2e8f0')
      .attr('stroke-dasharray', '2,3')
      .attr('stroke-width', 1);

    // Benchmark Daily Target Line (e.g. 50 XP or 25 mins)
    const targetValue = metricView === 'xp' ? 50 : 25;
    if (targetValue <= yDomainMax) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', y(targetValue))
        .attr('y2', y(targetValue))
        .attr('stroke', isDarkTheme ? '#f59e0b' : '#d97706')
        .attr('stroke-dasharray', '4,4')
        .attr('stroke-width', 1.2)
        .attr('opacity', 0.85);

      g.append('text')
        .attr('x', width - 2)
        .attr('y', y(targetValue) - 4)
        .attr('text-anchor', 'end')
        .attr('fill', isDarkTheme ? '#fbbf24' : '#b45309')
        .attr('font-size', '9px')
        .attr('font-weight', '700')
        .text(`Target ${targetValue}${metricView === 'xp' ? 'XP' : 'm'}`);
    }

    // Day groups
    const dayGroups = g.selectAll('.day-group')
      .data(weeklyData)
      .enter()
      .append('g')
      .attr('class', 'day-group')
      .attr('transform', d => `translate(${x0(d.day)},0)`)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        setHoveredDay(d);
      })
      .on('mouseleave', () => {
        setHoveredDay(null);
      });

    // Render Last Week Bars
    dayGroups.append('rect')
      .attr('class', 'bar-last-week')
      .attr('x', x1('lastWeek') || 0)
      .attr('y', d => {
        const val = metricView === 'xp' ? d.lastWeekXp : d.lastWeekMinutes;
        return y(val);
      })
      .attr('width', x1.bandwidth())
      .attr('height', d => {
        const val = metricView === 'xp' ? d.lastWeekXp : d.lastWeekMinutes;
        return Math.max(0, height - y(val));
      })
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('fill', lastWeekColor)
      .attr('opacity', 0.7);

    // Render This Week Bars
    dayGroups.append('rect')
      .attr('class', 'bar-this-week')
      .attr('x', x1('thisWeek') || 0)
      .attr('y', d => {
        const val = metricView === 'xp' ? d.thisWeekXp : d.thisWeekMinutes;
        return y(val);
      })
      .attr('width', x1.bandwidth())
      .attr('height', d => {
        const val = metricView === 'xp' ? d.thisWeekXp : d.thisWeekMinutes;
        return Math.max(0, height - y(val));
      })
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('fill', thisWeekColor);

    // Top value labels on this week's bars
    dayGroups.append('text')
      .attr('class', 'bar-label')
      .attr('x', (x1('thisWeek') || 0) + x1.bandwidth() / 2)
      .attr('y', d => {
        const val = metricView === 'xp' ? d.thisWeekXp : d.thisWeekMinutes;
        return y(val) - 3;
      })
      .attr('text-anchor', 'middle')
      .attr('fill', isDarkTheme ? '#e2e8f0' : '#1e293b')
      .attr('font-size', '8.5px')
      .attr('font-weight', '700')
      .text(d => {
        const val = metricView === 'xp' ? d.thisWeekXp : d.thisWeekMinutes;
        return val > 0 ? val : '';
      });

    // X Axis
    const xAxis = d3.axisBottom(x0).tickSize(0);
    g.append('g')
      .attr('transform', `translate(0,${height + 5})`)
      .call(xAxis)
      .call(axisG => axisG.select('.domain').remove())
      .selectAll('text')
      .attr('fill', isDarkTheme ? '#94a3b8' : '#64748b')
      .attr('font-size', '10px')
      .attr('font-weight', '700');

    // Y Axis
    const yAxis = d3.axisLeft(y).ticks(3).tickSize(0);
    g.append('g')
      .call(yAxis)
      .call(axisG => axisG.select('.domain').remove())
      .selectAll('text')
      .attr('fill', isDarkTheme ? '#94a3b8' : '#64748b')
      .attr('font-size', '9px')
      .attr('font-weight', '600')
      .attr('dx', '-3');

  }, [weeklyData, metricView, isDarkTheme]);

  const isXpGainPositive = summary.xpDelta >= 0;

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
      {/* Header with Title and Consistency Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
              Weekly Progress Report
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Consistency & XP Comparison
            </p>
          </div>
        </div>

        {/* Consistency Badge */}
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
          summary.activeDaysThisWeek >= 6
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
            : summary.activeDaysThisWeek >= 4
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
        }`}>
          {summary.activeDaysThisWeek}/7 Active Days
        </span>
      </div>

      {/* KPI Comparison Strip */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Total XP Gain vs Last Week */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            <span>Weekly XP Gain</span>
            <Zap className="w-3 h-3 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {summary.thisWeekTotalXp}
            </span>
            <span className="text-[11px] font-bold text-slate-400">XP</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-extrabold">
            {isXpGainPositive ? (
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-3 h-3" />
                +{summary.xpDelta} XP (+{summary.xpDeltaPercentage}%)
              </span>
            ) : (
              <span className="inline-flex items-center text-rose-600 dark:text-rose-400">
                <ArrowDownRight className="w-3 h-3" />
                {summary.xpDelta} XP ({summary.xpDeltaPercentage}%)
              </span>
            )}
            <span className="text-[10px] font-medium text-slate-400">vs last wk</span>
          </div>
        </div>

        {/* Practice Minutes */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            <span>Immersion Time</span>
            <Clock className="w-3 h-3 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {summary.thisWeekTotalMinutes}
            </span>
            <span className="text-[11px] font-bold text-slate-400">mins</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
            <span>{summary.lastWeekTotalMinutes}m last wk</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              (+{Math.max(0, summary.thisWeekTotalMinutes - summary.lastWeekTotalMinutes)}m)
            </span>
          </div>
        </div>
      </div>

      {/* Metric Toggle & Legend */}
      <div className="flex items-center justify-between pt-1">
        {/* Toggle metric */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
          <button
            onClick={() => {
              sound.playTap();
              setMetricView('xp');
            }}
            className={`px-2 py-1 rounded-lg transition-all ${
              metricView === 'xp'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-extrabold shadow-xs'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            XP Gains
          </button>
          <button
            onClick={() => {
              sound.playTap();
              setMetricView('minutes');
            }}
            className={`px-2 py-1 rounded-lg transition-all ${
              metricView === 'minutes'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-extrabold shadow-xs'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Minutes
          </button>
        </div>

        {/* D3 Legend */}
        <div className="flex items-center gap-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-500 inline-block" />
            This Week
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 dark:bg-slate-600 inline-block" />
            Last Week
          </span>
        </div>
      </div>

      {/* D3 SVG Bar Chart Container */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 p-2">
        <svg
          ref={svgRef}
          viewBox="0 0 340 180"
          className="w-full h-auto block select-none"
        />

        {/* Hover Day Tooltip Callout */}
        {hoveredDay && (
          <div className="absolute top-2 right-2 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-2.5 py-1.5 rounded-xl shadow-lg border border-slate-700 dark:border-slate-200 text-[10px] space-y-0.5 animate-in fade-in-50 zoom-in-95 pointer-events-none">
            <div className="font-extrabold flex items-center justify-between gap-3">
              <span>{hoveredDay.fullDay}</span>
              <span className="text-emerald-400 dark:text-emerald-600 font-black">
                +{hoveredDay.thisWeekXp} XP
              </span>
            </div>
            <div className="text-[9px] opacity-80 flex items-center gap-2">
              <span>This wk: {hoveredDay.thisWeekMinutes}m ({hoveredDay.lessonsCompleted} lessons)</span>
              <span>·</span>
              <span>Last wk: {hoveredDay.lastWeekXp} XP</span>
            </div>
          </div>
        )}
      </div>

      {/* Consistency Feedback Coach Note */}
      <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-start gap-2 leading-relaxed">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-emerald-950 dark:text-emerald-100">
            {summary.consistencyRating} Consistency ({summary.consistencyScore}%)
          </span>
          <p className="text-[10.5px] opacity-90 mt-0.5">
            {summary.consistencyFeedback}
          </p>
        </div>
      </div>
    </div>
  );
};
