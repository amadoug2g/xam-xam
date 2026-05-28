#!/usr/bin/env python3
"""
Xam-Xam API — Backend minimal pour l'app d'apprentissage du Wolof.

Endpoints:
    POST   /api/split                         Upload audio + split via extract_audio.py
    GET    /api/lessons                        Liste toutes les lecons
    GET    /api/lessons/{id}                   Detail d'une lecon
    POST   /api/lessons                        Cree une nouvelle lecon
    PUT    /api/lessons/{id}                   Met a jour une lecon
    DELETE /api/lessons/{id}/cards/{card_id}   Supprime une carte
    GET    /api/audio/{lesson_id}/{filename}   Sert les fichiers MP3
    POST   /api/lessons/{id}/publish           Publie vers mock.js du front

Port: 8787
"""

import json
import logging
import os
import shutil
import subprocess
import sys
import tempfile
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
API_DIR = Path(__file__).resolve().parent
SCRIPTS_DIR = API_DIR.parent
PROJECT_ROOT = SCRIPTS_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
AUDIO_DIR = PROJECT_ROOT / "public" / "audio"
EXTRACT_SCRIPT = SCRIPTS_DIR / "extract_audio.py"
MOCK_JS_PATH = PROJECT_ROOT / "src" / "data" / "mock.js"
LESSONS_FILE = DATA_DIR / "lessons.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("xam-xam-api")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="Xam-Xam API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://xam-xam.pages.dev",
        "https://*.xam-xam.pages.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Helpers — JSON persistence
# ---------------------------------------------------------------------------

def _load_lessons() -> list[dict]:
    if not LESSONS_FILE.exists():
        return []
    with open(LESSONS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_lessons(lessons: list[dict]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(LESSONS_FILE, "w", encoding="utf-8") as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)


def _find_lesson(lessons: list[dict], lesson_id: str) -> tuple[int, dict]:
    for i, lesson in enumerate(lessons):
        if lesson["id"] == lesson_id:
            return i, lesson
    raise HTTPException(status_code=404, detail=f"Lesson '{lesson_id}' not found")


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class LessonCreate(BaseModel):
    id: str
    title: str
    description: str = ""
    cards: list[dict] = []


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cards: Optional[list[dict]] = None


# ---------------------------------------------------------------------------
# 1. POST /api/split — Upload audio, run extract_audio.py
# ---------------------------------------------------------------------------

@app.post("/api/split")
async def split_audio(
    file: UploadFile = File(...),
    lesson_id: str = Form(...),
    first_lang: str = Form("fr"),
    silence_thresh: int = Form(-40),
    min_silence: int = Form(700),
):
    """Upload an audio file and split it into FR/WO segments."""
    logger.info(f"POST /api/split — lesson_id={lesson_id}, file={file.filename}")

    if not EXTRACT_SCRIPT.exists():
        raise HTTPException(status_code=500, detail="extract_audio.py not found")

    # Save uploaded file to a temp location
    suffix = Path(file.filename).suffix if file.filename else ".mp3"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        output_dir = AUDIO_DIR / lesson_id
        cmd = [
            sys.executable,
            str(EXTRACT_SCRIPT),
            tmp_path,
            lesson_id,
            "--output-dir", str(output_dir),
            "--first-lang", first_lang,
            "--silence-thresh", str(silence_thresh),
            "--min-silence", str(min_silence),
        ]
        logger.info(f"Running: {' '.join(cmd)}")

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
            cwd=str(SCRIPTS_DIR),
        )

        if result.returncode != 0:
            logger.error(f"extract_audio.py failed:\n{result.stderr}")
            raise HTTPException(
                status_code=500,
                detail=f"Audio extraction failed: {result.stderr[-500:]}",
            )

        # Read the generated JSON
        json_output = SCRIPTS_DIR / "output" / f"lesson_{lesson_id}.json"
        if not json_output.exists():
            raise HTTPException(
                status_code=500,
                detail="Extraction completed but no JSON output found",
            )

        with open(json_output, "r", encoding="utf-8") as f:
            lesson_data = json.load(f)

        # Auto-save to lessons.json
        lessons = _load_lessons()
        existing_idx = None
        for i, l in enumerate(lessons):
            if l["id"] == lesson_id:
                existing_idx = i
                break

        if existing_idx is not None:
            lessons[existing_idx] = lesson_data
        else:
            lessons.append(lesson_data)
        _save_lessons(lessons)

        logger.info(f"Split complete: {len(lesson_data.get('cards', []))} cards")
        return lesson_data

    finally:
        os.unlink(tmp_path)


# ---------------------------------------------------------------------------
# 2. GET /api/lessons — List all lessons
# ---------------------------------------------------------------------------

@app.get("/api/lessons")
async def list_lessons():
    lessons = _load_lessons()
    # Return summary (without full card data)
    summaries = []
    for lesson in lessons:
        summaries.append({
            "id": lesson["id"],
            "title": lesson.get("title", ""),
            "description": lesson.get("description", ""),
            "cardCount": len(lesson.get("cards", [])),
        })
    return summaries


# ---------------------------------------------------------------------------
# 3. GET /api/lessons/{id} — Lesson detail
# ---------------------------------------------------------------------------

@app.get("/api/lessons/{lesson_id}")
async def get_lesson(lesson_id: str):
    lessons = _load_lessons()
    _, lesson = _find_lesson(lessons, lesson_id)
    return lesson


