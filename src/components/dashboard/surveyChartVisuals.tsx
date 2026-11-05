'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';

export const DONUT_COLORS = ['#3b6fb6', '#e3a23b', '#238a7b', '#8064a2', '#cc6677', '#667085'];

export function getChartInsight(data: any, chartId: string): string {
  if (!data) return 'No chart data is currently available.';
  if (chartId === 'teacher-experience' && Array.isArray(data) && data.length === 0) {
    return 'No teaching-experience answers were found in the teacher pre-survey records.';
  }

  if (chartId === 'future_adoption_intent') {
    const getIntent = (items: any[]) => {
      const total = items.reduce((sum, item) => sum + Number(item.count || 0), 0);
      const continuing = items
        .filter((item) => String(item.name || '').toLowerCase().startsWith('yes'))
        .reduce((sum, item) => sum + Number(item.count || 0), 0);
      return total ? `${((continuing / total) * 100).toFixed(1)}%` : 'no responses';
    };
    return `Respondents indicating they will continue: students ${getIntent(data.students || [])}; faculty ${getIntent(data.faculty || [])}. This reflects stated intent, not observed future use.`;
  }

  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) return 'No responses are available to summarize.';

  if (rows.some((item) => item.preNeedPct !== undefined || item.postDeliveredPct !== undefined)) {
    const topNeed = [...rows].sort((a, b) => Number(b.preNeedPct || 0) - Number(a.preNeedPct || 0))[0];
    const topDelivered = [...rows].sort((a, b) => Number(b.postDeliveredPct || 0) - Number(a.postDeliveredPct || 0))[0];
    return `Highest pre-survey request: ${topNeed.format} (${topNeed.preNeedPct}%). Highest post-survey helpful asset: ${topDelivered.format} (${topDelivered.postDeliveredPct}%). These are separate survey groups, not necessarily paired students.`;
  }

  if (rows.some((item) => item.baselinePre !== undefined && item.postTraining !== undefined)) {
    const top = [...rows].sort((a, b) => Number(b.postTraining || 0) - Number(a.postTraining || 0))[0];
    return `Highest displayed post-training measure: ${top.axis} (${top.postTraining}%). Some radar baselines are configured reference values rather than measured pre-survey results, so this is not a measured overall gain.`;
  }

  if (rows.some((item) => item.prePct !== undefined && item.postPct !== undefined)) {
    const largestShift = [...rows].sort((a, b) =>
      Math.abs(Number(b.postPct || 0) - Number(a.prePct || 0)) -
      Math.abs(Number(a.postPct || 0) - Number(a.prePct || 0))
    )[0];
    const direction = Number(largestShift.postPct) >= Number(largestShift.prePct) ? 'increased' : 'decreased';
    const caveat = chartId === 'familiarity-shift'
      ? 'Post responses measure perceived concept improvement, not AI familiarity.'
      : 'Pre and post respondents may differ.';
    return `Largest displayed change: ${largestShift.level} ${direction} from ${largestShift.prePct}% to ${largestShift.postPct}%. ${caveat}`;
  }

  if (rows.some((item) => item.avgHoursSaved !== undefined)) {
    const top = [...rows].sort((a, b) => Number(b.avgHoursSaved || 0) - Number(a.avgHoursSaved || 0))[0];
    return `Highest estimated average: ${top.level}, ${top.avgHoursSaved} hours saved per week. Hour ranges are represented by estimated midpoints; unmatched responses may be grouped as Novice.`;
  }

  if (rows.some((item) => item.achievedPct !== undefined)) {
    const top = [...rows].sort((a, b) => Number(b.achievedPct || 0) - Number(a.achievedPct || 0))[0];
    return `Highest post-survey outcome proxy: ${top.goal} (${top.achievedPct}%). Pre and post percentages use separate respondent groups and do not establish a matched change.`;
  }

  if (rows.some((item) => item.avgScore !== undefined)) {
    const top = [...rows].sort((a, b) => Number(b.avgScore || 0) - Number(a.avgScore || 0))[0];
    return `Highest displayed department average: ${top.dept}, ${top.avgScore}/5. The score is an approximate mapping of survey answer categories.`;
  }

  const labelKey = ['name', 'label', 'obstacle', 'format', 'asset', 'tool', 'status', 'habit', 'interest', 'frequency', 'institution', 'department', 'semester', 'range', 'category', 'week', 'rating']
    .find((key) => rows.some((item) => item[key] !== undefined));
  const countKey = ['count', 'responses'].find((key) => rows.some((item) => item[key] !== undefined));
  const pctKey = ['pct'].find((key) => rows.some((item) => item[key] !== undefined));
  const top = [...rows].sort((a, b) => {
    if (pctKey) return Number(b[pctKey] || 0) - Number(a[pctKey] || 0);
    return Number(b[countKey || ''] || 0) - Number(a[countKey || ''] || 0);
  })[0];

  if (!labelKey || !top) return 'Chart values reflect the current dashboard data.';
  const count = countKey ? `, ${top[countKey]} responses` : '';
  const percentage = pctKey ? ` (${top[pctKey]}%)` : '';
  return `Most common displayed category: ${top[labelKey]}${count}${percentage}.`;
}

