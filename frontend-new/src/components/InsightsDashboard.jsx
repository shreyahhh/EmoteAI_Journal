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
import { getCreatedAtDate } from '../lib/entryDates';

const panelClass = 'emote-panel';

async function getWeeklySummaryWithAI(entriesText) {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const prompt = `
        As a compassionate psychologist, you are reviewing a client's journal entries from the past week.
        Please provide a gentle and insightful summary based on the text provided.
        Provide your response in a structured JSON format. Do not include any text outside of the JSON object.
        The JSON object should have the following keys:
        - "overallFeeling": A short paragraph (2-3 sentences) summarizing the overall emotional tone of the week.
        - "keyThemes": An array of 2-4 strings identifying the most prominent themes or topics.
        - "positiveMoment": A short paragraph highlighting a specific positive moment or feeling mentioned in the entries. If no clear positive moment exists, create a gentle encouragement.
        - "gentleSuggestion": A single, forward-looking, and encouraging suggestion for the week ahead.
        Journal Entries Text:
        ---
        ${entriesText}
        ---
    `;
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  };
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const result = await response.json();
    if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
      return JSON.parse(result.candidates[0].content.parts[0].text);
    }
    return { overallFeeling: 'Could not generate a summary at this time.', keyThemes: [], positiveMoment: '', gentleSuggestion: 'Try to be kind to yourself this week.' };
  } catch (error) {
    console.error('AI Summary Generation Error:', error);
    return { overallFeeling: 'An error occurred while analyzing your week.', keyThemes: [], positiveMoment: '', gentleSuggestion: 'Try to be kind to yourself this week.' };
  }
}