# ---------------------------------------------------------------------------
# 4. POST /api/lessons — Create a new lesson
# ---------------------------------------------------------------------------

@app.post("/api/lessons", status_code=201)
async def create_lesson(payload: LessonCreate):
    lessons = _load_lessons()

    # Check duplicate
    for l in lessons:
        if l["id"] == payload.id:
            raise HTTPException(status_code=409, detail=f"Lesson '{payload.id}' already exists")

    lesson = payload.model_dump()
    lessons.append(lesson)
    _save_lessons(lessons)
    logger.info(f"Created lesson: {payload.id}")
    return lesson


# ---------------------------------------------------------------------------
# 5. PUT /api/lessons/{id} — Update a lesson
# ---------------------------------------------------------------------------

@app.put("/api/lessons/{lesson_id}")
async def update_lesson(lesson_id: str, payload: LessonUpdate):
    lessons = _load_lessons()
    idx, lesson = _find_lesson(lessons, lesson_id)

    if payload.title is not None:
        lesson["title"] = payload.title
    if payload.description is not None:
        lesson["description"] = payload.description
    if payload.cards is not None:
        lesson["cards"] = payload.cards

    lessons[idx] = lesson
    _save_lessons(lessons)
    logger.info(f"Updated lesson: {lesson_id}")
    return lesson


# ---------------------------------------------------------------------------
# 6. DELETE /api/lessons/{id}/cards/{card_id} — Delete a card
# ---------------------------------------------------------------------------

@app.delete("/api/lessons/{lesson_id}/cards/{card_id}")
async def delete_card(lesson_id: str, card_id: str):
    lessons = _load_lessons()
    idx, lesson = _find_lesson(lessons, lesson_id)

    cards = lesson.get("cards", [])
    original_len = len(cards)
    lesson["cards"] = [c for c in cards if c.get("id") != card_id]

    if len(lesson["cards"]) == original_len:
        raise HTTPException(status_code=404, detail=f"Card '{card_id}' not found in lesson '{lesson_id}'")

    lessons[idx] = lesson
    _save_lessons(lessons)
    logger.info(f"Deleted card {card_id} from lesson {lesson_id}")
    return {"detail": "Card deleted", "remaining": len(lesson["cards"])}


# ---------------------------------------------------------------------------
# 7. GET /api/audio/{lesson_id}/{filename} — Serve MP3 files
# ---------------------------------------------------------------------------

@app.get("/api/audio/{lesson_id}/{filename}")
async def serve_audio(lesson_id: str, filename: str):
    filepath = AUDIO_DIR / lesson_id / filename

    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")

    # Security: prevent path traversal
    try:
        filepath.resolve().relative_to(AUDIO_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Forbidden")

    return FileResponse(
        path=str(filepath),
        media_type="audio/mpeg",
        filename=filename,
    )


# ---------------------------------------------------------------------------
# 8. POST /api/lessons/{id}/publish — Generate mock.js for the frontend
# ---------------------------------------------------------------------------

@app.post("/api/lessons/{lesson_id}/publish")
async def publish_lesson(lesson_id: str):
    """
    Publish = regenerate src/data/mock.js with all lessons marked as published.
    This makes the lesson available in the static frontend.
    """
    lessons = _load_lessons()
    _, lesson = _find_lesson(lessons, lesson_id)

    # Mark as published
    lesson["published"] = True
    _save_lessons(lessons)

    # Rebuild mock.js from all published lessons
    published = [l for l in lessons if l.get("published")]
    _generate_mock_js(published)

    logger.info(f"Published lesson: {lesson_id} — mock.js regenerated with {len(published)} lessons")
    return {"detail": f"Lesson '{lesson_id}' published", "total_published": len(published)}


def _generate_mock_js(lessons: list[dict]) -> None:
    """Generate src/data/mock.js from lesson data."""
    lines = [
        "/**",
        " * mock.js -- Donnees generees automatiquement par l'API Xam-Xam",
        " *",
        " * Structure :",
        " *   Lesson { id, title, description, cards[] }",
        " *   Card   { id, lessonId, position, wo, fr, audioWo, audioFr }",
        " */",
        "",
        "export const LESSONS = ",
    ]

    # Build clean lesson objects (strip meta/internal fields)
    clean_lessons = []
    for lesson in lessons:
        clean = {
            "id": lesson["id"],
            "title": lesson.get("title", ""),
            "description": lesson.get("description", ""),
            "cards": [],
        }
        for card in lesson.get("cards", []):
            clean["cards"].append({
                "id": card.get("id", ""),
                "lessonId": card.get("lessonId", lesson["id"]),
                "position": card.get("position", 0),
                "wo": card.get("wo", "TODO"),
                "fr": card.get("fr", "TODO"),
                "audioWo": card.get("audioWo"),
                "audioFr": card.get("audioFr"),
            })
        clean_lessons.append(clean)

    js_content = lines[:-1]  # everything before the export line
    js_content.append("")
    js_content.append(
        "export const LESSONS = "
        + json.dumps(clean_lessons, ensure_ascii=False, indent=2)
    )
    js_content.append("")

    MOCK_JS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MOCK_JS_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(js_content))

    logger.info(f"mock.js written to {MOCK_JS_PATH}")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health():
    return {"status": "ok", "project": "xam-xam"}


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8787,
        reload=False,
        log_level="info",
    )