export function ExplanationCallout({ data, chartId }: { data: any; chartId: string }) {
  return (
    <div className="mt-3.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-2.5 text-xs text-amber-950 leading-relaxed shadow-2xs">
      <Lightbulb className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
      <div>
        <span className="font-black text-amber-900 mr-1.5">Current data summary:</span>
        <span className="text-slate-700 font-medium">{getChartInsight(data, chartId)}</span>
      </div>
    </div>
  );
}

export function getCategoryShare(
  items: any[] | undefined,
  include: (item: any, index: number) => boolean
): string {
  if (!items?.length) return '—';
  const total = items.reduce((sum, item) => sum + Number(item.count || 0), 0);
  if (!total) return '—';
  const selected = items.reduce(
    (sum, item, index) => sum + (include(item, index) ? Number(item.count || 0) : 0),
    0
  );
  return `${((selected / total) * 100).toFixed(1)}%`;
}

export function SvgDonutChart({
  data,
  size = 180,
  strokeWidth = 22,
  centerText,
  centerSub,
}: {
  data: { label: string; value: number; color?: string; pct?: number }[];
  size?: number;
  strokeWidth?: number;
  centerText?: string;
  centerSub?: string;
}) {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-3">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {data.map((item, idx) => {
            const pct = (item.value || 0) / total;
            const dashArray = pct * circumference;
            const dashOffset = -(accumulated * circumference);
            const color = item.color || DONUT_COLORS[idx % DONUT_COLORS.length];
            accumulated += pct;
            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashArray} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                className="transition-all duration-700"
              />
            );
          })}
        </svg>
        {centerText && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xl font-black text-slate-900 leading-none">{centerText}</span>
            {centerSub && <span className="text-[10px] font-bold text-slate-400 mt-1">{centerSub}</span>}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="space-y-2 min-w-[210px]">
        {data.map((item, idx) => {
          const calcPct = Math.round(((item.value || 0) / total) * 100);
          const color = item.color || DONUT_COLORS[idx % DONUT_COLORS.length];
          return (
            <div key={idx} className="flex items-center justify-between text-xs font-bold gap-3">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-slate-700 truncate">{item.label}</span>
              </div>
              <div className="text-slate-900 shrink-0 font-mono text-[11px]">
                <span className="font-black">{item.value}</span>
                <span className="text-slate-400 ml-1">({item.pct ?? calcPct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MiniRadialRing({
  percent,
  size = 46,
  strokeWidth = 5,
  color = '#059669',
  trackColor = '#e2e8f0',
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-800">
        {percent}%
      </div>
    </div>
  );
}
