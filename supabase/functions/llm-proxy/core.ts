// Core logic for the `llm-proxy` Edge Function, kept free of Deno-only APIs so it
// can be unit-tested under Node (see core.test.ts) as well as run on Supabase.
//
// The browser sends the same Gemini-style request it always did:
//   { payload: { contents: [{ role, parts: [{ text }] }], generationConfig?: { responseMimeType?, temperature? } } }
// and always gets a Gemini-style response back, whichever provider answered:
//   { candidates: [{ content: { role: "model", parts: [{ text }] } }], provider: "groq" | "gemini" }
//
// Providers are tried in order (LLM_PROVIDERS, default "groq,gemini"), skipping any
// whose API key isn't set. On a rate limit, server error, timeout, network error, an
// empty reply, or (when JSON was requested) a reply that isn't valid JSON, the next
// provider is tried. API keys only ever come from the function's environment.

export type Env = Record<string, string | undefined>;
type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

interface Part { text: string }
interface Content { role?: string; parts: Part[] }
export interface Payload {
  contents: Content[];
  generationConfig?: { responseMimeType?: string; temperature?: number };
}
type ProviderName = "groq" | "gemini";
interface Attempt { provider: ProviderName; status: number | null; reason: string; model?: string }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_CHARS = 60_000; // total prompt size accepted
const DEFAULT_TIMEOUT_MS = 25_000; // per provider
const MAX_OUTPUT_TOKENS = 2048;

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json", ...extra } });

/** Returns a cleaned copy of the payload, or an error message. Only known fields are forwarded. */
export function validatePayload(raw: unknown): { payload: Payload } | { error: string; status: number } {
  const p = raw as Payload | null;
  if (!p || typeof p !== "object" || !Array.isArray(p.contents) || p.contents.length === 0) {
    return { error: 'Missing "payload.contents".', status: 400 };
  }
  let chars = 0;
  const contents: Content[] = [];
  for (const c of p.contents) {
    if (!c || !Array.isArray(c.parts) || c.parts.length === 0 || c.parts.some((x) => typeof x?.text !== "string")) {
      return { error: "Each content needs parts with text.", status: 400 };
    }
    chars += c.parts.reduce((n, x) => n + x.text.length, 0);
    contents.push({ role: c.role === "model" ? "model" : "user", parts: c.parts.map((x) => ({ text: x.text })) });
  }
  if (chars > MAX_CHARS) return { error: "Prompt too large.", status: 413 };

  const gc = p.generationConfig ?? {};
  const generationConfig: NonNullable<Payload["generationConfig"]> = {};
  if (gc.responseMimeType === "application/json") generationConfig.responseMimeType = "application/json";
  if (typeof gc.temperature === "number" && gc.temperature >= 0 && gc.temperature <= 2) generationConfig.temperature = gc.temperature;
  return { payload: { contents, generationConfig } };
}

const wantsJson = (p: Payload) => p.generationConfig?.responseMimeType === "application/json";

function looksLikeJson(text: string): boolean {
  try { JSON.parse(text); return true; } catch { return false; }
}

class ProviderError extends Error {
  reason: string;
  status: number | null;
  model?: string;
  constructor(reason: string, status: number | null = null, model?: string) {
    super(reason);
    this.reason = reason;
    this.status = status;
    this.model = model;
  }
}

// A momentary "overloaded" (503) or other 5xx is common on free tiers and usually clears in a
// moment, so each model gets one quick retry before we move on. Rate limits (429) and client
// errors are not retried: waiting won't fix them.
const TRANSIENT = new Set([500, 502, 503, 504]);
const intEnvMs = (v: string | undefined, fallback: number) => (Number.isFinite(Number(v)) && Number(v) >= 0 && v !== undefined && v !== "" ? Number(v) : fallback);

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { clearTimeout(t); resolve(); }, { once: true });
  });

async function withRetry<T>(fn: () => Promise<T>, env: Env, signal: AbortSignal): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ProviderError && e.status !== null && TRANSIENT.has(e.status) && !signal.aborted) {
      await sleep(intEnvMs(env.LLM_RETRY_DELAY_MS, 400), signal);
      if (!signal.aborted) return await fn();
    }
    throw e;
  }
}

