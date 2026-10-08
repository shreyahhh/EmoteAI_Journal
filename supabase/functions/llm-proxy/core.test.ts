// Run with:  node --test supabase/functions/llm-proxy/core.test.ts   (Node 22.18+ / 24)
import { test } from "node:test";
import assert from "node:assert/strict";
import { handle, providerOrder, validatePayload } from "./core.ts";

const GROQ_KEY = "gsk_test_SECRET_groq";
const GEMINI_KEY = "AIza_test_SECRET_gemini";
const ENV = { GROQ_API_KEY: GROQ_KEY, GEMINI_API_KEY: GEMINI_KEY, LLM_RETRY_DELAY_MS: "1" };

const askJson = { contents: [{ role: "user", parts: [{ text: "Return JSON with a themes array." }] }], generationConfig: { responseMimeType: "application/json" } };
const askText = { contents: [{ role: "user", parts: [{ text: "Say hello." }] }] };

const groqOk = (text: string) => new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), { status: 200 });
const geminiOk = (text: string) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });
const status = (code: number) => new Response(JSON.stringify({ error: "upstream says SECRET-DETAIL" }), { status: code });

type Call = { url: string; headers: Record<string, string>; body: any };
/** Fake network: routes by URL, records every call. A handler may be a Response, or a function of (call, signal). */
function fakeNet(h: { groq?: any; gemini?: any; rpc?: any }) {
  const calls: Call[] = [];
  const fetchImpl = async (url: string, init: any) => {
    const which = url.includes("/chat/completions") ? "groq" : url.includes(":generateContent") ? "gemini" : url.includes("/rpc/llm_rate_limit") ? "rpc" : "other";
    calls.push({ url, headers: init.headers, body: JSON.parse(init.body) });
    const handler = h[which as "groq" | "gemini" | "rpc"];
    if (!handler) throw new Error("no handler for " + which);
    return typeof handler === "function" ? handler(init.signal) : handler.clone();
  };
  return { fetchImpl, calls, which: (n: string) => calls.filter((c) => (n === "groq" ? c.url.includes("/chat") : n === "rpc" ? c.url.includes("/rpc/") : c.url.includes("generateContent"))) };
}

const post = (body: unknown) => new Request("https://x/fn", { method: "POST", body: JSON.stringify(body) });
const run = async (body: unknown, env: Record<string, string>, net: ReturnType<typeof fakeNet>) => {
  const res = await handle(post(body), env, net.fetchImpl as any);
  return { res, data: await res.json() };
};

test("Groq answers first: Gemini-shaped response, translated request, key only in the auth header", async () => {
  const net = fakeNet({ groq: groqOk('{"themes":["Work"]}') });
  const { res, data } = await run({ payload: askJson }, ENV, net);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-llm-provider"), "groq");
  assert.equal(data.provider, "groq");
  assert.equal(data.candidates[0].content.parts[0].text, '{"themes":["Work"]}');
  assert.equal(net.calls.length, 1, "Gemini must not be called when Groq works");

  const c = net.calls[0];
  assert.equal(c.url, "https://api.groq.com/openai/v1/chat/completions");
  assert.equal(c.headers.Authorization, `Bearer ${GROQ_KEY}`);
  assert.ok(!c.url.includes(GROQ_KEY));
  assert.deepEqual(c.body.response_format, { type: "json_object" });
  assert.deepEqual(c.body.messages, [{ role: "user", content: "Return JSON with a themes array." }]);
  assert.equal(c.body.model, "openai/gpt-oss-120b");
  assert.equal(c.body.reasoning_effort, "low", "gpt-oss models are told to think briefly");
});

test("plain-text requests do not force JSON mode and may return non-JSON", async () => {
  const net = fakeNet({ groq: groqOk("Hello there!") });
  const { res, data } = await run({ payload: askText }, ENV, net);
  assert.equal(res.status, 200);
  assert.equal(data.candidates[0].content.parts[0].text, "Hello there!");
  assert.equal(net.calls[0].body.response_format, undefined);
});

