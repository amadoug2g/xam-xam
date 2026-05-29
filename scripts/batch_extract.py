#!/usr/bin/env python3
"""
batch_extract.py — Process N Assimil MP3s in one pass, models loaded once.

Usage:
    python3 batch_extract.py lecon1.mp3:salutations lecon2.mp3:famille lecon3.mp3:temps
    python3 batch_extract.py --list batch.txt
    python3 batch_extract.py *.mp3 --auto-ids

batch.txt format (one per line):
    filename.mp3 lesson_id
    # lines starting with # are comments

Options:
    --transcribe            Run Whisper on FR segments (default: off)
    --whisper-model         tiny/base/small (default: small)
    --wo-strategy           last/first/longest/all (default: last)
    --auto-card-gap         Auto-detect gap threshold per lesson
    --card-gap N            Manual gap threshold in ms (default: 1200)
    --skip-intro N          Skip first N ms of each file (default: 0)
    --auto-skip-intro       Auto-detect intro per file
    --first-lang fr|wo      First language per card (default: fr)
    --dry-run               Preview only, no export
"""

import argparse
import gc
import json
import os
import sys
import time
from pathlib import Path

# Add scripts dir to path so we can import extract_audio
sys.path.insert(0, str(Path(__file__).parent))
from extract_audio import (
    load_audio,
    detect_segments,
    detect_segments_vad,
    detect_intro_auto,
    skip_intro,
    compute_gaps,
    classify_gaps_kmeans,
    suggest_card_gap,
    group_into_cards,
    export_cards,
    build_cards_json,
    _SILERO_OK,
    _SKLEARN_OK,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def parse_job(spec: str) -> tuple[str, str]:
    """Parse 'filename.mp3:lesson_id' or 'filename.mp3 lesson_id'."""
    if ":" in spec:
        parts = spec.rsplit(":", 1)
    else:
        parts = spec.split(None, 1)
    if len(parts) != 2:
        raise ValueError(f"Cannot parse job spec: '{spec}'. Expected 'file.mp3:lesson_id'")
    return parts[0].strip(), parts[1].strip()


def load_jobs_from_file(path: str) -> list[tuple[str, str]]:
    jobs = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split()
            if len(parts) < 2:
                print(f"  [skip] Bad line in batch file: {line!r}")
                continue
            jobs.append((parts[0], parts[1]))
    return jobs


def auto_ids_from_filenames(filenames: list[str]) -> list[tuple[str, str]]:
    """Derive lesson IDs from MP3 filenames (stem, lowercased, spaces→hyphens)."""
    jobs = []
    for f in filenames:
        stem = Path(f).stem.lower().replace(" ", "-").replace("_", "-")
        jobs.append((f, stem))
    return jobs


def process_lesson(
    input_path: str,
    lesson_id: str,
    args,
    vad_model=None,
    whisper_model=None,
) -> dict:
    """Process one lesson. Returns result dict."""
    t0 = time.time()
    print(f"\n{'='*60}")
    print(f"  Lesson: {lesson_id}  |  File: {Path(input_path).name}")
    print(f"{'='*60}")

    audio = load_audio(input_path)
    print(f"  Duration: {len(audio)/1000:.1f}s")

    # Segment detection
    if vad_model is not None and not args.no_vad:
        import torch
        import tempfile

        audio_16k = audio.set_frame_rate(16000).set_channels(1)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = tmp.name
        try:
            audio_16k.export(tmp_path, format="wav")
            try:
                from scipy.io import wavfile as scipy_wavfile
                import numpy as np
                _sr, _data = scipy_wavfile.read(tmp_path)
                if _data.dtype != np.float32:
                    _data = _data.astype(np.float32) / (np.iinfo(_data.dtype).max if np.issubdtype(_data.dtype, np.integer) else 1.0)
                if _data.ndim > 1:
                    _data = _data.mean(axis=1)
                wav = torch.FloatTensor(_data)
            except Exception:
                from silero_vad import read_audio
                wav = read_audio(tmp_path)
        finally:
            os.unlink(tmp_path)

        from silero_vad import get_speech_timestamps
        speech_ts = get_speech_timestamps(
            wav, vad_model,
            threshold=args.vad_threshold,
            sampling_rate=16000,
            min_speech_duration_ms=args.min_segment_len,
            min_silence_duration_ms=200,
            return_seconds=False,
        )
        segments = []
        for ts in speech_ts:
            start_ms = int(ts["start"] / 16)
            end_ms   = int(ts["end"]   / 16)
            s = max(0, start_ms - args.padding)
            e = min(len(audio), end_ms + args.padding)
            seg = audio[s:e]
            if len(seg) >= args.min_segment_len:
                segments.append({
                    "start_ms": s, "end_ms": e,
                    "duration_ms": len(seg),
                    "segment": seg, "dbfs": seg.dBFS,
                })
        print(f"  VAD: {len(segments)} segments detected")
    else:
        segments = detect_segments(
            audio,
            min_silence_len=args.min_silence,
            silence_thresh=args.silence_thresh,
            padding=args.padding,
            min_segment_len=args.min_segment_len,
        )
        print(f"  pydub: {len(segments)} segments detected")

    if not segments:
        return {"lesson_id": lesson_id, "status": "error", "error": "no segments", "cards": 0}

    # Intro handling
    if args.skip_intro > 0:
        segments = skip_intro(segments, args.skip_intro)
    elif args.auto_skip_intro:
        skip_point = detect_intro_auto(segments)
        if skip_point > 0:
            segments = skip_intro(segments, skip_point)

    # Gap threshold
    card_gap = args.card_gap
    if args.auto_card_gap:
        gaps = compute_gaps(segments)
        if _SKLEARN_OK and len(gaps) >= 4:
            card_gap = classify_gaps_kmeans(gaps)
        else:
            suggested = suggest_card_gap(segments)
            if suggested:
                card_gap = suggested
        print(f"  Auto card-gap: {card_gap}ms")

    # Group into cards
    cards_raw = group_into_cards(segments, card_gap_ms=card_gap, first_lang=args.first_lang)
    orphans = sum(1 for c in cards_raw if not c["target_segments"])
    print(f"  Cards: {len(cards_raw)} ({orphans} orphan{'s' if orphans != 1 else ''})")

    if args.dry_run:
        return {"lesson_id": lesson_id, "status": "dry-run", "cards": len(cards_raw), "orphans": orphans}

    # Export audio
    output_dir = PROJECT_ROOT / "public" / "audio" / lesson_id
    exported = export_cards(
        cards_raw, lesson_id, str(output_dir),
        wo_strategy=args.wo_strategy,
        bitrate=args.bitrate,
    )

    # Transcription (FR only)
    transcriptions = None
    if whisper_model is not None:
        transcriptions = {}
        for item in exported:
            for file_key, lang in [("primary_file", item["primary_lang"]),
                                    ("target_file", item["target_lang"])]:
                filename = item[file_key]
                filepath = str(output_dir / filename)
                if lang != "fr":
                    transcriptions[filename] = "..."
                    continue
                if not os.path.exists(filepath):
                    continue
                print(f"  Whisper: {filename}...", end=" ", flush=True)
                result = whisper_model.transcribe(filepath, fp16=False, language="fr")
                text = result["text"].strip()
                transcriptions[filename] = text
                print(f'"{text}"')

    # Build JSON
    json_cards = build_cards_json(exported, lesson_id, transcriptions)

    json_dir = PROJECT_ROOT / "scripts" / "output"
    os.makedirs(json_dir, exist_ok=True)
    json_path = json_dir / f"lesson_{lesson_id}.json"
    lesson_data = {
        "id": lesson_id,
        "title": f"Leçon : {lesson_id}",
        "description": "TODO",
        "cards": json_cards,
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(lesson_data, f, ensure_ascii=False, indent=2)

    elapsed = time.time() - t0
    print(f"  Done in {elapsed:.1f}s → {len(json_cards)} cards, JSON: {json_path}")
    return {"lesson_id": lesson_id, "status": "ok", "cards": len(json_cards), "orphans": orphans, "elapsed": elapsed}


def main():
    parser = argparse.ArgumentParser(
        description="Batch process N Assimil MP3s into flashcard audio + JSON.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("specs", nargs="*", help="'file.mp3:lesson_id' pairs, or MP3 files if --auto-ids")
    parser.add_argument("--list", metavar="FILE", help="Batch file with 'filename lesson_id' lines")
    parser.add_argument("--auto-ids", action="store_true", help="Derive lesson IDs from filenames")

    parser.add_argument("--transcribe", action="store_true", help="Run Whisper on FR segments")
    parser.add_argument("--whisper-model", default="small", choices=["tiny", "base", "small"])
    parser.add_argument("--wo-strategy", default="last", choices=["last", "first", "longest", "all"])
    parser.add_argument("--auto-card-gap", action="store_true")
    parser.add_argument("--card-gap", type=int, default=1200)
    parser.add_argument("--skip-intro", type=int, default=0)
    parser.add_argument("--auto-skip-intro", action="store_true")
    parser.add_argument("--first-lang", default="fr", choices=["fr", "wo"])
    parser.add_argument("--silence-thresh", type=int, default=-40)
    parser.add_argument("--min-silence", type=int, default=500)
    parser.add_argument("--padding", type=int, default=150)
    parser.add_argument("--min-segment-len", type=int, default=300)
    parser.add_argument("--bitrate", default="128k")
    parser.add_argument("--vad-threshold", type=float, default=0.5)
    parser.add_argument("--no-vad", action="store_true")
    parser.add_argument("--dry-run", action="store_true")

    args = parser.parse_args()

    # Build job list
    jobs = []
    if args.list:
        jobs = load_jobs_from_file(args.list)
    elif args.auto_ids:
        jobs = auto_ids_from_filenames(args.specs)
    else:
        for spec in args.specs:
            jobs.append(parse_job(spec))

    if not jobs:
        parser.print_help()
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f"  BATCH: {len(jobs)} lesson(s) to process")
    for f, lid in jobs:
        print(f"    {Path(f).name} → {lid}")
    print(f"{'='*60}\n")

    # Load VAD model once
    vad_model = None
    if _SILERO_OK and not args.no_vad:
        print("Loading Silero VAD model...")
        from silero_vad import load_silero_vad
        vad_model = load_silero_vad()
        print("  VAD ready.")

    # Load Whisper model once (after VAD to manage RAM)
    whisper_model_obj = None
    if args.transcribe and not args.dry_run:
        # Free VAD first to make room for Whisper
        if vad_model is not None:
            print("\nFreeing VAD model before loading Whisper...")
            del vad_model
            gc.collect()
            vad_model = None

        print(f"Loading Whisper '{args.whisper_model}' model...")
        try:
            import whisper
            whisper_model_obj = whisper.load_model(args.whisper_model, device="cpu")
            print("  Whisper ready.")
        except ImportError:
            print("  Whisper not installed. Skipping transcription.")

    # Process each lesson
    t_total = time.time()
    results = []
    for i, (input_file, lesson_id) in enumerate(jobs):
        print(f"\n[{i+1}/{len(jobs)}]", end="")
        if not os.path.exists(input_file):
            print(f"  File not found: {input_file}")
            results.append({"lesson_id": lesson_id, "status": "error", "error": "file not found"})
            continue
        result = process_lesson(input_file, lesson_id, args, vad_model=vad_model, whisper_model=whisper_model_obj)
        results.append(result)

    # Summary
    elapsed_total = time.time() - t_total
    print(f"\n{'='*60}")
    print(f"  BATCH COMPLETE — {elapsed_total:.1f}s total")
    print(f"{'='*60}")
    ok = [r for r in results if r["status"] == "ok"]
    errors = [r for r in results if r["status"] == "error"]
    print(f"  ✓  {len(ok)} lesson(s) processed")
    if errors:
        print(f"  ✗  {len(errors)} error(s):")
        for r in errors:
            print(f"       {r['lesson_id']}: {r.get('error', '?')}")
    for r in ok:
        orphan_note = f" ({r['orphans']} orphans ⚠)" if r.get("orphans") else ""
        print(f"  {r['lesson_id']}: {r['cards']} cards{orphan_note}  [{r.get('elapsed', 0):.1f}s]")
    print()


if __name__ == "__main__":
    main()
