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
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
```

**Important**

- Use your **real** project ref from the Supabase dashboard (not the literal text `YOUR_PROJECT_REF`). A bad URL causes `ERR_NAME_NOT_RESOLVED` / “Failed to fetch”.
- Variable names **must** be prefixed with `REACT_APP_` for Create React App **unless** you use the supported aliases: `SUPABASE_URL` → `REACT_APP_SUPABASE_URL`, `SUPABASE_ANON_KEY` → `REACT_APP_SUPABASE_ANON_KEY`, `GEMINI_API_KEY` → `REACT_APP_GEMINI_API_KEY` (the start script maps these for you).

- **Supabase URL and anon key:** Supabase dashboard → **Project Settings** → **API** (URL looks like `https://<ref>.supabase.co`).
- **Gemini key:** [Google AI Studio](https://aistudio.google.com/app/apikey).

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