test("model-role messages become assistant messages", async () => {
  const net = fakeNet({ groq: groqOk("ok") });
  await run({ payload: { contents: [{ role: "user", parts: [{ text: "a" }] }, { role: "model", parts: [{ text: "b" }, { text: "c" }] }] } }, ENV, net);
  assert.deepEqual(net.calls[0].body.messages, [{ role: "user", content: "a" }, { role: "assistant", content: "b\nc" }]);
});

for (const [name, groq] of [
  ["rate limited (429)", status(429)],
  ["server error (503)", status(503)],
  ["bad key (401)", status(401)],
  ["empty reply", groqOk("   ")],
  ["JSON requested but reply is not JSON", groqOk("Sure! Here are your themes: Work")],
  ["network failure", () => Promise.reject(new TypeError("fetch failed"))],
] as const) {
  test(`falls back to Gemini when Groq fails: ${name}`, async () => {
    const net = fakeNet({ groq, gemini: geminiOk('{"themes":["Pride"]}') });
    const { res, data } = await run({ payload: askJson }, ENV, net);
    assert.equal(res.status, 200);
    assert.equal(data.provider, "gemini");
    assert.equal(data.candidates[0].content.parts[0].text, '{"themes":["Pride"]}');
    const g = net.calls.find((c) => c.url.includes("generateContent"))!;
    assert.equal(g.headers["x-goog-api-key"], GEMINI_KEY);
    assert.ok(!g.url.includes(GEMINI_KEY), "Gemini key must not be in the URL");
    assert.deepEqual(g.body.generationConfig, { responseMimeType: "application/json" });
  });
}

test("a hung provider is cut off by the timeout and the next one is used", async () => {
  const hang = (signal: AbortSignal) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))));
  const net = fakeNet({ groq: hang, gemini: geminiOk("{}") });
  const t0 = Date.now();
  const { data } = await run({ payload: askJson }, { ...ENV, LLM_TIMEOUT_MS: "80" }, net);
  assert.equal(data.provider, "gemini");
  assert.ok(Date.now() - t0 < 2000);
});

test("all providers failing returns 502 with statuses only, never keys or upstream bodies", async () => {
  const net = fakeNet({ groq: status(429), gemini: status(500) });
  const { res, data } = await run({ payload: askJson }, ENV, net);
  assert.equal(res.status, 502);
  assert.deepEqual(data.attempts, [
    { provider: "groq", status: 429, reason: "http", model: "llama-3.1-8b-instant" }, // the last Groq model tried
    { provider: "gemini", status: 500, reason: "http", model: "gemini-flash-latest" },
  ]);
  const raw = JSON.stringify(data);
  for (const secret of [GROQ_KEY, GEMINI_KEY, "SECRET-DETAIL"]) assert.ok(!raw.includes(secret), `leaked ${secret}`);
});

test("only configured providers are used; none configured is a clear 500", async () => {
  const onlyGemini = fakeNet({ gemini: geminiOk("{}") });
  const a = await run({ payload: askJson }, { GEMINI_API_KEY: GEMINI_KEY }, onlyGemini);
  assert.equal(a.data.provider, "gemini");
  assert.equal(onlyGemini.which("groq").length, 0);

  const none = await run({ payload: askJson }, {}, fakeNet({}));
  assert.equal(none.res.status, 500);
  assert.match(none.data.error, /No LLM provider is configured/);
});

test("LLM_PROVIDERS controls the order, and ignores unknown names", async () => {
  assert.deepEqual(providerOrder(ENV), ["groq", "gemini"]);
  assert.deepEqual(providerOrder({ ...ENV, LLM_PROVIDERS: "gemini, groq" }), ["gemini", "groq"]);
  assert.deepEqual(providerOrder({ ...ENV, LLM_PROVIDERS: "openai,groq,groq" }), ["groq"]);
  const net = fakeNet({ groq: groqOk("{}"), gemini: geminiOk('{"from":"gemini"}') });
  const { data } = await run({ payload: askJson }, { ...ENV, LLM_PROVIDERS: "gemini,groq" }, net);
  assert.equal(data.provider, "gemini");
});

test("a forced provider is used alone, with no fallback", async () => {
  const net = fakeNet({ groq: status(500), gemini: geminiOk("{}") });
  const { res, data } = await run({ payload: askJson, provider: "groq" }, ENV, net);
  assert.equal(res.status, 502);
  assert.equal(data.attempts.length, 1);
  assert.equal(net.which("gemini").length, 0);
  const bad = await run({ payload: askJson, provider: "openai" }, ENV, fakeNet({}));
  assert.equal(bad.res.status, 500);
});

