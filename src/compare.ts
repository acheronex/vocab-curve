import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, basename } from "node:path";
import type { AnalysisResult } from "./types.js";

const OUTPUT_DIR = resolve("./output");
const EXCLUDE_FILES = new Set(["comparison.json", "manifest.json"]);

interface TextSource {
  id: string;
  label: string;
  file: string;
}

interface CoveragePair {
  sourceId: string;
  sourceLabel: string;
  targetId: string;
  targetLabel: string;
  targetTotalStems: number;
  coveredStems: number;
  coveragePercent: number;
  bridgeWords: Array<{
    displayForm: string;
    stem: string;
    countInTarget: number;
  }>;
  bridgeWordsTotal: number;
}

interface TextSummary {
  id: string;
  label: string;
  totalWords: number;
  totalTokens: number;
  totalUniqueStems: number;
  sections: number;
  coreCoverage: number;
  densityNormalized: number;
  topWords: Array<{ displayForm: string; count: number }>;
  curve: Array<{ section: number; newStems: number; cumulative: number }>;
  stems: string[];
}

interface ComparisonResult {
  generatedAt: string;
  texts: TextSummary[];
  coverage: CoveragePair[];
  cumulativeLadder: {
    steps: Array<{
      id: string;
      label: string;
      stemsAdded: number;
      cumulativeStems: number;
      coverageOfNext: number | null;
    }>;
    finalVocabulary: number;
  };
}

// ── Auto-discover all analysis JSONs in output/ ─────────────────

function discoverSources(): TextSource[] {
  const files = readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith(".json") && !EXCLUDE_FILES.has(f));

  return files.map((f) => {
    const filePath = resolve(OUTPUT_DIR, f);
    const data = JSON.parse(readFileSync(filePath, "utf-8")) as AnalysisResult;
    const id = basename(f, ".json");
    return {
      id,
      label: (data.meta as any).label || id,
      file: `./output/${f}`,
    };
  });
}

const SOURCES = discoverSources();
console.log(
  `Discovered ${SOURCES.length} texts: ${SOURCES.map((s) => s.label).join(", ")}`,
);

// ── Load & analyze ──────────────────────────────────────────────

function loadAnalysis(file: string): AnalysisResult {
  return JSON.parse(readFileSync(resolve(file), "utf-8")) as AnalysisResult;
}

function getStemSet(analysis: AnalysisResult): Set<string> {
  return new Set(analysis.vocabulary.map((w) => w.stem));
}

function computeCoverage(
  source: AnalysisResult,
  sourceInfo: TextSource,
  target: AnalysisResult,
  targetInfo: TextSource,
): CoveragePair {
  const sourceStems = getStemSet(source);
  const targetStems = getStemSet(target);

  let covered = 0;
  const bridge: CoveragePair["bridgeWords"] = [];

  for (const word of target.vocabulary) {
    if (sourceStems.has(word.stem)) {
      covered++;
    } else {
      bridge.push({
        displayForm: word.displayForm,
        stem: word.stem,
        countInTarget: word.totalCount,
      });
    }
  }

  bridge.sort((a, b) => b.countInTarget - a.countInTarget);

  return {
    sourceId: sourceInfo.id,
    sourceLabel: sourceInfo.label,
    targetId: targetInfo.id,
    targetLabel: targetInfo.label,
    targetTotalStems: targetStems.size,
    coveredStems: covered,
    coveragePercent:
      Math.round((covered / targetStems.size) * 1000) / 10,
    bridgeWords: bridge.slice(0, 500),
    bridgeWordsTotal: bridge.length,
  };
}

const analyses = SOURCES.map((s) => ({
  source: s,
  data: loadAnalysis(s.file),
}));

// ── Sort ladder by ascending totalUniqueStems (simplest → most complex) ──

const ladderOrder = [...analyses]
  .sort((a, b) => a.data.meta.totalUniqueStems - b.data.meta.totalUniqueStems)
  .map((a) => a.source.id);

console.log(
  `Ladder order: ${ladderOrder.map((id) => analyses.find((a) => a.source.id === id)!.source.label).join(" → ")}`,
);

// ── Build texts ─────────────────────────────────────────────────

const texts: TextSummary[] = analyses.map(({ source, data }) => {
  const coreTier = data.tierStats?.find(t => t.name === 'core');
  const N = data.meta.totalWords ?? data.meta.totalTokens;
  const V = data.meta.totalUniqueStems;

  return {
    id: source.id,
    label: source.label,
    totalWords: data.meta.totalWords ?? data.meta.totalTokens,
    totalTokens: data.meta.totalTokens,
    totalUniqueStems: data.meta.totalUniqueStems,
    sections: data.meta.totalSections,
    coreCoverage: coreTier?.coveragePercentage ?? 0,
    densityNormalized: Math.round((V / Math.sqrt(N)) * 100) / 100,
    topWords: data.vocabulary.slice(0, 30).map((w) => ({
      displayForm: w.displayForm,
      count: w.totalCount,
    })),
    curve: data.sections.map((s) => ({
      section: s.index,
      newStems: s.newStems,
      cumulative: s.cumulativeUniqueStems,
    })),
    stems: data.vocabulary.map((w) => w.stem),
  };
});

