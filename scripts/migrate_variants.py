#!/usr/bin/env python3
"""
migrate_variants.py — Migre les lesson_*.json du format v1 vers v2 (variants).

Usage:
    python3 scripts/migrate_variants.py           # migre tous les JSON dans scripts/output/
    python3 scripts/migrate_variants.py mets      # migre un seul lesson
"""
import json
import sys
from pathlib import Path


def migrate_card(card: dict) -> dict:
    if 'variants' in card:
        return card  # deja en v2
    variant = {
        'fr': card.get('fr', ''),
        'wo': card.get('wo', ''),
        'audioFr': card.get('audioFr'),
        'audioWo': card.get('audioWo'),
    }
    return {
        'id': card['id'],
        'lessonId': card['lessonId'],
        'position': card['position'],
        'fr': card.get('fr', ''),
        'wo': card.get('wo', ''),
        'variants': [variant],
    }


def migrate_file(json_path: Path) -> int:
    with open(json_path, encoding='utf-8') as f:
        data = json.load(f)

    changed = 0
    new_cards = []
    for card in data.get('cards', []):
        migrated = migrate_card(card)
        if migrated is not card:
            changed += 1
        new_cards.append(migrated)

    if changed > 0:
        data['cards'] = new_cards
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  {json_path.name}: {changed} cartes migrées")
    else:
        print(f"  {json_path.name}: déjà en v2, rien à faire")

    return changed


def main():
    root = Path(__file__).resolve().parent.parent
    output_dir = root / 'scripts' / 'output'

    if len(sys.argv) > 1:
        lesson_id = sys.argv[1]
        path = output_dir / f'lesson_{lesson_id}.json'
        if not path.exists():
            print(f"Erreur: {path} introuvable")
            sys.exit(1)
        migrate_file(path)
    else:
        json_files = sorted(output_dir.glob('lesson_*.json'))
        if not json_files:
            print("Aucun fichier lesson_*.json trouvé dans scripts/output/")
            sys.exit(0)
        total = 0
        for p in json_files:
            total += migrate_file(p)
        print(f"\nTotal: {total} cartes migrées dans {len(json_files)} fichiers")

    print("\nProchaine étape: python3 scripts/merge_to_mock.py")


if __name__ == '__main__':
    main()