// Each model also gets its own time budget (LLM_MODEL_TIMEOUT_MS, default 12 s) inside the
// provider's overall one, so a model that hangs can't use up the whole allowance and leave the
// next model (or provider) no time to answer.
async function attemptModel<T>(parent: AbortSignal, env: Env, model: string, run: (s: AbortSignal) => Promise<T>): Promise<T> {
  const own = new AbortController();
  const onParentAbort = () => own.abort();
  parent.addEventListener("abort", onParentAbort, { once: true });
  const timer = setTimeout(() => own.abort(), intEnvMs(env.LLM_MODEL_TIMEOUT_MS, 12_000) || 12_000);
  try {
    return await run(own.signal);
  } catch (e) {
    if (own.signal.aborted && !parent.aborted) throw new ProviderError("timeout", null, model);
    throw e;
  } finally {
    clearTimeout(timer);
    parent.removeEventListener("abort", onParentAbort);
  }
}

// Groq retires models (llama-3.3-70b-versatile was retired 2026-08-16), so GROQ_MODEL may be a
// comma-separated list tried in order: a retired or rate-limited model falls through to the
// next one before we give up on Groq and move to Gemini. Rate limits are per model.
const DEFAULT_GROQ_MODELS = "openai/gpt-oss-120b,llama-3.1-8b-instant";

async function callGroq(payload: Payload, env: Env, fetchImpl: FetchLike, signal: AbortSignal): Promise<string> {
  const models = (env.GROQ_MODEL ?? DEFAULT_GROQ_MODELS).split(",").map((m) => m.trim()).filter(Boolean);
  let last = new ProviderError("no-model");
  for (const model of models) {
    try {
      return await attemptModel(signal, env, model, (s) => withRetry(() => callGroqModel(model, payload, env, fetchImpl, s), env, s));
    } catch (e) {
      // A bad key (401/403), a timeout, or a network failure will not be fixed by another model.
      if (!(e instanceof ProviderError) || e.status === 401 || e.status === 403 || signal.aborted) throw e;
      last = e;
    }
  }
  throw last;
}

async function callGroqModel(model: string, payload: Payload, env: Env, fetchImpl: FetchLike, signal: AbortSignal): Promise<string> {
  const base = env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
  const body: Record<string, unknown> = {
    model,
    messages: payload.contents.map((c) => ({
      role: c.role === "model" ? "assistant" : "user",
      content: c.parts.map((x) => x.text).join("\n"),
    })),
    max_tokens: MAX_OUTPUT_TOKENS,
  };
  if (payload.generationConfig?.temperature !== undefined) body.temperature = payload.generationConfig.temperature;
  if (wantsJson(payload)) body.response_format = { type: "json_object" };
  // gpt-oss models "think" first and the thinking counts toward max_tokens; keep it short.
  if (model.includes("gpt-oss")) body.reasoning_effort = "low";

  const res = await fetchImpl(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.GROQ_API_KEY}` },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new ProviderError("http", res.status, model);
  const data = await res.json().catch(() => null);
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new ProviderError("empty", res.status, model);
  return text;
}

// Like Groq, GEMINI_MODEL may be a comma-separated list tried in order; a model that is overloaded
// or retired falls through to the next. "-latest" is Google's own alias for the current flash model.
const DEFAULT_GEMINI_MODELS = "gemini-3.6-flash,gemini-flash-latest";

async function callGemini(payload: Payload, env: Env, fetchImpl: FetchLike, signal: AbortSignal): Promise<string> {
  const models = (env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODELS).split(",").map((m) => m.trim()).filter(Boolean);
  let last = new ProviderError("no-model");
  for (const model of models) {
    try {
      return await attemptModel(signal, env, model, (s) => withRetry(() => callGeminiModel(model, payload, env, fetchImpl, s), env, s));
    } catch (e) {
      if (!(e instanceof ProviderError) || e.status === 401 || e.status === 403 || signal.aborted) throw e;
      last = e;
    }
  }
  throw last;
}

async function callGeminiModel(model: string, payload: Payload, env: Env, fetchImpl: FetchLike, signal: AbortSignal): Promise<string> {
  const base = env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta";
  const res = await fetchImpl(`${base}/models/${model}:generateContent`, {
    method: "POST",
    // The key goes in a header, not the URL, so it can't end up in request logs.
    headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY ?? "" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) throw new ProviderError("http", res.status, model);
  const data = await res.json().catch(() => null);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) throw new ProviderError("empty", res.status, model);
  return text;
}

const PROVIDERS: Record<ProviderName, { key: string; call: typeof callGroq }> = {
  groq: { key: "GROQ_API_KEY", call: callGroq },
  gemini: { key: "GEMINI_API_KEY", call: callGemini },
};

/** Providers to try, in order: LLM_PROVIDERS, restricted to those with a key set. */
export function providerOrder(env: Env, only?: string): ProviderName[] {
  const wanted = (only ? [only] : (env.LLM_PROVIDERS ?? "groq,gemini").split(","))
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is ProviderName => s in PROVIDERS);
  return [...new Set(wanted)].filter((n) => Boolean(env[PROVIDERS[n].key]));
}

/**
 * The caller's user id, read from the JWT's `sub`. The signature is NOT checked here:
 * Supabase's gateway already verified it before this function ran, which is why the
 * function must be deployed with JWT verification ON (the default; never --no-verify-jwt).
 */
export function userIdFromAuth(req: Request): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(req.headers.get("Authorization") ?? "");
  const parts = m?.[1].split(".");
  if (!parts || parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const sub = JSON.parse(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4))).sub;
    return typeof sub === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sub) ? sub : null;
  } catch {
    return null;
  }
}

const intEnv = (v: string | undefined, fallback: number) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.floor(Number(v)) : fallback);

/**
 * Per-user limit, counted in Postgres (public.llm_rate_limit) so it holds across function
 * instances. Returns seconds to wait if the user is over their limit, else 0. It FAILS OPEN:
 * if the counter can't be reached the request goes through, because a rate-limit outage
 * shouldn't take the whole feature down.
 */
async function secondsOverLimit(req: Request, env: Env, fetchImpl: FetchLike): Promise<number> {
  if ((env.LLM_RATE_LIMIT ?? "on").toLowerCase() === "off") return 0;
  const user = userIdFromAuth(req);
  const base = env.SUPABASE_URL?.replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!user || !base || !key) return 0;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetchImpl(`${base}/rest/v1/rpc/llm_rate_limit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({ p_user: user, p_per_min: intEnv(env.LLM_RATE_PER_MIN, 10), p_per_day: intEnv(env.LLM_RATE_PER_DAY, 300) }),
      signal: controller.signal,
    });
    if (!res.ok) return 0;
    const data = await res.json().catch(() => null);
    return data && data.allowed === false ? Math.max(1, Number(data.retry_after) || 60) : 0;
  } catch {
    return 0;
  } finally {
    clearTimeout(timer);
  }
}

