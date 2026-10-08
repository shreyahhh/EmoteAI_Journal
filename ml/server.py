"""FastAPI service exposing the emotion model.

    uvicorn server:app --port 8000        (or ml/run_dev.ps1, which fills in the Supabase settings)

Login: every /analyze call must carry the user's Supabase access token. Set SUPABASE_URL and
SUPABASE_ANON_KEY (the public values from the app's .env). To run WITHOUT a login check, for
local experiments only, set EMOTE_AUTH=off explicitly; the server will not start unprotected
by accident.

Env:
  EMOTE_MODEL_DIR / EMOTE_SARCASM_DIR   model folders (default "model" / "sarcasm_model")
  EMOTE_ALLOWED_ORIGINS                 comma-separated CORS origins (default http://localhost:3000)
  EMOTE_AUTH                            "off" disables the login check
  EMOTE_RATE_PER_MIN                    analyses per user per minute (default 20)
  EMOTE_MAX_CONCURRENT                  analyses running at once (default 2)
"""
import os
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from auth import AuthError, Authenticator, RateLimiter

state: dict = {}
# Inference is CPU-bound: let a couple of analyses run at once and queue the rest,
# rather than every request fighting over the same cores.
slots = threading.BoundedSemaphore(int(os.environ.get("EMOTE_MAX_CONCURRENT", "2")))


def auth_enabled() -> bool:
    return os.environ.get("EMOTE_AUTH", "on").strip().lower() != "off"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if auth_enabled():
        if "auth" not in state:  # tests inject their own
            url, anon = os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_ANON_KEY")
            if not url or not anon:
                raise RuntimeError(
                    "Login check is on but SUPABASE_URL / SUPABASE_ANON_KEY are not set. "
                    "Set them (the public values from the app's .env), or set EMOTE_AUTH=off for local experiments only."
                )
            state["auth"] = Authenticator(url, anon)
    else:
        print("WARNING: EMOTE_AUTH=off - anyone who can reach this server can use it.", flush=True)
    state.setdefault("limiter", RateLimiter(int(os.environ.get("EMOTE_RATE_PER_MIN", "20"))))
    if "model" not in state:
        from predict import EmotionModel  # heavy import, skipped when a model is injected (tests)

        state["model"] = EmotionModel(
            os.environ.get("EMOTE_MODEL_DIR", "model"),
            os.environ.get("EMOTE_SARCASM_DIR", "sarcasm_model"),
        )
    yield


app = FastAPI(title="Emote emotion model", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("EMOTE_ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.exception_handler(AuthError)
async def auth_error_handler(_req: Request, exc: AuthError):
    return JSONResponse({"detail": exc.detail}, status_code=exc.status)


class AnalyzeRequest(BaseModel):
    text: str
    explain: bool = False
    sarcasm_confirmed: list[int] = []  # line indices the person confirmed as sarcastic
    sarcasm_confirmed_texts: list[str] = []  # or the lines themselves (survives edits), matched by normalised text


@app.get("/health")
def health():
    return {"ok": "model" in state}


@app.post("/analyze")
def analyze(req: AnalyzeRequest, request: Request):
    user = state["auth"].user_id(request.headers.get("authorization")) if auth_enabled() else "anonymous"
    allowed, retry_after = state["limiter"].check(user)
    if not allowed:
        raise HTTPException(status_code=429, detail="Too many requests. Try again shortly.", headers={"Retry-After": str(retry_after)})
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is empty")
    with slots:
        return state["model"].analyze(req.text[:20000], explain=req.explain, sarcasm_confirmed=req.sarcasm_confirmed,
                                      sarcasm_confirmed_texts=req.sarcasm_confirmed_texts)
