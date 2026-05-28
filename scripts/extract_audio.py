#!/usr/bin/env python3
"""
extract_audio.py - Decoupe un fichier audio Assimil en segments individuels FR/WO.

Usage:
    python3 extract_audio.py INPUT_FILE LESSON_ID [OPTIONS]

Exemple:
    python3 extract_audio.py lecon1.mp3 salutations
    python3 extract_audio.py lecon1.mp3 salutations --first-lang fr --silence-thresh -35 --min-silence 600
    python3 extract_audio.py lecon1.mp3 salutations --transcribe

Output:
    public/audio/{lesson_id}/00_fr.mp3, 01_wo.mp3, 02_fr.mp3, ...
    scripts/output/lesson_{lesson_id}.json
"""

import argparse
import json
import os
import sys
from pathlib import Path

from pydub import AudioSegment
from pydub.silence import detect_nonsilent


# ============================================================
# 1. SILENCE DETECTION & SPLITTING
# ============================================================

def load_audio(input_path: str) -> AudioSegment:
    """Load any audio file (mp3, m4a, wav, ogg, flac)."""
    ext = Path(input_path).suffix.lower().lstrip(".")
    if ext == "m4a":
        ext = "mp4"
    return AudioSegment.from_file(input_path, format=ext)


def split_by_silence(
    audio: AudioSegment,
    min_silence_len: int = 700,
    silence_thresh: int = -40,
    padding: int = 150,
    min_segment_len: int = 300,
) -> list[AudioSegment]:
    """
    Detect non-silent ranges and extract segments.

    Args:
        min_silence_len: Minimum silence duration (ms) to count as a split point.
        silence_thresh:  dBFS threshold below which audio is "silent".
        padding:         Extra ms to keep on each side of a segment.
        min_segment_len: Discard segments shorter than this (ms). Avoids noise blips.
    """
    ranges = detect_nonsilent(
        audio,
        min_silence_len=min_silence_len,
        silence_thresh=silence_thresh,
        seek_step=10,
    )

    segments = []
    for start, end in ranges:
        # Add padding but clamp to audio bounds
        s = max(0, start - padding)
        e = min(len(audio), end + padding)
        seg = audio[s:e]
        if len(seg) >= min_segment_len:
            segments.append(seg)

    return segments


# ============================================================
# 2. LABELLING (FR / WO alternation)
# ============================================================

def label_segments(segments: list, first_lang: str = "fr") -> list[dict]:
    """
    Label segments by strict alternation: fr, wo, fr, wo, ...
    Assimil pattern: French translation first, then Wolof phrase.

    Returns list of {index, lang, segment}.
    """
    langs = ["fr", "wo"] if first_lang == "fr" else ["wo", "fr"]
    labelled = []
    for i, seg in enumerate(segments):
        labelled.append({
            "index": i,
            "lang": langs[i % 2],
            "segment": seg,
        })
    return labelled


# ============================================================
# 3. EXPORT
# ============================================================

def export_segments(
    labelled: list[dict],
    lesson_id: str,
    output_dir: str,
    bitrate: str = "128k",
) -> list[dict]:
    """
    Export each segment as MP3 into output_dir.
    Naming: 00_fr.mp3, 01_wo.mp3, 02_fr.mp3, 03_wo.mp3, ...

    Returns metadata list for JSON generation.
    """
    os.makedirs(output_dir, exist_ok=True)
    exported = []

    for item in labelled:
        idx = item["index"]
        lang = item["lang"]
        filename = f"{idx:02d}_{lang}.mp3"
        filepath = os.path.join(output_dir, filename)

        item["segment"].export(filepath, format="mp3", bitrate=bitrate)
        exported.append({
            "index": idx,
            "lang": lang,
            "filename": filename,
            "filepath": filepath,
            "duration_ms": len(item["segment"]),
        })
        print(f"  Exported: {filename} ({len(item['segment'])}ms)")

    return exported


