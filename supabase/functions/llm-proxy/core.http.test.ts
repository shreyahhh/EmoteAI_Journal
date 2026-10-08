// Integration test: runs handle() with the REAL fetch against local stand-ins for the
// Groq and Gemini HTTP APIs, so URL building, headers, bodies and timeouts are exercised
// over an actual network connection.
// Run with:  node --test supabase/functions/llm-proxy/core.http.test.ts
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { handle } from "./core.ts";

type Seen = { path: string; headers: http.IncomingHttpHeaders; body: any };
let server: http.Server;
let base = "";
let seen: Seen[] = [];
let groqMode: "ok" | "429" | "hang" = "ok";

before(async () => {
  server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      seen.push({ path: req.url ?? "", headers: req.headers, body: JSON.parse(raw || "{}") });
      if (req.url?.endsWith("/chat/completions")) {
        if (groqMode === "429") { res.writeHead(429).end(JSON.stringify({ error: "rate limited" })); return; }
        if (groqMode === "hang") return; // never answers
        res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ choices: [{ message: { content: '{"from":"groq"}' } }] }));
      } else if (req.url?.includes(":generateContent")) {
        res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"from":"gemini"}' }] } }] }));
      } else {
        res.writeHead(404).end();
      }
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => { server.closeAllConnections?.(); server.close(); });

const env = () => ({ GROQ_API_KEY: "k-groq", GEMINI_API_KEY: "k-gemini", GROQ_BASE_URL: `${base}/openai/v1`, GEMINI_BASE_URL: `${base}/v1beta`, LLM_TIMEOUT_MS: "400" });
const call = async () => {
  const res = await handle(
    new Request("https://x/fn", { method: "POST", body: JSON.stringify({ payload: { contents: [{ parts: [{ text: "Return JSON." }] }], generationConfig: { responseMimeType: "application/json" } } }) }),
    env(),
  );
  return { res, data: await res.json() };
};

test("real HTTP: Groq request is well-formed and its answer is relayed", async () => {
  seen = []; groqMode = "ok";
  const { res, data } = await call();
  assert.equal(res.status, 200);
  assert.equal(data.provider, "groq");
  assert.equal(seen.length, 1);
  assert.equal(seen[0].path, "/openai/v1/chat/completions");
  assert.equal(seen[0].headers.authorization, "Bearer k-groq");
  assert.equal(seen[0].headers["content-type"], "application/json");
  assert.deepEqual(seen[0].body.response_format, { type: "json_object" });
});

test("real HTTP: Groq 429 falls back to Gemini, with the key in a header not the URL", async () => {
  seen = []; groqMode = "429";
  const { data } = await call();
  assert.equal(data.provider, "gemini");
  const g = seen.find((s) => s.path.includes(":generateContent"))!;
  assert.equal(g.path, "/v1beta/models/gemini-3.6-flash:generateContent");
  assert.equal(g.headers["x-goog-api-key"], "k-gemini");
});

test("real HTTP: a Groq that never answers is aborted and Gemini takes over", async () => {
  seen = []; groqMode = "hang";
  const t0 = Date.now();
  const { data } = await call();
  assert.equal(data.provider, "gemini");
  const took = Date.now() - t0;
  assert.ok(took >= 350 && took < 3000, `took ${took}ms`);
});
