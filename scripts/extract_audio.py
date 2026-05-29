#!/usr/bin/env python3
"""
extract_audio.py - Decoupe un fichier audio Assimil en cartes FR/WO.

Gere le pattern reel Assimil:
  - 1 segment FR suivi de 1..N segments WO (repetitions pedagogiques)
  - Silences variables (court intra-carte, long inter-carte)
  - Intro musicale optionnelle a ignorer
  - Voix differentes FR / WO

Algorithme:
  1. Detecter tous les segments non-silencieux (pydub)
  2. Calculer les silences ENTRE segments consecutifs
  3. Classifier les silences: court (intra-carte) vs long (inter-carte)
     via un seuil configurable (--card-gap)
  4. Regrouper les segments en "cartes brutes" (groupes separes par longs silences)
  5. Dans chaque carte brute: le 1er segment = langue primaire (FR par defaut),
     les suivants = langue cible (WO). Les repetitions WO sont gerees.
  6. Exporter: 1 fichier FR + 1 fichier WO (derniere repetition par defaut,
     ou toutes concatenees, ou la premiere) par carte.

Usage:
    python3 extract_audio.py INPUT_FILE LESSON_ID [OPTIONS]

Exemples:
    python3 extract_audio.py lecon1.mp3 salutations --preview
    python3 extract_audio.py lecon1.mp3 salutations --card-gap 1200
    python3 extract_audio.py lecon1.mp3 salutations --skip-intro 5000
    python3 extract_audio.py lecon1.mp3 salutations --wo-strategy all
    python3 extract_audio.py lecon1.mp3 salutations --transcribe
"""

import argparse
import json
import os
import sys
from pathlib import Path

from pydub import AudioSegment
from pydub.silence import detect_nonsilent

try:
    import numpy as np
    from sklearn.cluster import KMeans
    _SKLEARN_OK = True
except ImportError:
    _SKLEARN_OK = False

try:
    from silero_vad import load_silero_vad, get_speech_timestamps, read_audio
    _SILERO_OK = True
except ImportError:
    _SILERO_OK = False


# ============================================================
# 1. AUDIO LOADING
# ============================================================

def load_audio(input_path: str) -> AudioSegment:
    """Load any audio file (mp3, m4a, wav, ogg, flac)."""
    ext = Path(input_path).suffix.lower().lstrip(".")
    if ext == "m4a":
        ext = "mp4"
    return AudioSegment.from_file(input_path, format=ext)


# ============================================================
# 2. SEGMENT DETECTION
# ============================================================

def detect_segments(
    audio: AudioSegment,
    min_silence_len: int = 500,
    silence_thresh: int = -40,
    padding: int = 150,
    min_segment_len: int = 300,
) -> list[dict]:
    """
    Detect non-silent segments and return them with timing info.

    Returns list of dicts:
        {start_ms, end_ms, duration_ms, segment: AudioSegment, dbfs: float}
    """
    ranges = detect_nonsilent(
        audio,
        min_silence_len=min_silence_len,
        silence_thresh=silence_thresh,
        seek_step=10,
    )

    segments = []
    for start, end in ranges:
        s = max(0, start - padding)
        e = min(len(audio), end + padding)
        seg = audio[s:e]
        if len(seg) >= min_segment_len:
            segments.append({
                "start_ms": s,
                "end_ms": e,
                "duration_ms": len(seg),
                "segment": seg,
                "dbfs": seg.dBFS,
            })

    return segments


# ============================================================
# 2b. VAD-BASED SEGMENT DETECTION (Silero)
# ============================================================

