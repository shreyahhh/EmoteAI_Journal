/**
 * Load env before react-scripts so CRA sees REACT_APP_* vars.
 * Order (last wins): repo root .env → frontend-new/.env → frontend-new/.env.local
 */
const path = require('path');

const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(__dirname, '../..');

function load() {
  const dotenv = require('dotenv');
  dotenv.config({ path: path.join(repoRoot, '.env'), override: true });
  dotenv.config({ path: path.join(appRoot, '.env'), override: true });
  dotenv.config({ path: path.join(appRoot, '.env.local'), override: true });

  if (!process.env.REACT_APP_SUPABASE_URL && process.env.SUPABASE_URL) {
    process.env.REACT_APP_SUPABASE_URL = process.env.SUPABASE_URL;
  }
  if (!process.env.REACT_APP_SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY) {
    process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  }
  // AI provider keys must never reach the browser. Create React App bakes EVERY
  // REACT_APP_* variable into the public JS bundle (a library reads process.env as a
  // whole), even ones no source file uses. Gemini and Groq are called server-side by
  // the llm-proxy Edge Function, whose keys live in Supabase secrets. Blank them here
  // (not delete: CRA re-reads .env.local itself and only skips variables that exist).
  for (const name of ['REACT_APP_GEMINI_API_KEY', 'REACT_APP_GROQ_API_KEY']) {
    if (process.env[name]) {
      console.warn(
        `[Emote] Ignoring ${name}: it would be published inside the website's JavaScript. ` +
          `Remove it from your .env files and set the key as a Supabase secret instead (see README, "AI providers").`,
      );
    }
    process.env[name] = '';
  }
}

module.exports = { appRoot, load };
