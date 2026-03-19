# Vocab Curve

Interactive vocabulary analysis tool for language learners. Visualizes how your vocabulary grows as you read — shows the growth curve, frequency distribution, and compares coverage across multiple texts.

**Demo data included** — the app ships with pre-computed vocabulary analysis for 3 German texts at different difficulty levels. No source texts included.

## What It Does

Feed it any text split into chapters/sections, and it will:

- **Track new vocabulary per section** — see how the "new words" curve flattens as you read more
- **Group word forms by lemma** — `sagt/sage/sagen/gesagt` → `sagen`, `ging/gegangen/gehen` → `gehen`
- **Compare texts** — coverage matrix, bridge words between difficulty levels, vocabulary ladder
- **Explore words** — search any word, see all its inflected forms and where they appear

## Demo Data

The included demo analyzes 3 German texts at B1 → B2 → C1 levels:

| Text | Level | Words | Unique Lemmas | Sections |
|------|-------|-------|---------------|----------|
| 82 B1 Exam Topics | B1 | 19,168 | 1,623 | 82 topics |
| Die Tribute von Panem | B2 | 100,249 | 7,523 | 27 chapters |
| Drei Kameraden (Remarque) | C1 | 127,611 | 9,152 | 28 chapters |

**The Vocabulary Ladder** — reading all three texts in order:

```
B1 Topics:        1,623 lemmas
+ Panem:         +6,667 new → 8,290 total
+ Drei Kameraden: +5,735 new → 14,025 total vocabulary
```

## Quick Start (View Demo)

```bash
cd web && npm install && npm run dev
```

Opens at `http://localhost:5173` with the pre-computed demo data.

## Analyze Your Own Text

### Prerequisites

```bash
npm install
cd web && npm install && cd ..
python3 -m venv .venv && source .venv/bin/activate && pip install simplemma
```

### 1. Format your text as markdown

```markdown
## Chapter 1

Your text here...

## Chapter 2

More text...
```

### 2. Create a config

```yaml
input:
  file: "./texts/my-book.md"
  language: de

structure:
  split_pattern: "^## "
  title_pattern: "^## (.+)"

analysis:
  stemmer: simplemma
  min_word_length: 2
  stop_words: true

output:
  path: "./output/my-book.json"
```

### 3. Run the pipeline

```bash
npx tsx src/cli.ts my-config.yaml
cp output/my-book.json web/public/
cd web && npm run dev
```

## How It Works

```
Markdown → Tokenize → simplemma Lemmatizer → Frequency Analysis → JSON → React Dashboard
```

The pipeline extracts text from markdown, groups inflected word forms by lemma using [simplemma](https://github.com/adbar/simplemma) (dictionary-based Python lemmatizer, 0.95 accuracy on German), and computes per-section vocabulary progression. The dashboard reads the pre-computed JSON — no runtime parsing.

## Visualization

### Single Text View

- **Vocabulary Curve** — bars (new words/section) + line (cumulative unique)
- **Flatten the Curve** — filter by frequency threshold to see core vs rare vocabulary
- **Frequency Distribution** — words appearing 1x, 2x, 5x, 10x+
- **Word Explorer** — search, see all inflected forms, section occurrences

### Comparison View

- **The Ladder** — waterfall chart of vocabulary accumulation across texts
- **Coverage Matrix** — N×N overlap grid
- **Curves Compared** — overlaid vocabulary growth curves
- **Bridge Words** — most frequent words you'd need to learn for the next level
- **Text Overview** — stats and top words per text

## Tech Stack

- **Analysis**: TypeScript + Node.js + simplemma (Python)
- **Visualization**: React + Vite + Recharts + Tailwind CSS v4
- **Data**: Pre-computed JSON, no runtime analysis
- **i18n**: English / Russian UI toggle

## Project Structure

```
├── scripts/lemmatize.py          # simplemma Python bridge
├── src/
│   ├── cli.ts                    # Single-text analysis
│   ├── compare.ts                # Cross-text comparison
│   ├── config.ts                 # YAML config loader
│   └── analyze/                  # Tokenizer, lemmatizer, frequency, progression
├── web/
│   ├── public/*.json             # Pre-computed demo data
│   └── src/
│       ├── components/           # React panels (single + comparison views)
│       ├── hooks/                # Data loading hooks
│       └── i18n/                 # Translations
├── config*.yaml                  # Example pipeline configs
└── texts/                        # Your markdown texts go here
```

## License

MIT
