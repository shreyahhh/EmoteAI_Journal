# Emote — An AI-Powered Journaling and Emotional Wellness Companion

Emote is a modern, AI-driven journaling application designed to be your personal companion for emotional wellness. It provides a private space to articulate your thoughts and feelings, track moods and themes, set personal goals, and gain insights into your emotional patterns. Google’s Gemini API powers entry analysis, weekly summaries, chat over your journal, and resource guidance.

## Features

- **Authentication:** Email sign-up and sign-in via [Supabase Auth](https://supabase.com/docs/guides/auth).
- **Daily journaling:** Write entries with optional titles and activity tags; each save is analyzed for sentiment, emotions, themes, and mood.
- **Entry history:** Database triggers record create, update, and delete snapshots; you can open **History** on a journal card to review past versions.
- **AI-powered chat:** Ask questions about recent entries; answers are grounded in your journal text (Gemini).
- **Mood and sentiment:** Mood labels and sentiment scores feed the insights charts and timeline.
- **Goal setting:** Create and track wellness goals (UI; goals are not yet persisted to the database).
- **Insights dashboard:** Mood distribution, sentiment over time, activity correlations, and an optional weekly AI summary.
- **Timeline:** Chronological view of entries by month.
- **Curated resources:** Theme-based resources and AI-assisted detail views.
- **Settings:** Reminders, notifications, and export (JSON, TXT, CSV).

## Tech Stack

- **Frontend:** [React](https://reactjs.org/) (Create React App), [Tailwind CSS](https://tailwindcss.com/)
- **Backend & data:** [Supabase](https://supabase.com/) — PostgreSQL, Row Level Security, Realtime subscriptions for journal updates
- **AI:** [Google Gemini API](https://ai.google.dev/)
- **Charts:** [Recharts](https://recharts.org/)

The active app lives in the **`frontend-new`** directory.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended) and npm
- A [Supabase](https://supabase.com/) project
- A [Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone and enter the app folder

```sh
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Create the database schema

In the Supabase dashboard, open **SQL** → **New query**, paste the contents of:

`frontend-new/supabase_schema.sql`

Run the script once. It creates tables (`profiles`, `journal_entries`, `journal_entry_history`), RLS policies, history triggers, and adds the journal tables to the `supabase_realtime` publication.

If a line errors because a table is already in the realtime publication, you can skip that `alter publication` line.

Under **Authentication** → **Providers**, enable **Email** (and adjust email confirmation if you want instant login in development).

### 3. Install dependencies

Install packages for the React app:

```sh
cd frontend-new
npm install
cd ..
```

(Stay in the repo root if you use `npm start` / `npm run dev` from there.)

### 4. Environment variables

The dev server loads env in this order (later files override earlier ones): **repo root `.env`** → **`frontend-new/.env`** → **`frontend-new/.env.local`**.

Create **`frontend-new/.env.local`** (recommended, gitignored) **or** put the same variables in the **repo root `.env`**. See **`frontend-new/.env.example`** for a template.

```env
REACT_APP_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_public_key
# Optional: the trained emotion + sarcasm model (see ml/README.md). Unset = Gemini analyses entries.
REACT_APP_EMOTE_API_URL=http://localhost:8000
```

**Important**

- Use your **real** project ref from the Supabase dashboard (not the literal text `YOUR_PROJECT_REF`). A bad URL causes `ERR_NAME_NOT_RESOLVED` / “Failed to fetch”.
- Variable names **must** be prefixed with `REACT_APP_` for Create React App **unless** you use the supported aliases: `SUPABASE_URL` → `REACT_APP_SUPABASE_URL`, `SUPABASE_ANON_KEY` → `REACT_APP_SUPABASE_ANON_KEY` (the start script maps these for you).
- **Never put an AI key (Gemini, Groq) in these files.** Anything starting with `REACT_APP_` is published inside the website's JavaScript for anyone to read. AI keys are Supabase secrets; see *AI providers* below. The start/build scripts blank `REACT_APP_GEMINI_API_KEY` and `REACT_APP_GROQ_API_KEY` if they find them.

- **Supabase URL and anon key:** Supabase dashboard → **Project Settings** → **API** (URL looks like `https://<ref>.supabase.co`).
- **AI keys (Groq, Gemini):** not here. See *AI providers* below.
- **Emotion model URL (optional):** where `ml/server.py` is running (`uvicorn server:app --port 8000` from `ml/`, after training; see `ml/README.md`). When set, entries are analysed line by line by the trained model, with Gemini used only for themes and as a fallback if the model service is down. Also run the `20261007000001_sarcasm_check.sql` migration for the "did you mean that sarcastically?" feature; the app still saves and analyses entries if you haven't yet.

### AI providers: Groq first, Gemini as backup

Themes, weekly summaries, chat and resources go through the **`llm-proxy`** Supabase Edge Function
(`supabase/functions/llm-proxy/`). It tries **Groq** first and falls back to **Gemini** on a rate limit,
outage, timeout or malformed JSON, so neither provider being down breaks the app. API keys live only in
Supabase secrets and never reach the browser. The browser keeps sending and receiving Gemini-shaped
messages whichever provider answers.

1. Create free keys: **Groq** at [console.groq.com](https://console.groq.com) and **Gemini** at
   [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Store them as secrets (never in chat, git or `.env.local`) and deploy:

```bash
supabase secrets set GROQ_API_KEY=your_groq_key GEMINI_API_KEY=your_gemini_key
supabase functions deploy llm-proxy
```

3. Optional secrets: `LLM_PROVIDERS` (default `groq,gemini`; use `gemini,groq` to swap the order),
   `GROQ_MODEL` (default `openai/gpt-oss-120b,llama-3.1-8b-instant`; a comma-separated list, tried in order), `GEMINI_MODEL` (default `gemini-3.6-flash,gemini-flash-latest`, also a list), `LLM_TIMEOUT_MS` (default 25000 per provider) and `LLM_MODEL_TIMEOUT_MS` (default 12000 per model, so one hung model can't use up the whole allowance).
   Each model gets one quick retry on a momentary 5xx; Groq and Gemini model lists are tried in order.
   **Per-user rate limit:** `LLM_RATE_PER_MIN` (default 10) and `LLM_RATE_PER_DAY` (default 300) per signed-in user, so one account can't use up the free quota. It needs the `20261008000001_llm_rate_limit.sql` migration; without it requests simply aren't limited. `LLM_RATE_LIMIT=off` disables it.
   Groq retires models (`llama-3.3-70b-versatile` was retired in August 2026), so if Groq starts returning 404, check its [deprecations page](https://console.groq.com/docs/deprecations) and update `GROQ_MODEL`.
4. Check each provider on its own (a signed-in user's token is needed; `provider` forces one with no fallback):

```bash
curl -s "$SUPABASE_URL/functions/v1/llm-proxy" -H "Authorization: Bearer $USER_ACCESS_TOKEN" -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"provider":"groq","payload":{"contents":[{"parts":[{"text":"Say hi"}]}]}}'
```

Until `llm-proxy` is deployed the app keeps using the older `gemini-proxy`. Proxy tests (no keys or
network needed): `node --test supabase/functions/llm-proxy/core.test.ts supabase/functions/llm-proxy/core.http.test.ts`
(Node 22.18+).

Privacy: with either provider, the text of entries used for summaries, chat and themes is sent to that
provider. Period/cycle data is never included; the cycle model runs only in the browser.

Restart **`npm start`** / **`npm run dev`** after changing env vars (the shell must restart so variables are injected).

If the browser console shows `runtime.lastError: The message port closed…`, that usually comes from a **browser extension**, not from this app.

### 5. Run the development server

From the **repository root** (after `frontend-new` dependencies are installed):

```sh
npm start
```

or:

```sh
npm run dev
```

Or from **`frontend-new`**:

```sh
npm start
```

The app opens at [http://localhost:3000](http://localhost:3000).

### 6. Production build (optional)

From the repo root:

```sh
npm run build
```

Or from **`frontend-new`:** `npm run build`.

Serve **`frontend-new/build`** with any static host, or locally:

```sh
cd frontend-new
npx serve -s build -l 3000
```

## Key Screens

- **Journal:** New entries, list of cards, AI tags, **History** per entry, delete.
- **Insights:** Charts, weekly summary, activity–mood view.
- **Timeline:** Monthly grouping and full-entry modal.
- **Goals:** Suggestions and local goal tracking.
- **Chat:** Questions about your last 30 days of entries.
- **Resources:** Recommendations by theme.
- **Settings:** Reminders and data export.

## Ethical Considerations

- This app is not a diagnostic tool.
- It provides crisis support links and encourages seeking professional help when needed.
- User privacy and data security depend on your Supabase project configuration and RLS; review policies before production use.

---