test("model names are configurable", async () => {
  const net = fakeNet({ groq: status(500), gemini: geminiOk("{}") });
  await run({ payload: askJson }, { ...ENV, GROQ_MODEL: "my-groq", GEMINI_MODEL: "my-gemini" }, net);
  assert.equal(net.which("groq")[0].body.model, "my-groq");
  assert.equal(net.which("groq")[0].body.reasoning_effort, undefined, "reasoning_effort only for gpt-oss models");
  assert.ok(net.which("gemini")[0].url.includes("/models/my-gemini:generateContent"));
});

test("a retired Groq model (404) falls through to the next Groq model, not straight to Gemini", async () => {
  const calls: string[] = [];
  const fetchImpl = async (url: string, init: any) => {
    const body = JSON.parse(init.body);
    calls.push(url.includes("/chat/completions") ? `groq:${body.model}` : "gemini");
    if (url.includes("/chat/completions")) return body.model === "openai/gpt-oss-120b" ? status(404) : groqOk('{"ok":1}');
    return geminiOk("{}");
  };
  const res = await handle(post({ payload: askJson }), ENV, fetchImpl as any);
  const data = await res.json();
  assert.equal(data.provider, "groq");
  assert.deepEqual(calls, ["groq:openai/gpt-oss-120b", "groq:llama-3.1-8b-instant"]);
});

test("GROQ_MODEL accepts a comma-separated list, tried in order", async () => {
  const net = fakeNet({ groq: status(429), gemini: geminiOk("{}") });
  await run({ payload: askJson }, { ...ENV, GROQ_MODEL: "model-a, model-b ,model-c" }, net);
  assert.deepEqual(net.which("groq").map((c) => c.body.model), ["model-a", "model-b", "model-c"]);
});

test("a bad Groq key (401) does not burn through every model; it goes straight to Gemini", async () => {
  const net = fakeNet({ groq: status(401), gemini: geminiOk("{}") });
  const { data } = await run({ payload: askJson }, ENV, net);
  assert.equal(data.provider, "gemini");
  assert.equal(net.which("groq").length, 1);
});

test("request validation", async () => {
  const net = fakeNet({ groq: groqOk("x") });
  assert.equal((await run({}, ENV, net)).res.status, 400);
  assert.equal((await run({ payload: { contents: [] } }, ENV, net)).res.status, 400);
  assert.equal((await run({ payload: { contents: [{ parts: [{ text: 5 }] }] } }, ENV, net)).res.status, 400);
  assert.equal((await run({ payload: { contents: [{ parts: [] }] } }, ENV, net)).res.status, 400);
  const big = { contents: [{ parts: [{ text: "x".repeat(60_001) }] }] };
  assert.equal((await run({ payload: big }, ENV, net)).res.status, 413);
  assert.equal(net.calls.length, 0, "invalid requests must not reach any provider");

  const notJson = await handle(new Request("https://x/fn", { method: "POST", body: "{nope" }), ENV, net.fetchImpl as any);
  assert.equal(notJson.status, 400);
  const get = await handle(new Request("https://x/fn", { method: "GET" }), ENV, net.fetchImpl as any);
  assert.equal(get.status, 405);
});

test("unknown payload fields are not forwarded", () => {
  const out = validatePayload({
    contents: [{ role: "system", parts: [{ text: "hi", inlineData: "BAD" }], extra: 1 }],
    generationConfig: { responseMimeType: "text/x-evil", temperature: 99, maxOutputTokens: 1e9, stopSequences: ["a"] },
    tools: [{ codeExecution: {} }],
    safetySettings: [],
  }) as any;
  assert.deepEqual(out.payload, { contents: [{ role: "user", parts: [{ text: "hi" }] }], generationConfig: {} });
});

test("CORS preflight", async () => {
  const res = await handle(new Request("https://x/fn", { method: "OPTIONS" }), ENV, fakeNet({}).fetchImpl as any);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});

