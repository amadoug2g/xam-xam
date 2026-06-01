#!/usr/bin/env node
/**
 * Lit scripts/output/lesson_*.json et génère src/data/imported.js
 * Lancer après chaque export depuis le Matcher :
 *   node scripts/sync_to_app.js
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outputDir = join(__dirname, 'output')
const outFile = join(__dirname, '..', 'src', 'data', 'imported.js')

const files = readdirSync(outputDir)
  .filter(f => f.startsWith('lesson_') && f.endsWith('.json'))
  .sort()

const imported = {}
for (const f of files) {
  try {
    const data = JSON.parse(readFileSync(join(outputDir, f), 'utf8'))
    if (data.id && Array.isArray(data.cards) && data.cards.length > 0) {
      imported[data.id] = data.cards
    }
  } catch (e) {
    console.warn(`  Skipped ${f}: ${e.message}`)
  }
}

const ids = Object.keys(imported)
const content = `// Auto-généré par scripts/sync_to_app.js — ne pas éditer manuellement
// ${ids.length} leçon(s) : ${ids.join(', ')}
export const IMPORTED = ${JSON.stringify(imported, null, 2)}
`

writeFileSync(outFile, content)
console.log(`✓ ${ids.length} leçon(s) importée(s) → src/data/imported.js`)
console.log(`  ${ids.join(', ')}`)