export async function handle(req: Request, env: Env, fetchImpl: FetchLike = fetch as FetchLike): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  let body: { payload?: unknown; provider?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }
  const checked = validatePayload(body?.payload);
  if ("error" in checked) return json({ error: checked.error }, checked.status);
  const { payload } = checked;

  const forced = typeof body.provider === "string" ? body.provider : undefined;
  const order = providerOrder(env, forced);
  if (order.length === 0) {
    return json({ error: forced ? `Provider "${forced}" is not configured.` : "No LLM provider is configured." }, 500);
  }

  // After validation, so malformed requests don't use up anyone's quota.
  const wait = await secondsOverLimit(req, env, fetchImpl);
  if (wait > 0) {
    return json({ error: "Rate limit reached. Please try again shortly.", retry_after: wait }, 429, { "Retry-After": String(wait) });
  }

  const timeoutMs = Number(env.LLM_TIMEOUT_MS) > 0 ? Number(env.LLM_TIMEOUT_MS) : DEFAULT_TIMEOUT_MS;
  const attempts: Attempt[] = [];

  for (const name of order) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const text = await PROVIDERS[name].call(payload, env, fetchImpl, controller.signal);
      if (wantsJson(payload) && !looksLikeJson(text)) throw new ProviderError("invalid-json");
      return json(
        { candidates: [{ content: { role: "model", parts: [{ text }] } }], provider: name },
        200,
        { "x-llm-provider": name },
      );
    } catch (e) {
      const aborted = controller.signal.aborted;
      attempts.push({
        provider: name,
        status: e instanceof ProviderError ? e.status : null,
        reason: aborted ? "timeout" : e instanceof ProviderError ? e.reason : "network",
        ...(e instanceof ProviderError && e.model ? { model: e.model } : {}),
      });
    } finally {
      clearTimeout(timer);
    }
  }
  // Statuses and reasons only: never upstream bodies or anything containing a key.
  return json({ error: "All LLM providers failed.", attempts }, 502);
}
