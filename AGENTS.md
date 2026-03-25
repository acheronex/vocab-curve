# Vocab Curve — Developer Guide for AI Agents

This document describes the architecture and data flow of Vocab Curve. **Update this file after any major changes to the app logic.**

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA PIPELINE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   for-analysis/*.md ──► src/cli.ts ──► output/*.json ──► web/public/*.json   │
│                              │                                               │
│                              ▼                                               │
│                        src/compare.ts ──► output/comparison.json             │
│                                      ──► output/manifest.json                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              WEB APP                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   App.tsx                                                                   │
│      ├── ViewMode: 'comparison' | 'single' | 'corpus'                       │
│      ├── URL Hash State: ?view=...&texts=...&text=...&section=...           │
│      └── Language Context: 'en' | 'ru'                                      │
│                                                                             │
│   Views:                                                                    │
│      ├── ComparisonView ──► PanelA-E + PanelF (Selected Texts Stats)        │
│      ├── SingleTextAnalysis ──► Panel1-4                                   │
│      └── CorpusStatsView ──► Full corpus statistics                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Single Text Analysis (`src/cli.ts`)

**Input:** `config-*.yaml` → `for-analysis/*.md`

**Process:**
1. `src/ingest/markdown.ts` — Parses markdown, splits by `## ` headers
   - **IMPORTANT:** Section indices are assigned AFTER filtering empty sections
   - Empty sections (no text content) are removed before indexing
   - This ensures indices are 1, 2, 3... without gaps

2. `src/analyze/tokenize.ts` — Extracts words, filters by length

3. `scripts/lemmatize.py` — Python bridge to simplemma
   - Input: unique tokens as JSON
   - Output: `{token: stem}` mapping
   - Preserves noun capitalization

4. `src/analyze/frequency.ts` — Counts stems, calculates progression

5. `src/analyze/tiers.ts` — Classifies into frequency tiers (1×, 2-5×, 6-19×, 20+×)

**Output:** `output/{text-id}.json`

```json
{
  "meta": {
    "source": "for-analysis/text.md",
    "language": "de",
    "label": "Text Name",
    "totalWords": 100000,
    "totalTokens": 80000,
    "totalUniqueStems": 5000,
    "totalSections": 25
  },
  "sections": [
    {
      "index": 1,
      "title": "Section Title",
      "totalWords": 4000,
      "uniqueStems": 800,
      "newStems": 800,
      "cumulativeUniqueStems": 800
    }
  ],
  "vocabulary": [
    {
      "stem": "sein",
      "displayForm": "sein",
      "totalCount": 500,
      "forms": ["ist", "war", "sind", "waren"],
      "sections": [1, 2, 3, ...]
    }
  ],
  "tierStats": [...]
}
```

### 2. Cross-Text Comparison (`src/compare.ts`)

**Input:** All `output/*.json` files (auto-discovered)

**Process:**
1. Loads all analysis JSONs
2. Calculates coverage matrix (what % of text A's vocabulary is in text B)
3. Sorts texts by density (Guiraud's Index: V/√N) to build "ladder"
4. Calculates cumulative vocabulary growth

**Output:**
- `output/comparison.json` — Full comparison data
- `output/manifest.json` — Text list for web UI dropdowns

```json
// comparison.json
{
  "generatedAt": "2024-01-01T00:00:00Z",
  "texts": [
    {
      "id": "lutherbibel-1912",
      "label": "Lutherbibel 1912",
      "totalWords": 696962,
      "totalTokens": 358919,
      "totalUniqueStems": 12997,
      "sections": 26,
      "coreCoverage": 78.5,
      "densityNormalized": 21.7,
      "topWords": [...],
      "curve": [{ "section": 1, "newStems": 500, "cumulative": 500 }, ...],
      "stems": ["sein", "haben", ...]
    }
  ],
  "coverage": [
    { "sourceId": "a", "targetId": "b", "coveragePercent": 45.2 }
  ],
  "cumulativeLadder": {
    "steps": [
      { "id": "kant", "newStems": 6320, "cumulativeStems": 6320, "coverageOfNext": 15.1 }
    ],
    "finalVocabulary": 104476
  }
}
```

```json
// manifest.json
{
  "texts": [
    { "id": "lutherbibel-1912", "label": "Lutherbibel 1912", "file": "lutherbibel-1912.json" }
  ]
}
```

## Web App Architecture

### State Management (URL Hash Only)

**No localStorage persistence.** All state is in URL hash:

```
#view=comparison&texts=id1,id2,id3&text=active-file&section=5
```

- `view` — 'comparison' | 'single' | 'corpus'
- `texts` — comma-separated IDs for comparison (max 5)
- `text` — active text file for single analysis
- `section` — selected section index

### View Modes

1. **Comparison View** (`ComparisonView.tsx`)
   - Shows panels A-F for selected texts
   - Requires 2+ texts selected
   - Empty state if no texts selected

2. **Single Text Analysis** (inline in `App.tsx`)
   - Shows panels 1-4 for one text
   - Requires active text selected

3. **Corpus Statistics** (`CorpusStatsView.tsx`)
   - Shows stats for ALL texts in corpus
   - No text selection required
   - No Active Texts bar shown

### Key Components

| Component | Purpose |
|-----------|---------|
| `PanelALadder.tsx` | Waterfall chart of vocabulary accumulation |
| `PanelBCoverage.tsx` | N×N coverage matrix |
| `PanelCCurves.tsx` | Overlaid vocabulary curves |
| `PanelDBridge.tsx` | Bridge words between texts |
| `PanelEOverview.tsx` | Text overview cards |
| `PanelFCorpusStats.tsx` | Selected texts statistics (in comparison view) |
| `CorpusStatsView.tsx` | Full corpus statistics (separate view) |
| `Panel1-4.tsx` | Single text analysis panels |
| `InfoTooltip.tsx` | Modal tooltips (type: 'density' | 'tokens') |
| `TextSearchPanel.tsx` | Modal for text selection |

### Data Hooks

| Hook | Loads | Source |
|------|-------|--------|
| `useManifest()` | Text list | `web/public/manifest.json` |
| `useAnalysisData(file)` | Single text | `web/public/{file}.json` |
| `useComparisonData()` | All texts | `web/public/comparison.json` |

## Key Algorithms

### Section Indexing (CRITICAL)

```typescript
// src/ingest/markdown.ts
// WRONG: indices assigned before filtering
sections = rawSections.map((raw, index) => ({ index, ... }))
  .filter(s => s.text.trim().length > 0);  // indices now have gaps!

// CORRECT: filter first, then assign indices
sectionsWithText = rawSections
  .map(raw => ({ title: raw.title, text: extractText(raw) }))
  .filter(s => s.text.trim().length > 0);
sections = sectionsWithText.map((s, index) => ({ index: index + 1, ... }));
```

**Why this matters:** The chart in `PanelCCurves.tsx` looks up sections by index. If indices have gaps (e.g., 1-12, 14-25), the lookup fails and falls back to the last point, causing a spike in the curve.

### Vocabulary Curve Calculation

```typescript
// PanelCCurves.tsx
const targetSection = Math.round((percent / 100) * text.sections);
const curvePoint = text.curve.find(c => c.section === targetSection);
```

This is why section indices must be contiguous (1, 2, 3... N).

### Density Calculation

```typescript
// Guiraud's Index: V / √N
const density = totalUniqueStems / Math.sqrt(totalWords);
```

Higher = more complex text. Compensates for text length via Heap's Law.

## Adding New Features

### Adding a New Panel

1. Create component in `web/src/components/comparison/PanelX{Name}.tsx`
2. Import in `ComparisonView.tsx`
3. Add to JSX in correct position

### Adding a New View Mode

1. Add to `ViewMode` type in `App.tsx`
2. Add tab button in header
3. Add rendering logic in `<main>`
4. Update `TextSearchPanel.tsx` and `ActiveTextsBar.tsx` if needed

### Adding a New Tooltip

1. Add content to `InfoTooltip.tsx` (CONTENT_EN, CONTENT_RU)
2. Add to `TooltipType` union
3. Use `<InfoTooltip type="your-type" />`

### Adding a New Text

1. Add `.md` file to `for-analysis/`
2. Create `config-{name}.yaml`
3. Run `npx tsx src/cli.ts config-{name}.yaml`
4. Run `npx tsx src/compare.ts`
5. Run `cp output/*.json web/public/`

## Common Pitfalls

1. **Section index gaps** — Always filter empty sections BEFORE assigning indices
2. **Tooltip type mismatch** — `InfoTooltip` defaults to 'density', pass `type="tokens"` for token explanations
3. **URL state desync** — Never use localStorage; all state must be in URL hash
4. **Color index mismatch** — Use `colorIndexMap` from `ComparisonView`, not array index

## File Locations

| What | Where |
|------|-------|
| Input texts | `for-analysis/*.md` |
| Analysis configs | `config-*.yaml` |
| Analysis output | `output/*.json` |
| Web data | `web/public/*.json` |
| Python scripts | `scripts/*.py` |
| TypeScript pipeline | `src/*.ts`, `src/**/*.ts` |
| React components | `web/src/components/**/*.tsx` |
| Translations | `web/src/i18n/translations.ts` |