def detect_segments_vad(
    audio: AudioSegment,
    padding: int = 150,
    min_segment_len: int = 300,
    threshold: float = 0.5,
) -> list[dict]:
    """
    Detect speech segments using Silero VAD (neural, CPU-fast).
    Falls back to pydub silence detection if silero is not installed.

    Returns same format as detect_segments().
    """
    if not _SILERO_OK:
        print("  [VAD] silero-vad not available, falling back to pydub silence detection")
        return detect_segments(audio, padding=padding, min_segment_len=min_segment_len)

    import torch
    import tempfile

    # Silero requires 16kHz mono WAV
    audio_16k = audio.set_frame_rate(16000).set_channels(1)

    # Write to temp WAV (silero read_audio needs a file path)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = tmp.name
    try:
        audio_16k.export(tmp_path, format="wav")
        # Use scipy to load WAV — avoids torchcodec dependency in newer torchaudio
        try:
            from scipy.io import wavfile as scipy_wavfile
            import numpy as _np
            _sr, _data = scipy_wavfile.read(tmp_path)
            if _data.dtype != _np.float32:
                _data = _data.astype(_np.float32) / (_np.iinfo(_data.dtype).max if _np.issubdtype(_data.dtype, _np.integer) else 1.0)
            if _data.ndim > 1:
                _data = _data.mean(axis=1)
            import torch as _torch
            wav = _torch.FloatTensor(_data)
        except Exception:
            wav = read_audio(tmp_path)
    finally:
        os.unlink(tmp_path)

    model = load_silero_vad()
    speech_ts = get_speech_timestamps(
        wav,
        model,
        threshold=threshold,
        sampling_rate=16000,
        min_speech_duration_ms=min_segment_len,
        min_silence_duration_ms=200,
        return_seconds=False,  # return samples
    )

    segments = []
    for ts in speech_ts:
        start_ms = int(ts["start"] / 16)   # 16000 samples/s → ms
        end_ms   = int(ts["end"]   / 16)
        s = max(0, start_ms - padding)
        e = min(len(audio), end_ms + padding)
        seg = audio[s:e]
        if len(seg) >= min_segment_len:
            segments.append({
                "start_ms": s,
                "end_ms":   e,
                "duration_ms": len(seg),
                "segment": seg,
                "dbfs": seg.dBFS,
            })

    return segments


# ============================================================
# 2c. ADAPTIVE GAP THRESHOLD (k-means)
# ============================================================

def classify_gaps_kmeans(gaps: list[int]) -> int:
    """
    Use k-means (k=2) to find the natural boundary between
    intra-card (short) and inter-card (long) gaps.

    Returns the midpoint between the two cluster centers.
    Falls back to the heuristic if sklearn is not available or
    no clear bimodal split is found.
    """
    if not _SKLEARN_OK or len(gaps) < 4:
        return suggest_card_gap(gaps) or 1200

    X = np.array(gaps).reshape(-1, 1)
    km = KMeans(n_clusters=2, n_init=10, random_state=0).fit(X)
    centers = sorted(km.cluster_centers_.flatten())

    # If the two clusters are too close together, no clear split
    if centers[1] - centers[0] < 200:
        return suggest_card_gap(gaps) or 1200

    midpoint = int((centers[0] + centers[1]) / 2)
    print(f"  [k-means] Gap clusters: {int(centers[0])}ms / {int(centers[1])}ms → threshold: {midpoint}ms")
    return midpoint


# ============================================================
# 3. INTRO DETECTION & SKIP
# ============================================================

def skip_intro(segments: list[dict], skip_ms: int) -> list[dict]:
    """
    Remove segments that start before skip_ms.
    Use this to skip musical intros or jingles.
    """
    if skip_ms <= 0:
        return segments
    filtered = [s for s in segments if s["start_ms"] >= skip_ms]
    n_skipped = len(segments) - len(filtered)
    if n_skipped > 0:
        print(f"  Intro skip: removed {n_skipped} segment(s) before {skip_ms}ms")
    return filtered


def detect_intro_auto(segments: list[dict], max_intro_ms: int = 10000) -> int:
    """
    Heuristic: detect intro by finding the first long silence gap
    in the first max_intro_ms of audio.

    Looks for a gap > 2s in the first 10s. If found, skip everything before it.
    Returns the skip point in ms, or 0 if no intro detected.
    """
    if len(segments) < 2:
        return 0

    for i in range(len(segments) - 1):
        seg = segments[i]
        next_seg = segments[i + 1]
        if seg["start_ms"] > max_intro_ms:
            break
        gap = next_seg["start_ms"] - seg["end_ms"]
        # A gap > 2s after a segment in the first 10s = likely intro boundary
        if gap > 2000:
            skip_point = next_seg["start_ms"]
            print(f"  Auto-detected intro end at {skip_point}ms (gap of {gap}ms)")
            return skip_point

    return 0


# ============================================================
# 4. GROUPING: segments -> cards
# ============================================================

