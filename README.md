# Vocab Curve

An interactive vocabulary analysis tool for language learners. Quantifies vocabulary progression as you read, visualizes coverage across texts, and exports frequency-tiered vocabulary lists for Anki.

## Concept

Vocabulary acquisition follows a predictable curve — new texts introduce many new words at first, but as you read more, fewer words are truly new. This tool makes that curve visible, helps you choose what to read next, and tells you exactly which words to study.

## Demo

The included demo uses **Lutherbibel 1912** (public domain) — 696,962 words, 12,997 unique lemmas, 26 books.

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

**Single text view:**
- **Flatten the Curve** — filter by frequency threshold (All / 2+ / 6+ / 20+) to see the "hard core" vocabulary
- **Vocabulary Curve** — bars (new words/section) + cumulative line; click any bar to explore that section's words; toggle between "All unique" and "New only" modes
- **Word Frequency Distribution** — horizontal bar chart showing hapax, rare, medium, core tiers with word counts and text coverage %
- **Word Explorer** — search any word, see all inflected forms, sections, example sentences; filter by frequency tier; linked to chart bar clicks
- **Vocabulary metrics** — Sections, Words, Unique Words, Density, Normalized Density (Guiraud's Index V/√N with explanatory tooltip), Core Coverage

**Comparison view** (when multiple texts analyzed):
- **The Ladder** — waterfall chart of vocabulary accumulation across texts; drag-to-reorder with live recalculation
- **Coverage Matrix** — N×N grid showing how much each text's vocabulary covers another
- **Curves Compared** — overlaid vocabulary growth curves for selected texts
- **Bridge Words** — the specific words you need to level up from one text to the next; proper noun filter toggle
- **Text Overview Cards** — stats, normalized density, raw density, core coverage, and top words per text
- **Text selection chips** — toggle up to 4 texts for comparison

UI supports **English / Russian** toggle.

**Single text view** also includes an **Anki Export** button that generates frequency-tiered TSV files directly from the dashboard.

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
2. Create a config YAML (copy `config-lutherbibel.yaml` as template — include a `label` field)
3. Run analysis: `npx tsx src/cli.ts config-new.yaml`
4. Run comparison: `npx tsx src/compare.ts` (auto-discovers all output JSONs)
5. Copy to web: `cp output/*.json web/public/`

`compare.ts` auto-discovers all analysis JSONs in `output/`, sorts the vocabulary ladder by complexity, and generates `manifest.json` which drives the web UI dropdowns and comparison chips.

## Anki Export

Exports frequency-tiered vocabulary lists as `.txt` files ready for Anki import. Optionally enriches cards with dictionary definitions if you provide a Yomitan-format dictionary.

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

# Options: --tier [1|2-5|6-19|20+|all]  --output-dir DIR  --dict-path PATH
```

## How It Works

```
Markdown → Tokenize → simplemma lemmatizer → Frequency analysis → JSON → React dashboard
                                                                       ↘ Anki TSV export
```

[simplemma](https://github.com/adbar/simplemma) is a dictionary-based Python lemmatizer (0.95 accuracy on German). It groups inflected forms correctly — `sagt/sage/sagen/gesagt` → `sagen`, `wäre` → `sein` — and preserves noun capitalization. Runs as a batch Python bridge; results are cached per analysis.

## Project Structure

```
├── scripts/
│   ├── lemmatize.py         # simplemma Python bridge
│   ├── anki_export.py       # Frequency tier analysis & Anki TSV export
│   ├── bible_to_md.py       # Lutherbibel PDF converter
│   └── pdf_to_md.py         # Generic PDF-to-markdown converter
├── src/
│   ├── cli.ts               # Single-text analysis pipeline
│   ├── compare.ts           # Auto-discovery cross-text comparison + manifest
│   ├── config.ts            # YAML config loader
│   ├── types.ts             # TypeScript interfaces & frequency tier definitions
│   ├── ingest/markdown.ts   # Markdown parser (config-driven section splitting)
│   └── analyze/             # tokenize, stem, frequency, progression, stop-words
├── web/                     # React + Vite dashboard
│   └── src/
│       ├── components/      # Panel1-4, ComparisonView, AnkiExportButton, InfoTooltip
│       │   └── comparison/  # PanelA-E (Ladder, Coverage, Curves, Bridge, Overview)
│       ├── hooks/           # useAnalysisData, useComparisonData, useManifest
│       ├── i18n/            # EN/RU translations (250+ keys)
│       └── utils/colors.ts  # Shared color palette
├── for-analysis/            # Input texts (.md)
├── output/                  # Generated analysis JSON + comparison.json + manifest.json
└── config*.yaml             # Per-text analysis configs
```

## Tech Stack

- **Analysis pipeline**: TypeScript + Node.js + Python (simplemma)
- **Visualization**: React 19 + Vite 8 + Recharts + Tailwind CSS v4
- **Anki export**: Python, optionally reads Yomitan dictionary format, outputs TSV
- **Data**: pre-computed JSON, no runtime parsing
- **i18n**: English / Russian toggle (250+ translated keys)
