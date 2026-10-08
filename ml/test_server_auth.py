"""Tests for the login check and rate limit.  Run:  python -m unittest test_server_auth -v

A fake Supabase Auth and a fake model are injected, so these need no network and no model files.
"""
import base64
import json
import os
import time
import unittest
from unittest import mock

from fastapi.testclient import TestClient

import server
from auth import AuthError, Authenticator, RateLimiter


def jwt_with_exp(exp: float) -> str:
    b = lambda o: base64.urlsafe_b64encode(json.dumps(o).encode()).rstrip(b"=").decode()
    return f"{b({'alg': 'ES256'})}.{b({'exp': exp, 'sub': 'x'})}.sig"


class FakeModel:
    def __init__(self):
        self.calls = 0

    def analyze(self, text, **kw):
        self.calls += 1
        return {"mood": "happy", "echo": text[:20], "kw": sorted(kw)}


class FakeSupabase:
    """Stands in for GET /auth/v1/user."""

    USERS = {"token-a": "user-a", "token-b": "user-b"}

    def __init__(self):
        self.calls = []

    def __call__(self, url, headers, timeout):
        self.calls.append((url, headers))
        token = headers["Authorization"].split(" ", 1)[1]
        if token == "down":
            raise OSError("connection refused")
        if token == "weird":
            return 500, None
        if token in self.USERS:
            return 200, {"id": self.USERS[token]}
        return 401, None


class ServerAuthTests(unittest.TestCase):
    def setUp(self):
        self.fake = FakeSupabase()
        self.model = FakeModel()
        server.state.clear()
        server.state["model"] = self.model
        server.state["auth"] = Authenticator("https://proj.supabase.co", "anon-key", fetch=self.fake)
        server.state["limiter"] = RateLimiter(3, window=60)
        self.env = mock.patch.dict(os.environ, {"EMOTE_AUTH": "on"})
        self.env.start()
        self.client = TestClient(server.app)
        self.client.__enter__()

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.env.stop()
        server.state.clear()

    def post(self, token=None, text="I am happy today", **extra):
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        return self.client.post("/analyze", json={"text": text, **extra}, headers=headers)

    # ---- login ----
    def test_health_is_open(self):
        self.assertEqual(self.client.get("/health").json(), {"ok": True})

    def test_no_token_is_401_and_model_not_run(self):
        r = self.post()
        self.assertEqual(r.status_code, 401)
        self.assertEqual(self.model.calls, 0)

    def test_malformed_headers_are_401(self):
        for header in ("Basic abc", "Bearer", "Bearer   ", "token-a"):
            r = self.client.post("/analyze", json={"text": "hi"}, headers={"Authorization": header})
            self.assertEqual(r.status_code, 401, header)
        self.assertEqual(self.model.calls, 0)

    def test_invalid_token_is_401(self):
        self.assertEqual(self.post("nope").status_code, 401)
        self.assertEqual(self.model.calls, 0)

    def test_valid_token_works_and_asks_supabase_with_anon_key(self):
        r = self.post("token-a")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["mood"], "happy")
        url, headers = self.fake.calls[0]
        self.assertEqual(url, "https://proj.supabase.co/auth/v1/user")
        self.assertEqual(headers["apikey"], "anon-key")
        self.assertEqual(headers["Authorization"], "Bearer token-a")

    def test_verified_tokens_are_cached(self):
        for _ in range(3):
            self.assertEqual(self.post("token-a").status_code, 200)
        self.assertEqual(len(self.fake.calls), 1)

    def test_invalid_tokens_are_not_cached_so_a_fix_takes_effect(self):
        self.assertEqual(self.post("nope").status_code, 401)
        self.assertEqual(self.post("nope").status_code, 401)
        self.assertEqual(len(self.fake.calls), 2)

    def test_supabase_unreachable_fails_closed_with_503(self):
        r = self.post("down")
        self.assertEqual(r.status_code, 503)
        self.assertEqual(self.model.calls, 0)
        self.assertEqual(self.post("weird").status_code, 503)

    def test_cache_expires(self):
        now = [1000.0]
        auth = Authenticator("https://p.supabase.co", "k", ttl=60, fetch=self.fake, clock=lambda: now[0])
        self.assertEqual(auth.user_id("Bearer token-a"), "user-a")
        now[0] += 30
        auth.user_id("Bearer token-a")
        self.assertEqual(len(self.fake.calls), 1)
        now[0] += 31
        auth.user_id("Bearer token-a")
        self.assertEqual(len(self.fake.calls), 2)

    def test_cache_never_outlives_the_token(self):
        now = [1000.0]
        auth = Authenticator("https://p.supabase.co", "k", ttl=600, fetch=lambda *a: (200, {"id": "u"}), clock=lambda: now[0])
        token = jwt_with_exp(1010)
        auth.user_id(f"Bearer {token}")
        now[0] = 1011  # token expired 1s ago; the cache entry must not still vouch for it
        calls = []
        auth.fetch = lambda *a: (calls.append(1), (401, None))[1]
        with self.assertRaises(AuthError):
            auth.user_id(f"Bearer {token}")
        self.assertEqual(len(calls), 1)

    # ---- rate limit ----
    def test_rate_limit_per_user_with_retry_after(self):
        for _ in range(3):
            self.assertEqual(self.post("token-a").status_code, 200)
        r = self.post("token-a")
        self.assertEqual(r.status_code, 429)
        self.assertGreaterEqual(int(r.headers["Retry-After"]), 1)
        self.assertEqual(self.model.calls, 3, "a limited request must not reach the model")

    def test_one_users_limit_does_not_affect_another(self):
        for _ in range(4):
            self.post("token-a")
        self.assertEqual(self.post("token-b").status_code, 200)

    def test_limiter_window_slides(self):
        now = [0.0]
        lim = RateLimiter(2, window=10, clock=lambda: now[0])
        self.assertEqual([lim.check("u")[0] for _ in range(3)], [True, True, False])
        now[0] = 10.5
        self.assertTrue(lim.check("u")[0])

    # ---- CORS / switches / startup ----
    def test_cors_preflight_needs_no_login(self):
        r = self.client.options("/analyze", headers={
            "Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization,content-type"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.headers["access-control-allow-origin"], "http://localhost:3000")

    def test_auth_off_works_without_a_token_but_is_still_rate_limited(self):
        with mock.patch.dict(os.environ, {"EMOTE_AUTH": "off"}):
            codes = [self.post().status_code for _ in range(4)]
        self.assertEqual(codes, [200, 200, 200, 429])

    def test_refuses_to_start_unprotected_by_accident(self):
        server.state.clear()
        with mock.patch.dict(os.environ, {"EMOTE_AUTH": "on"}, clear=False):
            for k in ("SUPABASE_URL", "SUPABASE_ANON_KEY"):
                os.environ.pop(k, None)
            with self.assertRaises(RuntimeError) as cm:
                with TestClient(server.app):
                    pass
        self.assertIn("EMOTE_AUTH=off", str(cm.exception))


if __name__ == "__main__":
    unittest.main()