def compute_gaps(segments: list[dict]) -> list[int]:
    """
    Compute silence gaps between consecutive segments.
    Returns list of gap durations in ms (length = len(segments) - 1).
    """
    gaps = []
    for i in range(len(segments) - 1):
        gap = segments[i + 1]["start_ms"] - segments[i]["end_ms"]
        gaps.append(max(0, gap))
    return gaps


def group_into_cards(
    segments: list[dict],
    card_gap_ms: int = 1200,
    first_lang: str = "fr",
) -> list[dict]:
    """
    Group segments into cards using silence gaps.

    Logic:
      - Gaps >= card_gap_ms mark boundaries between cards.
      - Within a card, the first segment is the primary language (first_lang),
        all remaining segments are the target language (repetitions).

    Returns list of card dicts:
        {
            card_index: int,
            primary_lang: str,       # "fr" or "wo"
            target_lang: str,        # "wo" or "fr"
            primary_segment: dict,   # the single primary-lang segment
            target_segments: [dict], # 1..N target-lang segments (repetitions)
        }
    """
    if not segments:
        return []

    target_lang = "wo" if first_lang == "fr" else "fr"
    gaps = compute_gaps(segments)

    # Build groups: split wherever gap >= card_gap_ms
    groups = []
    current_group = [segments[0]]

    for i, gap in enumerate(gaps):
        if gap >= card_gap_ms:
            groups.append(current_group)
            current_group = [segments[i + 1]]
        else:
            current_group.append(segments[i + 1])

    if current_group:
        groups.append(current_group)

    # Convert groups to cards
    cards = []
    for idx, group in enumerate(groups):
        if len(group) == 0:
            continue

        primary_seg = group[0]
        target_segs = group[1:] if len(group) > 1 else []

        cards.append({
            "card_index": idx,
            "primary_lang": first_lang,
            "target_lang": target_lang,
            "primary_segment": primary_seg,
            "target_segments": target_segs,
            "group_size": len(group),
        })

    return cards


# ============================================================
# 5. WO REPETITION STRATEGY
# ============================================================

def resolve_target_audio(
    target_segments: list[dict],
    strategy: str = "last",
    crossfade: int = 50,
) -> AudioSegment | None:
    """
    From N target-lang repetitions, produce 1 AudioSegment.

    Strategies:
      - "last":  keep only the last repetition (cleanest pronunciation)
      - "first": keep only the first repetition
      - "all":   concatenate all repetitions with short crossfade
      - "longest": keep the longest repetition
    """
    if not target_segments:
        return None

    if strategy == "last":
        return target_segments[-1]["segment"]
    elif strategy == "first":
        return target_segments[0]["segment"]
    elif strategy == "longest":
        return max(target_segments, key=lambda s: s["duration_ms"])["segment"]
    elif strategy == "all":
        combined = target_segments[0]["segment"]
        for seg in target_segments[1:]:
            if crossfade > 0 and len(combined) > crossfade and len(seg["segment"]) > crossfade:
                combined = combined.append(seg["segment"], crossfade=crossfade)
            else:
                combined = combined + seg["segment"]
        return combined
    else:
        raise ValueError(f"Unknown WO strategy: {strategy}")


# ============================================================
# 6. EXPORT
# ============================================================

def export_cards(
    cards: list[dict],
    lesson_id: str,
    output_dir: str,
    wo_strategy: str = "last",
    bitrate: str = "128k",
) -> list[dict]:
    """
    Export each card's FR + WO audio as MP3 files.

    Naming convention matches mock.js:
      Card 1: 00_fr.mp3, 01_wo.mp3
      Card 2: 02_fr.mp3, 03_wo.mp3
      ...

    Returns metadata list for JSON generation.
    """
    os.makedirs(output_dir, exist_ok=True)
    exported = []
    file_idx = 0

    for card in cards:
        primary_lang = card["primary_lang"]
        target_lang = card["target_lang"]

        # Primary (FR) segment
        primary_filename = f"{file_idx:02d}_{primary_lang}.mp3"
        primary_path = os.path.join(output_dir, primary_filename)
        card["primary_segment"]["segment"].export(primary_path, format="mp3", bitrate=bitrate)
        primary_duration = card["primary_segment"]["duration_ms"]
        print(f"  Exported: {primary_filename} ({primary_duration}ms)")
        file_idx += 1

        # Target (WO) segment - resolved from repetitions
        target_audio = resolve_target_audio(card["target_segments"], strategy=wo_strategy)
        target_filename = f"{file_idx:02d}_{target_lang}.mp3"
        target_path = os.path.join(output_dir, target_filename)

        if target_audio:
            target_audio.export(target_path, format="mp3", bitrate=bitrate)
            target_duration = len(target_audio)
            n_reps = len(card["target_segments"])
            rep_info = f" [{n_reps} rep(s), strategy={wo_strategy}]" if n_reps > 1 else ""
            print(f"  Exported: {target_filename} ({target_duration}ms){rep_info}")
        else:
            # Card with no target segment (orphan primary) - export silence placeholder
            silence = AudioSegment.silent(duration=500)
            silence.export(target_path, format="mp3", bitrate=bitrate)
            target_duration = 500
            print(f"  Exported: {target_filename} (EMPTY - no target segment found)")
        file_idx += 1

        exported.append({
            "card_index": card["card_index"],
            "primary_lang": primary_lang,
            "target_lang": target_lang,
            "primary_file": primary_filename,
            "target_file": target_filename,
            "primary_duration_ms": primary_duration,
            "target_duration_ms": target_duration,
            "n_repetitions": len(card["target_segments"]),
        })

    return exported


