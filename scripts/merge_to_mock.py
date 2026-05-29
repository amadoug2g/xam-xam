#!/usr/bin/env python3
"""
Phase 3: Merge translated lesson JSONs into mock.js
Replaces stub entries (cards: []) with populated cards.
"""
import json
import os
import re

MOCK_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'mock.js')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'output')

STUB_LESSONS = [
    'ville', 'musees', 'poste', 'telephone', 'internet', 'administration', 'banque',
    'spectacles', 'coiffeur', 'campagne', 'camping', 'animaux', 'hebergement',
    'restaurant', 'mets', 'alcool', 'boissons', 'magasins', 'vetements', 'tabac',
    'photo', 'provisions', 'souvenirs', 'rdv-pro', 'sante', 'lecon51', 'lecon52'
]

def escape_js_string(s):
    """Escape a string for JS single-quoted string."""
    s = s.replace("\\", "\\\\")
    s = s.replace("'", "\\'")
    return s

def card_to_js(card, base_var='BASE'):
    """Convert a card dict to a JS object string."""
    cid = card['id']
    lid = card['lessonId']
    pos = card['position']
    wo = escape_js_string(card['wo'])
    fr = escape_js_string(card['fr'])
    awo = card['audioWo']  # e.g. /audio/ville/01_wo.mp3
    afr = card['audioFr']  # e.g. /audio/ville/00_fr.mp3 or null

    awo_js = f"`${{{base_var}}}{awo.lstrip('/')}`" if awo else 'null'
    afr_js = f"`${{{base_var}}}{afr.lstrip('/')}`" if afr else 'null'

    return f"      {{ id: '{cid}', lessonId: '{lid}', position: {pos}, wo: '{wo}', fr: '{fr}', audioWo: {awo_js}, audioFr: {afr_js} }}"

def main():
    with open(MOCK_PATH, 'r') as f:
        content = f.read()

    for lid in STUB_LESSONS:
        # Load the translated JSON
        json_path = os.path.join(OUTPUT_DIR, f'lesson_{lid}.json')
        with open(json_path, 'r') as f:
            data = json.load(f)

        # Build the cards JS block
        card_lines = []
        for card in data['cards']:
            card_lines.append(card_to_js(card))
        cards_js = ",\n".join(card_lines)

        # Find and replace the stub line: { id: 'xxx', ... cards: [] }
        # The pattern matches the full stub line
        pattern = rf"(\{{[^}}]*?id:\s*'{re.escape(lid)}'[^}}]*?cards:\s*)\[\](\s*\}})"

        replacement = f"\\1[\n{cards_js},\n    ]\\2"

        new_content = re.sub(pattern, replacement, content)

        if new_content == content:
            print(f"  WARNING: No stub found for '{lid}' — skipping")
        else:
            content = new_content
            print(f"  {lid}: {len(data['cards'])} cards merged")

    with open(MOCK_PATH, 'w') as f:
        f.write(content)

    print("\nDone. mock.js updated.")

if __name__ == '__main__':
    main()
