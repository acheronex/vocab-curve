# Vocab Curve

An interactive vocabulary analysis tool for language learners. Quantifies vocabulary progression as you read, visualizes coverage across texts, and exports frequency-tiered vocabulary lists for Anki.

## Concept

Vocabulary acquisition follows a predictable curve — new texts introduce many new words at first, but as you read more, fewer words are truly new. This tool makes that curve visible, helps you choose what to read next, and tells you exactly which words to study.

## Demo Corpus

The included demo features **10 German literature texts** (~4.3M words total):

| Text | Words | Unique Stems | Sections |
|------|-------|--------------|----------|
| Schopenhauer: Gesammelte Werke | 840,385 | 37,455 | 30 |
| Lutherbibel 1912 | 696,962 | 12,997 | 26 |
| Kafka: Gesammelte Werke | 663,477 | 26,638 | 25 |
| Brüder Grimm: Märchen und Sagen | 484,983 | 21,441 | 23 |
| Freud: Gesammelte Werke | 343,490 | 20,292 | 24 |
| Goethe: Wilhelm Meisters Lehr- und Wanderjahre | 340,463 | 16,911 | 26 |
| Karl May: Orientzyklus | 296,023 | 13,978 | 28 |
| Thomas Mann: Buddenbrooks | 228,153 | 17,053 | 22 |
| Fontane: Effi Briest / Der Stechlin | 220,195 | 15,252 | 28 |
| Kant: Kritik der reinen Vernunft | 173,977 | 6,320 | 35 |

**Total: ~4.3M words, 104,476 cumulative unique stems**

You can analyze any text in any language supported by [simplemma](https://github.com/adbar/simplemma) (German, English, French, Spanish, Italian, Portuguese, Dutch, and 40+ more).

## Quick Start

```bash
npm install
cd web && npm install && cd ..
python3 -m venv .venv && source .venv/bin/activate && pip install simplemma
cd web && npm run dev             # → http://localhost:5173
```

To analyze your own text:

```bash
npx tsx src/cli.ts config-lutherbibel.yaml   # or your own config
npx tsx src/compare.ts                        # cross-text comparison + manifest
cp output/*.json web/public/
```

## Visualization (React dashboard)

**Three main views:**

### 1. Comparison View (up to 5 texts)
- **The Ladder** — waterfall chart of vocabulary accumulation across texts
- **Coverage Matrix** — N×N grid showing how much each text's vocabulary covers another
- **Selected Texts Statistics** — aggregate stats for selected texts
- **Text Overview Cards** — stats, density, core coverage, top words per text
- **Vocabulary Curves Compared** — overlaid growth curves for selected texts
- **Bridge Words** — specific words needed to level up from one text to the next

### 2. Single Text Analysis
- **Flatten the Curve** — filter by frequency threshold (All / 2+ / 6+ / 20+)
- **Vocabulary Curve** — bars (new words/section) + cumulative line; click to explore
- **Word Frequency Distribution** — horizontal bar chart showing frequency tiers
- **Word Explorer** — search any word, see inflected forms, sections, examples
- **Vocabulary metrics** — Sections, Words, Tokens, Unique Stems, Density, Core Coverage

### 3. Corpus Statistics (all texts)
- **Corpus Overview** — total words, unique stems, vocabulary overlap %
- **Vocabulary by Text** — horizontal bar chart sorted by unique stems
- **Vocabulary Density** — horizontal bar chart sorted by Guiraud's Index
- **Difficulty Ranking** — texts sorted by normalized density
- **Most Common Corpus Words** — top 30 words across all texts
- **Sortable Table** — all texts with words, tokens, stems, sections, density, core %

UI supports **English / Russian** toggle.

## Analyzing Your Own Text

1. Format as markdown with `## ` section headers.
2. Create a config file (copy `config-lutherbibel.yaml` as template).
3. Run: `npx tsx src/cli.ts my-config.yaml`

Key config options:
```yaml
input:
  file: "./for-analysis/my-text.md"
  language: de
  label: "My Text Name"
structure:
  split_pattern: "^## Chapter"          # regex to split sections
  title_pattern: "^## Chapter\\s+(\\d+)" # regex to extract section title
  exclude_patterns:                      # skip lines matching these
    - "^<img"
    - "^---"
analysis:
  stemmer: simplemma   # or: snowball (faster, less accurate), none
  min_word_length: 2
  stop_words: true
output:
  path: "./output/my-text.json"
```

## Adding Texts to Comparison View

Adding a new text requires **zero code changes**:

1. Prepare your markdown file in `for-analysis/`
2. Create a config YAML (include a `label` field)
3. Run analysis: `npx tsx src/cli.ts config-new.yaml`
4. Run comparison: `npx tsx src/compare.ts` (auto-discovers all output JSONs)
5. Copy to web: `cp output/*.json web/public/`

`compare.ts` auto-discovers all analysis JSONs in `output/`, sorts the vocabulary ladder by complexity, and generates `manifest.json` which drives the web UI.

## Anki Export

Exports frequency-tiered vocabulary lists as `.txt` files ready for Anki import.

**Frequency tiers:**

| Tier | Description |
|------|-------------|
| 1× (hapax) | Words appearing only once |
| 2–5× (rare) | Less common but useful vocabulary |
| 6–19× (medium) | Important words for fluency |
| 20+× (core) | Essential vocabulary — typically covers ~60% of text |

```bash
# Show statistics only
python3 scripts/anki_export.py output/lutherbibel-1912.json --stats-only

# Export all tiers
python3 scripts/anki_export.py output/lutherbibel-1912.json

# Export a specific tier
python3 scripts/anki_export.py output/lutherbibel-1912.json --tier 20+
```

## How It Works

```
Markdown → Tokenize → simplemma lemmatizer → Frequency analysis → JSON → React dashboard
                                                                        ↘ Anki TSV export
```

[simplemma](https://github.com/adbar/simplemma) is a dictionary-based Python lemmatizer (0.95 accuracy on German). It groups inflected forms correctly — `sagt/sage/sagen/gesagt` → `sagen`, `wäre` → `sein` — and preserves noun capitalization.

## Project Structure

```
├── scripts/
│   ├── lemmatize.py         # simplemma Python bridge
│   └── anki_export.py       # Frequency tier analysis & Anki TSV export
├── src/
│   ├── cli.ts               # Single-text analysis pipeline
│   ├── compare.ts           # Cross-text comparison + manifest generation
│   ├── config.ts            # YAML config loader
│   ├── types.ts             # TypeScript interfaces
│   ├── ingest/markdown.ts   # Markdown parser
│   └── analyze/             # tokenize, stem, frequency, progression
├── web/                     # React + Vite dashboard
│   └── src/
│       ├── components/      # Panel1-4, ComparisonView, CorpusStatsView
│       │   └── comparison/  # PanelA-F (Ladder, Coverage, Stats, Curves, Bridge, Overview)
│       ├── hooks/           # useAnalysisData, useComparisonData, useManifest
│       ├── i18n/            # EN/RU translations
│       └── utils/colors.ts  # Shared color palette
├── for-analysis/            # Input texts (.md)
├── output/                  # Generated analysis JSON + comparison.json + manifest.json
└── config*.yaml             # Per-text analysis configs
```

## Tech Stack

- **Analysis pipeline**: TypeScript + Node.js + Python (simplemma)
- **Visualization**: React 19 + Vite 8 + Recharts + Tailwind CSS v4
- **Anki export**: Python, outputs TSV
- **Data**: pre-computed JSON, no runtime parsing
- **i18n**: English / Russian toggle