def build_cards_json(
    exported: list[dict],
    lesson_id: str,
    transcriptions: dict | None = None,
) -> list[dict]:
    """
    Build card objects from exported segments.
    Pairs consecutive FR+WO segments into cards.
    """
    cards = []
    # Group by pairs: (fr, wo), (fr, wo), ...
    fr_segments = [e for e in exported if e["lang"] == "fr"]
    wo_segments = [e for e in exported if e["lang"] == "wo"]

    n_cards = min(len(fr_segments), len(wo_segments))
    if len(fr_segments) != len(wo_segments):
        print(f"  Warning: {len(fr_segments)} FR vs {len(wo_segments)} WO segments. Using {n_cards} pairs.")

    for i in range(n_cards):
        fr = fr_segments[i]
        wo = wo_segments[i]

        fr_text = "TODO"
        wo_text = "TODO"
        if transcriptions:
            fr_text = transcriptions.get(fr["filename"], "TODO")
            wo_text = transcriptions.get(wo["filename"], "TODO")

        cards.append({
            "id": f"{lesson_id}_{i+1:02d}",
            "lessonId": lesson_id,
            "position": i + 1,
            "wo": wo_text,
            "fr": fr_text,
            "audioWo": f"/audio/{lesson_id}/{wo['filename']}",
            "audioFr": f"/audio/{lesson_id}/{fr['filename']}",
        })

    return cards


# ============================================================
# 4. TRANSCRIPTION (optional, via Whisper)
# ============================================================

def transcribe_segments(exported: list[dict], model_size: str = "base") -> dict:
    """
    Transcribe each segment using local Whisper (CPU).
    Returns {filename: transcription_text}.

    Model sizes (CPU-friendly): tiny, base, small
    - tiny:  ~1GB RAM, fastest, decent for FR, weak for WO
    - base:  ~1.5GB RAM, good balance
    - small: ~2.5GB RAM, best accuracy on CPU
    """
    try:
        import whisper
    except ImportError:
        print("  Whisper not installed. Run: pip install openai-whisper")
        print("  Skipping transcription.")
        return {}

    print(f"\n  Loading Whisper model '{model_size}' (CPU)...")
    model = whisper.load_model(model_size, device="cpu")
    transcriptions = {}

    for item in exported:
        filepath = item["filepath"]
        lang_hint = "fr" if item["lang"] == "fr" else None  # No hint for Wolof (unsupported)

        print(f"  Transcribing {item['filename']}...", end=" ", flush=True)
        opts = {"fp16": False}  # CPU mode
        if lang_hint:
            opts["language"] = lang_hint

        result = model.transcribe(filepath, **opts)
        text = result["text"].strip()
        transcriptions[item["filename"]] = text
        print(f"-> \"{text}\"")

    return transcriptions


# ============================================================
# 5. PREVIEW MODE (dry-run: just detect segments, show stats)
# ============================================================

def preview(audio: AudioSegment, args):
    """Show segment detection results without exporting."""
    segments = split_by_silence(
        audio,
        min_silence_len=args.min_silence,
        silence_thresh=args.silence_thresh,
        padding=args.padding,
        min_segment_len=args.min_segment_len,
    )
    labelled = label_segments(segments, first_lang=args.first_lang)

    print(f"\nDetected {len(segments)} segments:\n")
    print(f"  {'#':>3}  {'Lang':>4}  {'Duration':>10}  {'dBFS':>6}")
    print(f"  {'---':>3}  {'----':>4}  {'--------':>10}  {'----':>6}")
    for item in labelled:
        seg = item["segment"]
        print(f"  {item['index']:3d}  {item['lang']:>4}  {len(seg):7d} ms  {seg.dBFS:6.1f}")

    n_fr = sum(1 for x in labelled if x["lang"] == "fr")
    n_wo = sum(1 for x in labelled if x["lang"] == "wo")
    print(f"\n  Total: {n_fr} FR + {n_wo} WO = {len(segments)} segments")
    if n_fr != n_wo:
        print(f"  !! Mismatch: {n_fr} FR vs {n_wo} WO. Check silence params or manual review needed.")
    else:
        print(f"  -> {min(n_fr, n_wo)} flashcards possible")


