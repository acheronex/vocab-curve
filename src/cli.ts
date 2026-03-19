import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadConfig } from "./config.js";
import { parseMarkdown } from "./ingest/markdown.js";
import { createStemmer, createBatchStemmer } from "./analyze/stem.js";
import {
  buildSectionTokenData,
  buildVocabulary,
} from "./analyze/frequency.js";
import {
  buildProgression,
  buildFrequencyDistribution,
} from "./analyze/progression.js";
import { tokenize } from "./analyze/tokenize.js";
import type { AnalysisResult } from "./types.js";

const configPath = process.argv[2] ?? "config.yaml";

console.log(`Loading config from ${configPath}...`);
const config = loadConfig(configPath);
console.log(`  Input: ${config.input.file}`);
console.log(`  Language: ${config.input.language}`);
console.log(`  Stemmer: ${config.analysis.stemmer}`);

console.log("\nParsing markdown...");
const doc = parseMarkdown(config);
console.log(`  Found ${doc.sections.length} sections`);

console.log("\nAnalyzing...");

const tokenOpts = {
  minWordLength: config.analysis.minWordLength,
  filterStopWords: config.analysis.stopWords,
};

let stem;
let lemmaDisplayForms: Map<string, string> | undefined;
if (config.analysis.stemmer === "simplemma") {
  const allUniqueTokens = new Set<string>();
  const allOriginalForms = new Map<string, string>();
  for (const section of doc.sections) {
    const result = tokenize(section.text, tokenOpts);
    for (const token of result.tokens) {
      allUniqueTokens.add(token);
    }
    for (const [lower, original] of result.originalForms) {
      if (!allOriginalForms.has(lower)) {
        allOriginalForms.set(lower, original);
      }
    }
  }
  const batchResult = createBatchStemmer(Array.from(allUniqueTokens), allOriginalForms);
  stem = batchResult.stem;
  lemmaDisplayForms = batchResult.lemmaDisplayForms;
} else {
  stem = createStemmer(config.analysis.stemmer);
}

const sectionData = buildSectionTokenData(doc, stem, tokenOpts);

const vocabulary = buildVocabulary(sectionData, lemmaDisplayForms);
const progression = buildProgression(doc, sectionData);

const totalWords = sectionData.reduce(
  (sum, s) => sum + s.rawWordCount,
  0,
);
const totalTokens = sectionData.reduce(
  (sum, s) => sum + s.tokens.length,
  0,
);
const totalUniqueStems = vocabulary.length;

const frequencyDistribution = buildFrequencyDistribution(
  totalUniqueStems,
  vocabulary,
);

const result: AnalysisResult = {
  meta: {
    source: config.input.file,
    language: config.input.language,
    analyzedAt: new Date().toISOString(),
    totalSections: doc.sections.length,
    totalWords,
    totalTokens,
    totalUniqueStems,
    stemmer: config.analysis.stemmer,
  },
  sections: progression,
  vocabulary,
  frequencyDistribution,
};

const outputPath = resolve(config.output.path);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");

console.log(`\n✓ Analysis complete`);
console.log(`  Sections: ${result.meta.totalSections}`);
console.log(`  Total words (raw): ${result.meta.totalWords}`);
console.log(`  Total tokens (filtered): ${result.meta.totalTokens}`);
console.log(`  Unique stems: ${result.meta.totalUniqueStems}`);
console.log(`  Output: ${outputPath}`);

console.log("\nFrequency distribution:");
for (const bucket of frequencyDistribution) {
  console.log(
    `  Words appearing ${bucket.minOccurrences}+ times: ${bucket.stemCount} (${bucket.percentage}%)`,
  );
}

console.log(`\nTop 20 words:`);
for (const word of vocabulary.slice(0, 20)) {
  const formsList = Object.entries(word.forms)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([form, count]) => `${form}(${count})`)
    .join(", ");
  console.log(
    `  ${word.displayForm.padEnd(20)} ${String(word.totalCount).padStart(4)}×  [${formsList}]`,
  );
}
