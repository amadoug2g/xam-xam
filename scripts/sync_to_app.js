#!/usr/bin/env node
/**
 * Lit scripts/output/lesson_*.json et :
 *   1. génère src/data/imported.js (seed pour l'app)
 *   2. met à jour done: true/false dans tools/matcher/index.html
 * Lancer après chaque export depuis le Matcher :
 *   node scripts/sync_to_app.js
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outputDir = join(__dirname, 'output')
const importedFile = join(__dirname, '..', 'src', 'data', 'imported.js')
const matcherFile = join(__dirname, '..', 'tools', 'matcher', 'index.html')

// ── 1. Lire les JSONs exportés ──────────────────────────────────────────────
const files = readdirSync(outputDir)
  .filter(f => f.startsWith('lesson_') && f.endsWith('.json'))
  .sort()

const imported = {}
const doneIds = new Set()

for (const f of files) {
  try {
    const data = JSON.parse(readFileSync(join(outputDir, f), 'utf8'))
    if (data.id && Array.isArray(data.cards) && data.cards.length > 0) {
      imported[data.id] = data.cards
      doneIds.add(data.id)
    }
  } catch (e) {
    console.warn(`  Skipped ${f}: ${e.message}`)
  }
}

// ── 2. Écrire src/data/imported.js ─────────────────────────────────────────
const ids = Object.keys(imported)
const content = `// Auto-généré par scripts/sync_to_app.js — ne pas éditer manuellement
// ${ids.length} leçon(s) : ${ids.join(', ')}
export const IMPORTED = ${JSON.stringify(imported, null, 2)}
`
writeFileSync(importedFile, content)
console.log(`✓ ${ids.length} leçon(s) → src/data/imported.js`)

// ── 3. Mettre à jour done: dans tools/matcher/index.html ───────────────────
let html = readFileSync(matcherFile, 'utf8')

html = html.replace(
  /\{ track: (\d+),\s+id: '([^']+)',([^}]+?)done: (true|false)\s*\}/g,
  (match, track, id, rest, _prev) => {
    const isDone = doneIds.has(id)
    return `{ track: ${track}, id: '${id}',${rest}done: ${isDone}  }`
  }
)

writeFileSync(matcherFile, html)
console.log(`✓ Matcher mis à jour — ${doneIds.size} leçon(s) marquées "Faite"`)
console.log(`  ${[...doneIds].join(', ')}`)