// ── Build coverage matrix ───────────────────────────────────────

const coverage: CoveragePair[] = [];
for (let i = 0; i < analyses.length; i++) {
  for (let j = 0; j < analyses.length; j++) {
    if (i === j) continue;
    coverage.push(
      computeCoverage(
        analyses[i].data,
        analyses[i].source,
        analyses[j].data,
        analyses[j].source,
      ),
    );
  }
}

// ── Build cumulative ladder ─────────────────────────────────────

const cumulativeStems = new Set<string>();
const ladderSteps = ladderOrder.map((id, idx) => {
  const entry = analyses.find((a) => a.source.id === id)!;
  const stemsBefore = cumulativeStems.size;
  for (const w of entry.data.vocabulary) {
    cumulativeStems.add(w.stem);
  }
  const stemsAdded = cumulativeStems.size - stemsBefore;

  let coverageOfNext: number | null = null;
  if (idx < ladderOrder.length - 1) {
    const nextId = ladderOrder[idx + 1];
    const nextAnalysis = analyses.find((a) => a.source.id === nextId)!;
    const nextStems = getStemSet(nextAnalysis.data);
    let covered = 0;
    for (const stem of nextStems) {
      if (cumulativeStems.has(stem)) covered++;
    }
    coverageOfNext = Math.round((covered / nextStems.size) * 1000) / 10;
  }

  return {
    id,
    label: entry.source.label,
    stemsAdded,
    cumulativeStems: cumulativeStems.size,
    coverageOfNext,
  };
});

// ── Write comparison.json ───────────────────────────────────────

const result: ComparisonResult = {
  generatedAt: new Date().toISOString(),
  texts,
  coverage,
  cumulativeLadder: {
    steps: ladderSteps,
    finalVocabulary: cumulativeStems.size,
  },
};

const outputPath = resolve("./output/comparison.json");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");

// ── Write manifest.json ─────────────────────────────────────────

const manifest = {
  generatedAt: new Date().toISOString(),
  texts: ladderOrder.map((id) => {
    const entry = analyses.find((a) => a.source.id === id)!;
    return {
      id: entry.source.id,
      label: entry.source.label,
      file: basename(entry.source.file),
      totalWords: entry.data.meta.totalWords ?? entry.data.meta.totalTokens,
      totalTokens: entry.data.meta.totalTokens,
      totalUniqueStems: entry.data.meta.totalUniqueStems,
      sections: entry.data.meta.totalSections,
    };
  }),
};

const manifestPath = resolve("./output/manifest.json");
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

// ── Console output ──────────────────────────────────────────────

console.log("\n✓ Comparison complete\n");
console.log("=== TEXT OVERVIEW ===");
for (const t of texts) {
  console.log(
    `  ${t.label}: ${t.totalTokens.toLocaleString()} tokens, ${t.totalUniqueStems.toLocaleString()} unique stems, ${t.sections} sections`,
  );
}

console.log("\n=== COVERAGE MATRIX ===");
console.log("(What % of TARGET's vocabulary is covered by SOURCE)\n");
console.log(
  "".padEnd(28) +
    ladderOrder
      .map((id) => {
        const label = texts.find((t) => t.id === id)!.label;
        return label.slice(0, 14).padStart(16);
      })
      .join(""),
);

for (const sourceId of ladderOrder) {
  const sourceLabel = texts.find((t) => t.id === sourceId)!.label;
  let row = sourceLabel.slice(0, 26).padEnd(28);
  for (const targetId of ladderOrder) {
    if (sourceId === targetId) {
      row += "—".padStart(16);
    } else {
      const pair = coverage.find(
        (c) => c.sourceId === sourceId && c.targetId === targetId,
      )!;
      row += `${pair.coveragePercent}%`.padStart(16);
    }
  }
  console.log(row);
}

console.log("\n=== CUMULATIVE LADDER ===");
console.log("(Read in this order: how your vocabulary grows)\n");
for (const step of ladderSteps) {
  const nextInfo =
    step.coverageOfNext !== null
      ? ` → covers ${step.coverageOfNext}% of next text`
      : "";
  console.log(
    `  ${step.label.padEnd(26)} +${String(step.stemsAdded).padStart(5)} new stems → ${String(step.cumulativeStems).padStart(6)} total${nextInfo}`,
  );
}

console.log(`\nOutput: ${outputPath}`);
console.log(`Manifest: ${manifestPath}`);
