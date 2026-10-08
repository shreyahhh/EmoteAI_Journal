"""Login check and per-user rate limit for the model server.

The browser sends the user's Supabase access token (`Authorization: Bearer ...`). We don't
verify the token's signature ourselves (Supabase signs with rotating, possibly asymmetric
keys); instead we ask Supabase Auth whether the token is valid (`GET /auth/v1/user`) and cache
the answer briefly, so one analysis doesn't cost a second network round trip each time.
"""
import base64
import hashlib
import json
import threading
import time
import urllib.error
import urllib.request
from collections import defaultdict, deque


class AuthError(Exception):
    def __init__(self, status: int, detail: str):
        super().__init__(detail)
        self.status = status
        self.detail = detail


def _jwt_exp(token: str):
    """The (unverified) expiry from a JWT, used only to avoid caching past it."""
    try:
        payload = token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        return float(json.loads(base64.urlsafe_b64decode(payload)).get("exp"))
    except Exception:
        return None


def _default_fetch(url: str, headers: dict, timeout: float):
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, json.load(resp)
    except urllib.error.HTTPError as e:
        return e.code, None


class Authenticator:
    def __init__(self, supabase_url: str, anon_key: str, ttl: float = 60.0, timeout: float = 5.0, fetch=None, clock=time.time):
        self.url = supabase_url.rstrip("/")
        self.anon_key = anon_key
        self.ttl = ttl
        self.timeout = timeout
        self.fetch = fetch or _default_fetch
        self.clock = clock
        self._cache: dict[str, tuple[str, float]] = {}  # sha256(token) -> (user id, valid until)
        self._lock = threading.Lock()

    def user_id(self, authorization: str | None) -> str:
        if not authorization or not authorization.lower().startswith("bearer "):
            raise AuthError(401, "Missing login token.")
        token = authorization[7:].strip()
        if not token:
            raise AuthError(401, "Missing login token.")

        digest = hashlib.sha256(token.encode()).hexdigest()
        now = self.clock()
        with self._lock:
            hit = self._cache.get(digest)
            if hit and hit[1] > now:
                return hit[0]

        try:
            status, body = self.fetch(
                f"{self.url}/auth/v1/user",
                {"apikey": self.anon_key, "Authorization": f"Bearer {token}"},
                self.timeout,
            )
        except Exception:
            # Can't reach Supabase: refuse rather than let unauthenticated traffic through.
            raise AuthError(503, "Could not verify your login right now.")
        if status in (401, 403):
            raise AuthError(401, "Invalid or expired login.")
        if status != 200 or not isinstance(body, dict) or not body.get("id"):
            raise AuthError(503, "Could not verify your login right now.")

        valid_until = now + self.ttl
        exp = _jwt_exp(token)
        if exp is not None:
            valid_until = min(valid_until, exp)
        with self._lock:
            if len(self._cache) > 2000:  # bound memory
                self._cache = {k: v for k, v in self._cache.items() if v[1] > now}
            self._cache[digest] = (str(body["id"]), valid_until)
        return str(body["id"])


class RateLimiter:
    """Sliding-window limiter, per key, in memory (one process)."""

    def __init__(self, limit: int, window: float = 60.0, clock=time.monotonic):
        self.limit = limit
        self.window = window
        self.clock = clock
        self._hits: dict[str, deque] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str) -> tuple[bool, int]:
        """(allowed, seconds until a slot frees up)."""
        now = self.clock()
        with self._lock:
            q = self._hits[key]
            while q and q[0] <= now - self.window:
                q.popleft()
            if len(q) >= self.limit:
                return False, max(1, int(q[0] + self.window - now) + 1)
            q.append(now)
            if len(self._hits) > 5000:  # drop idle keys
                for k in [k for k, v in self._hits.items() if not v]:
                    del self._hits[k]
            return True, 0
