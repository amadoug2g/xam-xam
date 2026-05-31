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
    """Convert a card dict (v1 or v2 format) to a JS object string."""
    cid = card['id']
    lid = card['lessonId']
    pos = card['position']

    # Support both old format (fr/wo at root) and new format (variants)
    variants = card.get('variants')
    if not variants:
        variants = [{
            'fr': card.get('fr', ''),
            'wo': card.get('wo', ''),
            'audioFr': card.get('audioFr'),
            'audioWo': card.get('audioWo'),
        }]

    fr_root = escape_js_string(card.get('fr') or variants[0]['fr'])
    wo_root = escape_js_string(card.get('wo') or variants[0]['wo'])

    variant_parts = []
    for v in variants:
        vfr = escape_js_string(v.get('fr', ''))
        vwo = escape_js_string(v.get('wo', ''))
        afr = v.get('audioFr')
        awo = v.get('audioWo')
        afr_js = f"`${{{base_var}}}{afr.lstrip('/')}`" if afr else 'null'
        awo_js = f"`${{{base_var}}}{awo.lstrip('/')}`" if awo else 'null'
        variant_parts.append(
            f"{{ fr: '{vfr}', wo: '{vwo}', audioFr: {afr_js}, audioWo: {awo_js} }}"
        )

    variants_js = ', '.join(variant_parts)
    return (
        f"      {{ id: '{cid}', lessonId: '{lid}', position: {pos}, "
        f"fr: '{fr_root}', wo: '{wo_root}', "
        f"variants: [{variants_js}] }}"
    )

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