def build_cards_json(
    exported: list[dict],
    lesson_id: str,
    transcriptions: dict | None = None,
) -> list[dict]:
    """
    Build card objects matching mock.js structure:
      { id, lessonId, position, wo, fr, audioWo, audioFr }
    """
    cards = []
    for item in exported:
        pos = item["card_index"] + 1

        fr_text = "TODO"
        wo_text = "TODO"

        primary_lang = item["primary_lang"]
        target_lang = item["target_lang"]

        if transcriptions:
            if primary_lang == "fr":
                fr_text = transcriptions.get(item["primary_file"], "TODO")
                wo_text = transcriptions.get(item["target_file"], "TODO")
            else:
                wo_text = transcriptions.get(item["primary_file"], "TODO")
                fr_text = transcriptions.get(item["target_file"], "TODO")

        # Map to audioFr / audioWo regardless of which is primary
        if primary_lang == "fr":
            audio_fr = f"/audio/{lesson_id}/{item['primary_file']}"
            audio_wo = f"/audio/{lesson_id}/{item['target_file']}"
        else:
            audio_wo = f"/audio/{lesson_id}/{item['primary_file']}"
            audio_fr = f"/audio/{lesson_id}/{item['target_file']}"

        cards.append({
            "id": f"{lesson_id}_{pos:02d}",
            "lessonId": lesson_id,
            "position": pos,
            "wo": wo_text,
            "fr": fr_text,
            "audioWo": audio_wo,
            "audioFr": audio_fr,
        })

    return cards


# ============================================================
# 7. TRANSCRIPTION (optional, via Whisper)
# ============================================================