# ============================================================
# MAIN
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="Extract Assimil audio into individual FR/WO flashcard segments.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Preview (dry-run, just detect segments):
  python3 extract_audio.py lecon1.mp3 salutations --preview

  # Extract with default params:
  python3 extract_audio.py lecon1.mp3 salutations

  # Adjust silence detection:
  python3 extract_audio.py lecon1.mp3 salutations --silence-thresh -35 --min-silence 500

  # With transcription:
  python3 extract_audio.py lecon1.mp3 salutations --transcribe --whisper-model small
        """,
    )

    parser.add_argument("input", help="Input audio file (mp3, m4a, wav, etc.)")
    parser.add_argument("lesson_id", help="Lesson identifier (e.g., 'salutations')")

    # Silence detection params
    parser.add_argument("--silence-thresh", type=int, default=-40,
                        help="dBFS threshold for silence (default: -40). Raise to -35 if too many segments.")
    parser.add_argument("--min-silence", type=int, default=700,
                        help="Min silence duration in ms to split (default: 700). Lower = more splits.")
    parser.add_argument("--padding", type=int, default=150,
                        help="Extra ms to keep around each segment (default: 150).")
    parser.add_argument("--min-segment-len", type=int, default=300,
                        help="Discard segments shorter than this ms (default: 300).")

    # Language alternation
    parser.add_argument("--first-lang", choices=["fr", "wo"], default="fr",
                        help="Which language comes first in the audio (default: fr).")

    # Output
    parser.add_argument("--output-dir", default=None,
                        help="Output directory (default: public/audio/{lesson_id}).")
    parser.add_argument("--bitrate", default="128k",
                        help="MP3 export bitrate (default: 128k).")

    # Transcription
    parser.add_argument("--transcribe", action="store_true",
                        help="Transcribe segments using local Whisper.")
    parser.add_argument("--whisper-model", default="base", choices=["tiny", "base", "small", "medium"],
                        help="Whisper model size (default: base). Bigger = slower but better.")

    # Modes
    parser.add_argument("--preview", action="store_true",
                        help="Dry-run: detect and show segments without exporting.")

    args = parser.parse_args()

    # Resolve paths
    project_root = Path(__file__).resolve().parent.parent
    input_path = Path(args.input).resolve()

    if not input_path.exists():
        print(f"Error: file not found: {input_path}")
        sys.exit(1)

    if args.output_dir:
        output_dir = Path(args.output_dir).resolve()
    else:
        output_dir = project_root / "public" / "audio" / args.lesson_id

    json_dir = project_root / "scripts" / "output"
    os.makedirs(json_dir, exist_ok=True)
    json_path = json_dir / f"lesson_{args.lesson_id}.json"

    # Load audio
    print(f"Loading: {input_path}")
    audio = load_audio(str(input_path))
    print(f"  Duration: {len(audio) / 1000:.1f}s | Channels: {audio.channels} | Rate: {audio.frame_rate}Hz")

    # Preview mode
    if args.preview:
        preview(audio, args)
        return

    # Split
    print(f"\nSplitting (silence_thresh={args.silence_thresh}dB, min_silence={args.min_silence}ms)...")
    segments = split_by_silence(
        audio,
        min_silence_len=args.min_silence,
        silence_thresh=args.silence_thresh,
        padding=args.padding,
        min_segment_len=args.min_segment_len,
    )
    print(f"  Found {len(segments)} segments")

    if len(segments) == 0:
        print("Error: no segments detected. Try lowering --silence-thresh or --min-silence.")
        sys.exit(1)

    if len(segments) % 2 != 0:
        print(f"  Warning: odd number of segments ({len(segments)}). Last segment will be unpaired.")

    # Label
    labelled = label_segments(segments, first_lang=args.first_lang)

    # Export
    print(f"\nExporting to: {output_dir}")
    exported = export_segments(labelled, args.lesson_id, str(output_dir), bitrate=args.bitrate)

    # Transcription (optional)
    transcriptions = None
    if args.transcribe:
        print("\nTranscribing...")
        transcriptions = transcribe_segments(exported, model_size=args.whisper_model)

    # Build JSON
    cards = build_cards_json(exported, args.lesson_id, transcriptions)

    lesson_data = {
        "id": args.lesson_id,
        "title": f"Lesson: {args.lesson_id}",
        "description": "TODO",
        "cards": cards,
        "meta": {
            "source": str(input_path.name),
            "total_segments": len(segments),
            "params": {
                "silence_thresh": args.silence_thresh,
                "min_silence": args.min_silence,
                "padding": args.padding,
                "first_lang": args.first_lang,
            },
        },
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(lesson_data, f, ensure_ascii=False, indent=2)
    print(f"\nJSON written: {json_path}")

    # Summary
    print(f"\n{'='*50}")
    print(f"DONE: {len(cards)} flashcards ready")
    print(f"  Audio: {output_dir}/")
    print(f"  JSON:  {json_path}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
