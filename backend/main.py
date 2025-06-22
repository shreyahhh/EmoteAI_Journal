from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from nlp import analyze_text_granularly
from fastapi.middleware.cors import CORSMiddleware
from database import supabase

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:5174", # Often vite uses the next port if 5173 is in use
    "http://localhost:3000", # Common port for React dev servers
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JournalEntry(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/analyze")
def analyze_entry(entry: JournalEntry):
    # First, save the entry to the database
    try:
        # We are not handling user_id yet, so it will be null
        data, count = supabase.table('journal_entries').insert({"content": entry.text}).execute()
    except Exception as e:
        print(f"Database Error: {e}")
        # We can still return the analysis even if the save fails
        # but we'll raise an error for now to make it clear.
        raise HTTPException(status_code=500, detail="Failed to save journal entry.")

    # Then, perform the analysis
    return analyze_text_granularly(entry.text) 