// Supabase Edge Function: llm-proxy
//
// Relays AI requests for the frontend (themes, summaries, chat, resources, and the
// Gemini fallback for entry analysis) to Groq first, then Gemini, so no API key ever
// reaches the browser and one provider being rate-limited or down doesn't break the app.
// The logic lives in core.ts so it can be unit-tested; see core.test.ts.
//
// Deploy:
//   supabase functions deploy llm-proxy
//   supabase secrets set GROQ_API_KEY=... GEMINI_API_KEY=...
// Optional secrets: LLM_PROVIDERS (default "groq,gemini"), GROQ_MODEL, GEMINI_MODEL,
// LLM_TIMEOUT_MS, LLM_RATE_PER_MIN (default 10) and LLM_RATE_PER_DAY (default 300) per user,
// LLM_RATE_LIMIT=off. The limit needs the llm_rate_limit migration; without it, requests are not limited.
//
// By default Supabase verifies the caller's JWT before invoking this function, so only
// signed-in app users can reach it.
import { handle } from "./core.ts";

Deno.serve((req) => handle(req, Deno.env.toObject()));