def transcribe_segments(exported: list[dict], output_dir: str, model_size: str = "base") -> dict:
    """
    Transcribe exported audio files using local Whisper (CPU).
    Returns {filename: transcription_text}.
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
        for file_key, lang in [("primary_file", item["primary_lang"]),
                                ("target_file", item["target_lang"])]:
            filename = item[file_key]
            filepath = os.path.join(output_dir, filename)

            # Skip WO segments — Whisper hallucinate on Wolof
            if lang != "fr":
                transcriptions[filename] = "..."
                continue

            if not os.path.exists(filepath):
                continue

            print(f"  Transcribing {filename}...", end=" ", flush=True)
            result = model.transcribe(filepath, fp16=False, language="fr")
            text = result["text"].strip()
            transcriptions[filename] = text
            print(f'-> "{text}"')

    return transcriptions


# ============================================================
# 8. PREVIEW MODE
# ============================================================

def preview(audio: AudioSegment, args):
    """Show segment detection and card grouping without exporting."""
    segments = detect_segments(
        audio,
        min_silence_len=args.min_silence,
        silence_thresh=args.silence_thresh,
        padding=args.padding,
        min_segment_len=args.min_segment_len,
    )

    if args.skip_intro > 0:
        segments = skip_intro(segments, args.skip_intro)
    elif args.auto_skip_intro:
        skip_point = detect_intro_auto(segments)
        if skip_point > 0:
            segments = skip_intro(segments, skip_point)

    if not segments:
        print("\nNo segments detected. Try adjusting --silence-thresh or --min-silence.")
        return

    # Show raw segments
    print(f"\n{'='*70}")
    print(f"RAW SEGMENTS: {len(segments)} detected")
    print(f"{'='*70}")
    print(f"  {'#':>3}  {'Start':>8}  {'End':>8}  {'Duration':>10}  {'dBFS':>6}")
    print(f"  {'---':>3}  {'-----':>8}  {'---':>8}  {'--------':>10}  {'----':>6}")
    for i, seg in enumerate(segments):
        print(f"  {i:3d}  {seg['start_ms']:7d}ms  {seg['end_ms']:7d}ms  {seg['duration_ms']:7d}ms  {seg['dbfs']:6.1f}")

    # Show gaps
    gaps = compute_gaps(segments)
    if gaps:
        print(f"\n  Gap stats: min={min(gaps)}ms  max={max(gaps)}ms  "
              f"mean={sum(gaps)//len(gaps)}ms  median={sorted(gaps)[len(gaps)//2]}ms")
        print(f"  Card gap threshold: {args.card_gap}ms")

        # Histogram-style gap distribution
        short = sum(1 for g in gaps if g < args.card_gap)
        long = sum(1 for g in gaps if g >= args.card_gap)
        print(f"  Gaps < {args.card_gap}ms (intra-card): {short}")
        print(f"  Gaps >= {args.card_gap}ms (inter-card): {long}")

    # Show card grouping
    cards = group_into_cards(segments, card_gap_ms=args.card_gap, first_lang=args.first_lang)

    print(f"\n{'='*70}")
    print(f"CARD GROUPING: {len(cards)} cards")
    print(f"{'='*70}")
    for card in cards:
        n_target = len(card["target_segments"])
        primary_dur = card["primary_segment"]["duration_ms"]
        target_durs = [s["duration_ms"] for s in card["target_segments"]]
        target_info = ", ".join(f"{d}ms" for d in target_durs) if target_durs else "NONE"

        status = ""
        if n_target == 0:
            status = " [!] NO TARGET SEGMENT"
        elif n_target > 1:
            status = f" [x{n_target} repetitions]"

        print(f"  Card {card['card_index']+1:2d}: "
              f"{card['primary_lang'].upper()} ({primary_dur}ms) + "
              f"{card['target_lang'].upper()} ({target_info}){status}")

    # Summary
    total_with_target = sum(1 for c in cards if c["target_segments"])
    total_without = sum(1 for c in cards if not c["target_segments"])
    total_multi = sum(1 for c in cards if len(c["target_segments"]) > 1)

    print(f"\n  Summary:")
    print(f"    Total cards: {len(cards)}")
    print(f"    Complete (FR+WO): {total_with_target}")
    print(f"    Orphan (no WO): {total_without}")
    print(f"    With repetitions: {total_multi}")
    print(f"    WO strategy (for export): {args.wo_strategy}")

    if total_without > 0:
        print(f"\n  Tip: {total_without} cards have no target segment.")
        print(f"       Try lowering --card-gap (currently {args.card_gap}ms) to merge them,")
        print(f"       or check if the audio has a different structure.")


# ============================================================
# 9. GAP AUTO-DETECT
# ============================================================

def suggest_card_gap(segments: list[dict]) -> int | None:
    """
    Heuristic to suggest a card-gap value.

    Looks for a natural bimodal split in gap durations.
    Returns suggested gap in ms, or None if unclear.
    """
    gaps = compute_gaps(segments)
    if len(gaps) < 3:
        return None

    sorted_gaps = sorted(gaps)

    # Look for the biggest jump in sorted gaps -- that's likely the boundary
    # between intra-card and inter-card silences
    max_jump = 0
    best_idx = 0
    for i in range(len(sorted_gaps) - 1):
        jump = sorted_gaps[i + 1] - sorted_gaps[i]
        if jump > max_jump:
            max_jump = jump
            best_idx = i

    if max_jump < 200:
        # No clear bimodal split
        return None

    # Suggest midpoint between the two clusters
    suggested = (sorted_gaps[best_idx] + sorted_gaps[best_idx + 1]) // 2
    return suggested


# ============================================================
# MAIN
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="Extract Assimil audio into FR/WO flashcard pairs.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Preview (dry-run, show detected cards):
  python3 extract_audio.py lecon1.mp3 salutations --preview

  # Extract with default params:
  python3 extract_audio.py lecon1.mp3 salutations

  # Adjust card gap threshold (longer = fewer cards, more segments per card):
  python3 extract_audio.py lecon1.mp3 salutations --card-gap 1500

  # Skip first 5s of intro music:
  python3 extract_audio.py lecon1.mp3 salutations --skip-intro 5000

  # Auto-detect intro:
  python3 extract_audio.py lecon1.mp3 salutations --auto-skip-intro

  # Keep all WO repetitions concatenated:
  python3 extract_audio.py lecon1.mp3 salutations --wo-strategy all

  # WO is spoken first, then FR:
  python3 extract_audio.py lecon1.mp3 salutations --first-lang wo

  # With Whisper transcription:
  python3 extract_audio.py lecon1.mp3 salutations --transcribe --whisper-model small
        """,
    )

    parser.add_argument("input", help="Input audio file (mp3, m4a, wav, etc.)")
    parser.add_argument("lesson_id", help="Lesson identifier (e.g., 'salutations')")

    # -- Silence detection --
    grp_silence = parser.add_argument_group("Silence detection")
    grp_silence.add_argument("--silence-thresh", type=int, default=-40,
                             help="dBFS threshold for silence (default: -40). Raise to -35 if over-splitting.")
    grp_silence.add_argument("--min-silence", type=int, default=500,
                             help="Min silence duration in ms to count as a split point (default: 500).")
    grp_silence.add_argument("--padding", type=int, default=150,
                             help="Extra ms to keep around each segment (default: 150).")
    grp_silence.add_argument("--min-segment-len", type=int, default=300,
                             help="Discard segments shorter than this ms (default: 300).")

    # -- Card grouping --
    grp_card = parser.add_argument_group("Card grouping")
    grp_card.add_argument("--card-gap", type=int, default=1200,
                          help="Min silence gap (ms) between cards (default: 1200). "
                               "Gaps shorter than this stay within the same card.")
    grp_card.add_argument("--auto-card-gap", action="store_true",
                          help="Auto-detect card gap from gap distribution (overrides --card-gap).")

    # -- Language --
    grp_lang = parser.add_argument_group("Language")
    grp_lang.add_argument("--first-lang", choices=["fr", "wo"], default="fr",
                          help="Which language is spoken first in each card (default: fr).")

    # -- Intro handling --
    grp_intro = parser.add_argument_group("Intro handling")
    grp_intro.add_argument("--skip-intro", type=int, default=0,
                           help="Skip the first N milliseconds of audio (for intros/jingles).")
    grp_intro.add_argument("--auto-skip-intro", action="store_true",
                           help="Auto-detect and skip intro (looks for long gap in first 10s).")

    # -- WO repetitions --
    grp_wo = parser.add_argument_group("WO repetition strategy")
    grp_wo.add_argument("--wo-strategy", choices=["last", "first", "longest", "all"], default="last",
                        help="How to handle multiple WO repetitions (default: last). "
                             "last=cleanest, first=initial, longest=most complete, all=concatenated.")

    # -- Output --
    grp_out = parser.add_argument_group("Output")
    grp_out.add_argument("--output-dir", default=None,
                         help="Output directory (default: public/audio/{lesson_id}).")
    grp_out.add_argument("--bitrate", default="128k",
                         help="MP3 export bitrate (default: 128k).")

    # -- Transcription --
    grp_tr = parser.add_argument_group("Transcription (optional)")
    grp_tr.add_argument("--transcribe", action="store_true",
                        help="Transcribe segments using local Whisper (CPU).")
    grp_tr.add_argument("--whisper-model", default="base",
                        choices=["tiny", "base", "small", "medium"],
                        help="Whisper model size (default: base).")

    # -- VAD --
    grp_vad = parser.add_argument_group("VAD (Silero neural speech detection)")
    grp_vad.add_argument("--vad", action="store_true", default=_SILERO_OK,
                         help="Use Silero VAD instead of pydub silence detection (default: auto, on if installed).")
    grp_vad.add_argument("--no-vad", action="store_true",
                         help="Force pydub silence detection even if Silero is available.")
    grp_vad.add_argument("--vad-threshold", type=float, default=0.5,
                         help="Silero VAD speech probability threshold 0-1 (default: 0.5). "
                              "Lower = more sensitive, higher = fewer false positives.")

    # -- Modes --
    parser.add_argument("--preview", action="store_true",
                        help="Dry-run: detect segments and show card grouping without exporting.")

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

    # Detect segments
    use_vad = args.vad and not args.no_vad and _SILERO_OK
    if use_vad:
        print(f"\nDetecting segments with Silero VAD (threshold={args.vad_threshold})...")
        segments = detect_segments_vad(
            audio,
            padding=args.padding,
            min_segment_len=args.min_segment_len,
            threshold=args.vad_threshold,
        )
    else:
        if args.vad and not _SILERO_OK:
            print("\n  [VAD] silero-vad not installed, using pydub fallback.")
        print(f"\nDetecting segments (silence_thresh={args.silence_thresh}dB, min_silence={args.min_silence}ms)...")
        segments = detect_segments(
            audio,
            min_silence_len=args.min_silence,
            silence_thresh=args.silence_thresh,
            padding=args.padding,
            min_segment_len=args.min_segment_len,
        )
    print(f"  Found {len(segments)} raw segments")

    if not segments:
        print("Error: no segments detected. Try lowering --silence-thresh or --min-silence.")
        sys.exit(1)

    # Intro handling
    if args.skip_intro > 0:
        segments = skip_intro(segments, args.skip_intro)
    elif args.auto_skip_intro:
        skip_point = detect_intro_auto(segments)
        if skip_point > 0:
            segments = skip_intro(segments, skip_point)

    if not segments:
        print("Error: all segments were removed after intro skip.")
        sys.exit(1)

    # Auto card-gap detection
    if args.auto_card_gap:
        gaps = compute_gaps(segments)
        if _SKLEARN_OK and len(gaps) >= 4:
            suggested = classify_gaps_kmeans(gaps)
            print(f"  Auto card-gap (k-means): {suggested}ms")
        else:
            suggested = suggest_card_gap(segments)
            if suggested:
                print(f"  Auto card-gap (heuristic): {suggested}ms")
        if suggested:
            args.card_gap = suggested
        else:
            print(f"  Auto card-gap: no clear split found, using default {args.card_gap}ms")

    # Preview mode
    if args.preview:
        preview(audio, args)
        return

    # Group into cards
    print(f"\nGrouping into cards (card_gap={args.card_gap}ms, first_lang={args.first_lang})...")
    cards = group_into_cards(segments, card_gap_ms=args.card_gap, first_lang=args.first_lang)
    print(f"  Formed {len(cards)} cards")

    for card in cards:
        n = len(card["target_segments"])
        if n > 1:
            print(f"    Card {card['card_index']+1}: {n} WO repetitions -> using '{args.wo_strategy}' strategy")
        elif n == 0:
            print(f"    Card {card['card_index']+1}: WARNING - no target segment")

    # Export
    print(f"\nExporting to: {output_dir}")
    exported = export_cards(
        cards,
        args.lesson_id,
        str(output_dir),
        wo_strategy=args.wo_strategy,
        bitrate=args.bitrate,
    )

    # Transcription (optional)
    transcriptions = None
    if args.transcribe:
        print("\nTranscribing...")
        transcriptions = transcribe_segments(exported, str(output_dir), model_size=args.whisper_model)

    # Build JSON
    json_cards = build_cards_json(exported, args.lesson_id, transcriptions)

    lesson_data = {
        "id": args.lesson_id,
        "title": f"Lesson: {args.lesson_id}",
        "description": "TODO",
        "cards": json_cards,
        "meta": {
            "source": str(input_path.name),
            "total_raw_segments": len(segments),
            "total_cards": len(cards),
            "params": {
                "silence_thresh": args.silence_thresh,
                "min_silence": args.min_silence,
                "padding": args.padding,
                "card_gap": args.card_gap,
                "first_lang": args.first_lang,
                "wo_strategy": args.wo_strategy,
                "skip_intro": args.skip_intro,
            },
        },
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(lesson_data, f, ensure_ascii=False, indent=2)
    print(f"\nJSON written: {json_path}")

    # Summary
    total_reps = sum(e["n_repetitions"] for e in exported if e["n_repetitions"] > 1)
    print(f"\n{'='*50}")
    print(f"DONE: {len(json_cards)} flashcards ready")
    print(f"  Audio: {output_dir}/")
    print(f"  JSON:  {json_path}")
    if total_reps:
        print(f"  WO repetitions handled: {total_reps} (strategy: {args.wo_strategy})")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