// ---------------------------------------------------------------- per-user rate limit
const USER = "0f6c1e2a-7b3d-4c58-9a41-5d2e8b6f1a90";
const jwtFor = (sub: unknown) => {
  const b = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b({ alg: "ES256" })}.${b({ sub, role: "authenticated" })}.sig`;
};
const RL_ENV = { ...ENV, SUPABASE_URL: "https://proj.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-role-SECRET" };
const rpcAllow = () => new Response(JSON.stringify({ allowed: true, minute: 1, day: 1, retry_after: 0 }), { status: 200 });
const rpcDeny = (retry: number) => new Response(JSON.stringify({ allowed: false, minute: 11, day: 11, retry_after: retry }), { status: 200 });
const postAs = (jwt: string | null, body: unknown) =>
  new Request("https://x/fn", { method: "POST", body: JSON.stringify(body), headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} });

test("rate limit: over the limit -> 429 with Retry-After, and no provider is called", async () => {
  const net = fakeNet({ groq: groqOk("x"), gemini: geminiOk("x"), rpc: rpcDeny(42) });
  const res = await handle(postAs(jwtFor(USER), { payload: askJson }), RL_ENV, net.fetchImpl as any);
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("retry-after"), "42");
  assert.equal((await res.json()).retry_after, 42);
  assert.equal(net.which("groq").length + net.which("gemini").length, 0, "a limited user must not spend provider quota");
});

test("rate limit: counts the right user, with the service key and default limits, then serves", async () => {
  const net = fakeNet({ groq: groqOk('{"a":1}'), rpc: rpcAllow() });
  const res = await handle(postAs(jwtFor(USER), { payload: askJson }), RL_ENV, net.fetchImpl as any);
  assert.equal(res.status, 200);
  const rpc = net.which("rpc");
  assert.equal(rpc.length, 1);
  assert.equal(rpc[0].url, "https://proj.supabase.co/rest/v1/rpc/llm_rate_limit");
  assert.deepEqual(rpc[0].body, { p_user: USER, p_per_min: 10, p_per_day: 300 });
  assert.equal(rpc[0].headers.apikey, "service-role-SECRET");
  assert.equal(rpc[0].headers.Authorization, "Bearer service-role-SECRET");
});

test("rate limit: limits are configurable", async () => {
  const net = fakeNet({ groq: groqOk("{}"), rpc: rpcAllow() });
  await handle(postAs(jwtFor(USER), { payload: askJson }), { ...RL_ENV, LLM_RATE_PER_MIN: "3", LLM_RATE_PER_DAY: "50" }, net.fetchImpl as any);
  assert.deepEqual(net.which("rpc")[0].body, { p_user: USER, p_per_min: 3, p_per_day: 50 });
});

test("rate limit fails OPEN: a broken counter must not take the feature down", async () => {
  for (const rpc of [new Response("oops", { status: 500 }), () => Promise.reject(new TypeError("fetch failed")), new Response("not json", { status: 200 })]) {
    const net = fakeNet({ groq: groqOk("{}"), rpc });
    const res = await handle(postAs(jwtFor(USER), { payload: askJson }), RL_ENV, net.fetchImpl as any);
    assert.equal(res.status, 200);
  }
});

test("rate limit is skipped when it can't apply: no service key, no/garbled JWT, non-uuid sub, or switched off", async () => {
  const cases: [string | null, Record<string, string>][] = [
    [jwtFor(USER), ENV],                                        // no SUPABASE_URL / service key configured
    [null, RL_ENV],                                             // no Authorization header
    ["not.a-jwt", RL_ENV],                                      // garbled
    [jwtFor("not-a-uuid"), RL_ENV],                             // sub isn't a uuid
    [jwtFor(USER), { ...RL_ENV, LLM_RATE_LIMIT: "off" }],       // explicitly off
  ];
  for (const [jwt, env] of cases) {
    const net = fakeNet({ groq: groqOk("{}"), rpc: rpcDeny(9) });
    const res = await handle(postAs(jwt, { payload: askJson }), env, net.fetchImpl as any);
    assert.equal(res.status, 200, `should be served: ${jwt}`);
    assert.equal(net.which("rpc").length, 0);
  }
});

test("rate limit: invalid requests are rejected before they can use up quota", async () => {
  const net = fakeNet({ groq: groqOk("{}"), rpc: rpcAllow() });
  const res = await handle(postAs(jwtFor(USER), { payload: { contents: [] } }), RL_ENV, net.fetchImpl as any);
  assert.equal(res.status, 400);
  assert.equal(net.which("rpc").length, 0);
});

test("rate limit: the service key never appears in a response", async () => {
  const net = fakeNet({ groq: status(500), gemini: status(500), rpc: rpcAllow() });
  const res = await handle(postAs(jwtFor(USER), { payload: askJson }), RL_ENV, net.fetchImpl as any);
  assert.ok(!(await res.text()).includes("service-role-SECRET"));
});

// ---------------------------------------------------------------- transient errors
test("a momentary 503 is retried once and succeeds, without moving to another model or provider", async () => {
  let n = 0;
  const net = fakeNet({ groq: status(404), gemini: () => (++n === 1 ? status(503) : geminiOk('{"themes":["Work"]}')) });
  const { res, data } = await run({ payload: askJson }, { ...ENV, GROQ_MODEL: "only-groq" }, net);
  assert.equal(res.status, 200);
  assert.equal(data.provider, "gemini");
  const g = net.which("gemini");
  assert.equal(g.length, 2, "one failure plus one retry");
  assert.ok(g.every((c) => c.url.includes("gemini-3.6-flash")), "the retry uses the same model");
});

test("a Gemini model that stays overloaded falls through to the next Gemini model", async () => {
  const net = fakeNet({
    groq: status(401),
    gemini: (_s: AbortSignal) => status(503),
  });
  // model-aware fake: first model always 503, second answers
  const fetchImpl = async (url: string, init: any) => {
    if (url.includes("/chat/completions")) return status(401);
    return url.includes("gemini-3.6-flash:") ? status(503) : geminiOk('{"ok":1}');
  };
  const res = await handle(post({ payload: askJson }), ENV, fetchImpl as any);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).provider, "gemini");
  void net;
});

test("rate limits (429) and client errors are NOT retried", async () => {
  const net = fakeNet({ groq: status(429), gemini: status(400) });
  await run({ payload: askJson }, { ...ENV, GROQ_MODEL: "g1", GEMINI_MODEL: "m1" }, net);
  assert.equal(net.which("groq").length, 1);
  assert.equal(net.which("gemini").length, 1);
});

test("the retry never outlasts the overall timeout", async () => {
  const net = fakeNet({ groq: status(503), gemini: status(503) });
  const t0 = Date.now();
  const { res } = await run({ payload: askJson }, { ...ENV, LLM_RETRY_DELAY_MS: "60", LLM_TIMEOUT_MS: "100" }, net);
  assert.equal(res.status, 502);
  assert.ok(Date.now() - t0 < 1500);
});

// ---------------------------------------------------------------- per-model time budget
test("a model that hangs only burns its own budget; the next Gemini model still gets to answer", async () => {
  const fetchImpl = async (url: string, init: any) => {
    if (url.includes("/chat/completions")) return status(401);
    if (url.includes("gemini-3.6-flash:")) {
      return new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(new Error("aborted"))));
    }
    return geminiOk('{"ok":1}');
  };
  const t0 = Date.now();
  const res = await handle(post({ payload: askJson }), { ...ENV, LLM_MODEL_TIMEOUT_MS: "60", LLM_TIMEOUT_MS: "5000" }, fetchImpl as any);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.provider, "gemini");
  assert.ok(Date.now() - t0 < 2000, "should answer long before the provider-wide timeout");
});

test("a per-model timeout is reported as a timeout, naming the model", async () => {
  const hang = (_s: AbortSignal) => new Promise((_, reject) => _s.addEventListener("abort", () => reject(new Error("aborted"))));
  const net = fakeNet({ groq: hang, gemini: hang });
  const { res, data } = await run({ payload: askJson }, { ...ENV, LLM_MODEL_TIMEOUT_MS: "30", LLM_TIMEOUT_MS: "5000", GROQ_MODEL: "g1", GEMINI_MODEL: "m1" }, net);
  assert.equal(res.status, 502);
  assert.deepEqual(data.attempts, [
    { provider: "groq", status: null, reason: "timeout", model: "g1" },
    { provider: "gemini", status: null, reason: "timeout", model: "m1" },
  ]);
});