const WeeklySummary = ({ entries }) => {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError('');
    setSummary(null);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentEntries = entries.filter((entry) => {
      const d = getCreatedAtDate(entry);
      return d && d > oneWeekAgo;
    });
    if (recentEntries.length < 3) {
      setError('You need at least 3 entries in the last 7 days to generate a summary.');
      setIsLoading(false);
      return;
    }
    const entriesText = recentEntries
      .map((e) => {
        const d = getCreatedAtDate(e);
        return `Entry on ${d ? d.toLocaleDateString() : '?'}:\nTitle: ${e.title}\nContent: ${e.content}`;
      })
      .join('\n\n---\n\n');
    const generatedSummary = await getWeeklySummaryWithAI(entriesText);
    setSummary(generatedSummary);
    setIsLoading(false);
  };
  return (
    <div className={panelClass}>
      <h3 className="emote-title-gradient text-emote-section">Weekly summary</h3>
      <p className="mb-4 mt-1.5 text-emote-muted leading-relaxed text-slate-500">
        Uses entries from the last seven days (you need at least three). Good for a gentle recap of tone and themes.
      </p>
      <button
        type="button"
        onClick={handleGenerateSummary}
        disabled={isLoading}
        className="emote-btn-primary w-full disabled:cursor-not-allowed sm:w-auto"
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
      </button>
      {error && <p className="mt-4 text-center text-emote-muted font-medium text-rose-600">{error}</p>}
      {summary && (
        <div className="mt-6 space-y-6 border-t border-slate-100 pt-6 animate-fade-in">
          <div>
            <h4 className="mb-2 text-emote-caption font-semibold uppercase tracking-wide text-sky-600">Overall feeling</h4>
            <p className="text-emote-body leading-relaxed text-slate-600">{summary.overallFeeling}</p>
          </div>
          <div>
            <h4 className="mb-2 text-emote-caption font-semibold uppercase tracking-wide text-sky-600">Key themes</h4>
            <div className="flex flex-wrap gap-2">
              {summary.keyThemes?.map((theme, index) => (
                <span key={index} className="rounded-lg bg-teal-50 px-3 py-1 text-emote-muted font-medium text-teal-900 ring-1 ring-teal-200">
                  {theme}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-emote-caption font-semibold uppercase tracking-wide text-sky-600">A positive moment</h4>
            <p className="text-emote-body italic leading-relaxed text-slate-500">&ldquo;{summary.positiveMoment}&rdquo;</p>
          </div>
          <div>
            <h4 className="mb-2 text-emote-caption font-semibold uppercase tracking-wide text-sky-600">Suggestion</h4>
            <p className="text-emote-body leading-relaxed text-slate-600">{summary.gentleSuggestion}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const getMoodColor = (mood) => {
  const colors = { happy: '#34d399', sad: '#38bdf8', angry: '#fb7185', anxious: '#fbbf24', neutral: '#94a3b8' };
  return colors[mood] || '#94a3b8';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-emote">
        <p className="text-emote-card-title font-semibold text-slate-900">{`${label}`}</p>
        <p className="text-emote-muted font-medium text-teal-600">{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const chartMuted = '#64748b';
const gridLight = '#e2e8f0';

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
    const activityNames = {
      exercise: 'Exercise',
      work: 'Work',
      social: 'Socialized',
      hobby: 'Hobby',
      rest: 'Rested',
      family: 'Family Time',
      chores: 'Chores',
      nature: 'Nature',
    };
    return Object.entries(activityMoods)
      .map(([activityId, count]) => ({
        name: activityNames[activityId] || activityId,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [entries]);

  if (chartData.length === 0) {
    return (
      <div className={panelClass}>
        <h3 className="mb-2 text-emote-card-title font-semibold text-slate-900">Activities & mood</h3>
        <p className="text-emote-muted text-slate-500">Tag activities on entries with positive mood.</p>
      </div>
    );
  }
  return (
    <div className={panelClass}>
      <h3 className="text-emote-card-title font-semibold text-slate-900">Activities & mood</h3>
      <p className="mb-4 mt-1.5 text-emote-muted leading-relaxed text-slate-500">
        Based on entries labeled happy—see which tagged activities showed up most often.
      </p>
      <div className="space-y-3">
        {chartData.map((item) => {
          const barWidth = `${(item.count / Math.max(...chartData.map((d) => d.count))) * 100}%`;
          return (
            <div key={item.name} className="flex items-center gap-4 text-emote-muted">
              <span className="w-28 text-right font-medium text-slate-600">{item.name}</span>
              <div className="h-7 flex-1 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80">
                <div
                  className="flex h-full items-center justify-end rounded-full bg-gradient-to-r from-rose-500 via-orange-400 to-teal-500 px-2 transition-all duration-500"
                  style={{ width: barWidth }}
                >
                  <span className="text-emote-caption font-bold text-white">{item.count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const InsightsDashboard = ({ entries }) => {
  const moodDistribution = useMemo(() => {
    const counts = { happy: 0, sad: 0, angry: 0, anxious: 0, neutral: 0 };
    entries.forEach((entry) => {
      if (Object.prototype.hasOwnProperty.call(counts, entry.mood)) {
        counts[entry.mood]++;
      }
    });
    return Object.keys(counts).map((key) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      count: counts[key],
      fill: getMoodColor(key),
    }));
  }, [entries]);

  const sentimentOverTime = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return entries
      .filter((entry) => {
        const d = getCreatedAtDate(entry);
        return d && d > thirtyDaysAgo;
      })
      .map((entry) => ({
        date: (getCreatedAtDate(entry) || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: entry.sentimentScore,
      }))
      .reverse();
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className={`${panelClass} text-center`}>
        <h3 className="text-emote-card-title font-semibold text-slate-900">No data yet</h3>
        <p className="mt-2 text-emote-muted leading-relaxed text-slate-500">
          Save a few journal entries—mood labels and dates fill the charts and weekly tools automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <WeeklySummary entries={entries} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className={panelClass}>
          <h3 className="text-emote-card-title font-semibold text-slate-900">Mood distribution</h3>
          <p className="mb-4 mt-1.5 text-emote-muted leading-relaxed text-slate-500">How many entries fall into each mood the model picked when you saved.</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={moodDistribution} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridLight} />
              <XAxis dataKey="name" stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 12 }} />
              <YAxis stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 12 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14, 165, 233, 0.08)' }} />
              <Bar dataKey="count" name="Entries" radius={[6, 6, 0, 0]}>
                {moodDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={panelClass}>
          <h3 className="text-emote-card-title font-semibold text-slate-900">Sentiment (last 30 days)</h3>
          <p className="mb-4 mt-1.5 text-emote-muted leading-relaxed text-slate-500">Score per entry from roughly the past month—higher is more positive tone in the text.</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sentimentOverTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridLight} />
              <XAxis dataKey="date" stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 11 }} />
              <YAxis stroke={chartMuted} tick={{ fill: chartMuted, fontSize: 12 }} domain={[-10, 10]} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(244, 63, 94, 0.06)' }} />
              <Legend wrapperStyle={{ color: '#475569', fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="score"
                name="Sentiment"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ r: 4, fill: '#f97316' }}
                activeDot={{ r: 7, fill: '#fb923c' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ActivityMoodChart entries={entries} />
    </div>
  );
};

export default InsightsDashboard;
