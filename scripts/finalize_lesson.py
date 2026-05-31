#!/usr/bin/env python3
"""
finalize_lesson.py — Finalise une lecon apres le matching UI.

Lit lesson_{id}.json (avec _audio_map), copie les fichiers audio raw
vers public/audio/{id}/ avec les noms finaux, puis nettoie le _audio_map.

Usage:
    python3 scripts/finalize_lesson.py <lesson_id>

Workflow complet:
    python3 scripts/extract_audio.py lecon.mp3 contacts --raw [--transcribe]
    # → scripts/output/contacts_raw/seg_*.mp3 + scripts/output/manifest_contacts.json

    # Ouvrir tools/matcher/index.html dans Chrome
    # Charger manifest + audio → matcher → exporter lesson_contacts.json
    # Deposer lesson_contacts.json dans scripts/output/

    python3 scripts/finalize_lesson.py contacts
    # → copies audio, nettoie JSON

    python3 scripts/merge_to_mock.py
    # → met a jour mock.js
"""
import json
import shutil
import sys
from pathlib import Path


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/finalize_lesson.py <lesson_id>")
        sys.exit(1)

    lesson_id = sys.argv[1]
    root = Path(__file__).resolve().parent.parent
    out_dir = root / "scripts" / "output"
    raw_dir = out_dir / f"{lesson_id}_raw"
    audio_dst = root / "public" / "audio" / lesson_id
    json_path = out_dir / f"lesson_{lesson_id}.json"

    if not json_path.exists():
        print(f"Erreur: {json_path} introuvable.")
        print(f"Deposer le fichier exporte par le Matcher dans scripts/output/")
        sys.exit(1)

    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    audio_map = data.pop("_audio_map", [])
    if not audio_map:
        print("Pas de _audio_map dans le JSON — rien a copier.")
        print("(deja finalise, ou exporte sans le Matcher)")
        return

    if not raw_dir.exists():
        print(f"Erreur: dossier raw introuvable: {raw_dir}")
        sys.exit(1)

    audio_dst.mkdir(parents=True, exist_ok=True)

    ok, missing = 0, []
    for entry in audio_map:
        src = raw_dir / entry["from"]
        dst = audio_dst / entry["to"]
        if src.exists():
            shutil.copy2(src, dst)
            print(f"  + {entry['from']} → public/audio/{lesson_id}/{entry['to']}")
            ok += 1
        else:
            print(f"  ! MANQUANT: {entry['from']}")
            missing.append(entry["from"])

    # Save JSON without _audio_map
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*50}")
    print(f"  {ok}/{len(audio_map)} fichiers copies vers public/audio/{lesson_id}/")
    print(f"  lesson_{lesson_id}.json sauvegarde (sans _audio_map)")
    if missing:
        print(f"  MANQUANTS ({len(missing)}): {missing}")
    print(f"\nProchaine etape:")
    print(f"  python3 scripts/merge_to_mock.py")
    print(f"  (verifier que '{lesson_id}' est dans STUB_LESSONS ou existe deja dans mock.js)")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
