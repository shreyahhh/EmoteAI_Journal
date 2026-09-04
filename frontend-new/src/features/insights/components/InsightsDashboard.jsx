import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from 'recharts';
import { getCreatedAtDate } from '../../../lib/entryDates';
import { buildMoodBuckets, filterEntriesByRange, moodValence } from '../../../lib/moodBuckets';
import { getWeeklySummary } from '../../../lib/gemini';
import { getMoodColor, MOOD_COLORS, ACTIVITY_CHART_NAMES } from '../../../lib/moodMeta';
import { cn } from '../../../lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Button } from '../../../components/ui/button';
import EmptyState from '../../../components/shared/EmptyState';
import PatternInsights from './PatternInsights';

const RECAP_PERIODS = {
  week: { label: 'Weekly', days: 7, minEntries: 3 },
  month: { label: 'Monthly', days: 30, minEntries: 5 },
};

const WeeklySummary = ({ entries }) => {
  const [period, setPeriod] = useState('week');
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { days, minEntries } = RECAP_PERIODS[period];

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError('');
    setSummary(null);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const recentEntries = entries.filter((entry) => {
      const d = getCreatedAtDate(entry);
      return d && d > cutoff;
    });
    if (recentEntries.length < minEntries) {
      setError(`You need at least ${minEntries} entries in the last ${days} days to generate a summary.`);
      setIsLoading(false);
      return;
    }
    const entriesText = recentEntries
      .map((e) => {
        const d = getCreatedAtDate(e);
        return `Entry on ${d ? d.toLocaleDateString() : '?'}:\nTitle: ${e.title}\nContent: ${e.content}`;
      })
      .join('\n\n---\n\n');
    const generatedSummary = await getWeeklySummary(entriesText, period);
    setSummary(generatedSummary);
    setIsLoading(false);
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{RECAP_PERIODS[period].label} summary</CardTitle>
            <CardDescription>
              Uses entries from the last {days} days (you need at least {minEntries}). Good for a gentle recap of tone and themes.
            </CardDescription>
          </div>
          <Tabs
            value={period}
            onValueChange={(next) => {
              setPeriod(next);
              setSummary(null);
              setError('');
            }}
          >
            <TabsList aria-label="Recap period">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant="gradient"
          onClick={handleGenerateSummary}
          disabled={isLoading}
          className="w-full disabled:cursor-not-allowed sm:w-auto"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing…
            </span>
          ) : (
            'Generate summary'
          )}
        </Button>
        {error && <p className="mt-4 text-center text-emote-muted font-medium text-[#a8432f]">{error}</p>}
        {summary && (
          <div className="mt-6 space-y-6 border-t border-emote-border pt-6 animate-fade-in">
            <div>
              <h4 className="mb-2 text-emote-caption font-semibold uppercase tracking-wide text-emote-accent">Overall feeling</h4>
              <p className="text-emote-body leading-relaxed text-emote-ink-soft">{summary.overallFeeling}</p>
            </div>
            <div>
              <h4 className="mb-2 text-emote-caption font-semibold uppercase tracking-wide text-emote-accent">Key themes</h4>
              <div className="flex flex-wrap gap-2">
                {summary.keyThemes?.map((theme, index) => (
                  <span key={index} className="rounded-lg bg-emote-gold/10 px-3 py-1 text-emote-muted font-medium text-emote-accent-2 ring-1 ring-emote-gold/30">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-emote-caption font-semibold uppercase tracking-wide text-emote-accent">A positive moment</h4>
              <p className="text-emote-body italic leading-relaxed text-emote-ink-soft">&ldquo;{summary.positiveMoment}&rdquo;</p>
            </div>
            <div>
              <h4 className="mb-2 text-emote-caption font-semibold uppercase tracking-wide text-emote-accent">Suggestion</h4>
              <p className="text-emote-body leading-relaxed text-emote-ink-soft">{summary.gentleSuggestion}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-emote">
        <p className="text-emote-card-title font-semibold text-foreground">{`${label}`}</p>
        <p className="text-emote-muted font-medium text-emote-accent">{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const StackedMoodTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value > 0);
  const total = rows.reduce((s, p) => s + p.value, 0);
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-emote text-emote-muted text-foreground">
      <p className="text-emote-card-title font-semibold text-foreground">{label}</p>
      {total === 0 ? (
        <p className="mt-1">No entries in this bucket.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {rows.map((p) => (
            <li key={p.dataKey}>
              {p.name}: {p.value}{' '}
              <span className="text-emote-ink-faint">({Math.round((p.value / total) * 100)}%)</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/** Chart axis/grid colors aren't Tailwind classes (recharts renders them as raw SVG
 * attributes, which don't resolve CSS custom properties), so they're defined here. */
function getChartPalette() {
  return {
    muted: '#7a5c3e',
    grid: '#e0c9a0',
    legend: '#7a5c3e',
  };
}

const RANGE_TABS = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

const ActivityMoodChart = ({ entries }) => {
  const chartData = useMemo(() => {
    const activityMoods = {};
    entries.forEach((entry) => {
      const isPositive = entry.mood === 'happy' || (entry.sentimentScore && entry.sentimentScore > 2);
      if (isPositive && entry.activities && entry.activities.length > 0) {
        entry.activities.forEach((activityId) => {
          activityMoods[activityId] = (activityMoods[activityId] || 0) + 1;
        });
      }
    });
    return Object.entries(activityMoods)
      .map(([activityId, count]) => ({
        name: ACTIVITY_CHART_NAMES[activityId] || activityId,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [entries]);

  if (chartData.length === 0) {
    return (
      <EmptyState
        title="Activities & mood"
        description="Tag activities on entries with positive mood in this range."
      />
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activities & mood</CardTitle>
        <CardDescription>
          Based on happy entries in the selected range—tagged activities you logged most often.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {chartData.map((item) => {
            const barWidth = `${(item.count / Math.max(...chartData.map((d) => d.count))) * 100}%`;
            return (
              <div key={item.name} className="flex items-center gap-4 text-emote-muted">
                <span className="w-28 text-right font-medium text-emote-ink-soft">{item.name}</span>
                <div className="h-7 flex-1 overflow-hidden rounded-full bg-emote-surface-alt ring-1 ring-emote-border">
                  <div
                    className="flex h-full items-center justify-end rounded-full bg-gradient-to-r from-emote-accent-2 via-emote-accent to-emote-gold px-2 transition-all duration-500"
                    style={{ width: barWidth }}
                  >
                    <span className="text-emote-caption font-bold text-emote-surface">{item.count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const THEME_TONE_STYLES = [
  { test: (v) => v >= 2, className: 'from-[#3f8f5f] to-[#3f8f5f]/70', label: 'text-[#3f8f5f]' },
  { test: (v) => v <= -2, className: 'from-[#a8432f] to-[#a8432f]/70', label: 'text-[#a8432f]' },
];

const ThemeBreakdown = ({ entries }) => {
  const rows = useMemo(() => {
    const byTheme = {};
    entries.forEach((entry) => {
      (entry.themes || []).forEach((theme) => {
        if (!byTheme[theme]) byTheme[theme] = { name: theme, count: 0, sentimentSum: 0 };
        byTheme[theme].count += 1;
        byTheme[theme].sentimentSum += moodValence(entry);
      });
    });
    return Object.values(byTheme)
      .map((t) => ({ ...t, avgSentiment: Math.round((t.sentimentSum / t.count) * 10) / 10 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [entries]);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Mood by theme"
        description="Once entries carry AI-detected themes, this breaks down which topics run brighter or heavier."
      />
    );
  }

  const maxCount = Math.max(...rows.map((r) => r.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood by theme</CardTitle>
        <CardDescription>
          Themes the AI picked up most often in this range, with the average tone attached to each.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rows.map((row) => {
            const tone = THEME_TONE_STYLES.find((t) => t.test(row.avgSentiment));
            const barWidth = `${(row.count / maxCount) * 100}%`;
            return (
              <div key={row.name} className="flex items-center gap-4 text-emote-muted">
                <span className="w-32 shrink-0 truncate text-right font-medium text-emote-ink-soft" title={row.name}>
                  {row.name}
                </span>
                <div className="h-7 flex-1 overflow-hidden rounded-full bg-emote-surface-alt ring-1 ring-emote-border">
                  <div
                    className={cn(
                      'flex h-full items-center justify-end rounded-full bg-gradient-to-r px-2 transition-all duration-500',
                      tone ? tone.className : 'from-emote-accent-2 via-emote-accent to-emote-gold',
                    )}
                    style={{ width: barWidth }}
                  >
                    <span className="text-emote-caption font-bold text-emote-surface">{row.count}</span>
                  </div>
                </div>
                <span className={cn('w-14 shrink-0 text-right text-emote-caption font-semibold', tone ? tone.label : 'text-emote-ink-faint')}>
                  {row.avgSentiment > 0 ? '+' : ''}
                  {row.avgSentiment}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const MoodTrendSection = ({ entries, range }) => {
  const scoped = useMemo(() => filterEntriesByRange(entries, range), [entries, range]);
  const buckets = useMemo(() => buildMoodBuckets(scoped, range), [scoped, range]);
  const { muted: chartMuted, grid: gridLight, legend: legendColor } = getChartPalette();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Mood mix over time</CardTitle>
          <CardDescription>
            Stacked entry counts by mood label for each {range === 'week' ? 'day' : range === 'month' ? 'week' : 'month'} in
            the window.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buckets} margin={{ top: 8, right: 12, left: -8, bottom: range === 'month' ? 48 : 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridLight} />
                <XAxis
                  dataKey="label"
                  stroke={chartMuted}
                  tick={{ fill: chartMuted, fontSize: 10 }}
                  interval={0}
                  angle={range === 'month' ? -18 : 0}
                  textAnchor={range === 'month' ? 'end' : 'middle'}
                  height={range === 'month' ? 56 : 32}
                />
                <YAxis stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<StackedMoodTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: legendColor }} />
                <Bar dataKey="happy" name="Happy" stackId="m" fill={MOOD_COLORS.happy} />
                <Bar dataKey="neutral" name="Neutral" stackId="m" fill={MOOD_COLORS.neutral} />
                <Bar dataKey="sad" name="Sad" stackId="m" fill={MOOD_COLORS.sad} />
                <Bar dataKey="anxious" name="Anxious" stackId="m" fill={MOOD_COLORS.anxious} />
                <Bar dataKey="angry" name="Angry" stackId="m" fill={MOOD_COLORS.angry} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average tone</CardTitle>
          <CardDescription>
            Mean of AI sentiment (or estimated mood score) per bucket. Range about −10 to +10.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={buckets} margin={{ top: 8, right: 12, left: -8, bottom: range === 'month' ? 48 : 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridLight} />
                <XAxis
                  dataKey="label"
                  stroke={chartMuted}
                  tick={{ fill: chartMuted, fontSize: 10 }}
                  interval={0}
                  angle={range === 'month' ? -18 : 0}
                  textAnchor={range === 'month' ? 'end' : 'middle'}
                  height={range === 'month' ? 56 : 32}
                />
                <YAxis stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 11 }} domain={[-10, 10]} />
                <Tooltip
                  formatter={(v) => (v == null ? '—' : v)}
                  labelFormatter={(l) => l}
                  contentStyle={{ borderRadius: '12px', border: `1px solid ${gridLight}` }}
                />
                <Line
                  type="monotone"
                  dataKey="avgSentiment"
                  name="Avg tone"
                  stroke="#b8722e"
                  strokeWidth={2}
                  connectNulls
                  dot={{ r: 4, fill: '#b8722e' }}
                  activeDot={{ r: 7, fill: '#c9971f' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const InsightsDashboard = ({ entries, user }) => {
  const [range, setRange] = useState('week');
  const { muted: chartMuted, grid: gridLight, legend: legendColor } = getChartPalette();

  const scopedEntries = useMemo(() => filterEntriesByRange(entries, range), [entries, range]);

  const moodDistribution = useMemo(() => {
    const counts = { happy: 0, sad: 0, angry: 0, anxious: 0, neutral: 0 };
    scopedEntries.forEach((entry) => {
      if (Object.prototype.hasOwnProperty.call(counts, entry.mood)) {
        counts[entry.mood]++;
      }
    });
    return Object.keys(counts).map((key) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      count: counts[key],
      fill: getMoodColor(key),
    }));
  }, [scopedEntries]);

  const sentimentPoints = useMemo(() => {
    return [...scopedEntries]
      .filter((e) => getCreatedAtDate(e))
      .map((entry) => ({
        date: (getCreatedAtDate(entry) || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: entry.sentimentScore != null && !Number.isNaN(Number(entry.sentimentScore)) ? Number(entry.sentimentScore) : null,
      }))
      .reverse();
  }, [scopedEntries]);

  if (entries.length === 0) {
    return (
      <EmptyState
        title="No data yet"
        description="Save a few journal entries—mood labels and dates fill the charts and weekly tools automatically."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PatternInsights entries={entries} user={user} />

      <WeeklySummary entries={entries} />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Mood analytics</CardTitle>
              <CardDescription className="mt-1">
                Switch the window to see week-by-day, rolling weeks, or year-by-month patterns.
              </CardDescription>
            </div>
            <Tabs value={range} onValueChange={setRange}>
              <TabsList aria-label="Chart time range">
                {RANGE_TABS.map((t) => (
                  <TabsTrigger key={t.id} value={t.id}>
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <MoodTrendSection entries={entries} range={range} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mood distribution</CardTitle>
            <CardDescription>
              Counts in the selected range ({scopedEntries.length} entries).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={moodDistribution} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridLight} />
                <XAxis dataKey="name" stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 12 }} />
                <YAxis stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(184, 114, 46, 0.1)' }} />
                <Bar dataKey="count" name="Entries" radius={[6, 6, 0, 0]}>
                  {moodDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sentiment per entry</CardTitle>
            <CardDescription>
              Each point is one entry in the range (chronological). Missing scores are skipped.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sentimentPoints.filter((p) => p.score != null).length === 0 ? (
              <p className="py-12 text-center text-emote-muted text-muted-foreground">No scored entries in this range yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sentimentPoints.filter((p) => p.score != null)} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridLight} />
                  <XAxis dataKey="date" stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 12 }} domain={[-10, 10]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(184, 114, 46, 0.08)' }} />
                  <Legend wrapperStyle={{ color: legendColor, fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Sentiment"
                    stroke="#b8722e"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#b8722e' }}
                    activeDot={{ r: 6, fill: '#c9971f' }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ActivityMoodChart entries={scopedEntries} />
        <ThemeBreakdown entries={scopedEntries} />
      </div>
    </div>
  );
};

export default InsightsDashboard;
