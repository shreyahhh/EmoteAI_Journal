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
  if (!process.env.REACT_APP_GEMINI_API_KEY && process.env.GEMINI_API_KEY) {
    process.env.REACT_APP_GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  }
}

module.exports = { appRoot, load };
