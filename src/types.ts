// ── Pipeline Config ──────────────────────────────────────────────

export interface Config {
  input: {
    file: string;
    language: string;
    label?: string;
  };
  structure: {
    /** Regex pattern to split document into sections (matched against line start) */
    splitPattern: string;
    /** Regex to extract section title from the split-line */
    titlePattern: string;
    /** Subsection headers to INCLUDE for analysis (if empty, include everything) */
    includeSections: string[];
    /** Line-level regex patterns to EXCLUDE */
    excludePatterns: string[];
  };
  analysis: {
    stemmer: "snowball" | "simplemma" | "none";
    minWordLength: number;
    stopWords: boolean;
  };
  output: {
    path: string;
  };
}

// ──Frequency Tiers ─────────────────────────────────────────────

export const FREQUENCY_TIERS = [
  { name: "hapax", label: "1×", range: [1, 1] as const, color: "#94a3b8" },
  { name: "rare", label: "2-5×", range: [2, 5] as const, color: "#60a5fa" },
  { name: "medium", label: "6-19×", range: [6, 19] as const, color: "#f59e0b" },
  { name: "core", label: "20+×", range: [20, Infinity] as const, color: "#22c55e" },
] as const;

export type FrequencyTierName = (typeof FREQUENCY_TIERS)[number]["name"];

export function getFrequencyTier(count: number): FrequencyTierName {
  for (const tier of FREQUENCY_TIERS) {
    const [min, max] = tier.range;
    if (count >= min && count <= max) return tier.name;
  }
  return "hapax";
}

// ── Ingested Document ───────────────────────────────────────────

export interface Section {
  /** Section index (0-based) */
  index: number;
  /** Section title extracted from heading */
  title: string;
  /** Raw text lines included for analysis */
  text: string;
}

export interface Document {
  /** Source file path */
  source: string;
  /** Language code */
  language: string;
  /** Parsed sections */
  sections: Section[];
}

// ── Analysis Output ─────────────────────────────────────────────

export interface WordEntry {
  /** The stem (grouping key) */
  stem: string;
  /** Most frequent surface form (what to display) */
  displayForm: string;
  /** All observed surface forms with their counts */
  forms: Record<string, number>;
  /** Total count across all sections */
  totalCount: number;
  /** Which sections this word appears in (by index) */
  sections: number[];
  /** Count of occurrences per section (sectionIndex → count) */
  sectionCounts: Record<number, number>;
  /** Example sentence from source text (best match: 7-16 words, single occurrence) */
  exampleSentence?: string;
  /** Section index where example sentence was found */
  exampleSentenceSection?: number;
}

export interface SectionStats {
  /** Section index */
  index: number;
  /** Section title */
  title: string;
  /** Total raw words in this section (before stop-word/length filtering) */
  totalWords: number;
  /** Total tokens (word instances) in this section (after filtering) */
  totalTokens: number;
  /** Unique stems in this section */
  uniqueStems: number;
  /** Stems that appear for the FIRST TIME in this section */
  newStems: number;
  /** Cumulative unique stems up to and including this section */
  cumulativeUniqueStems: number;
  /** The actual new words introduced in this section (display forms) */
  newWords: string[];
}

export interface FrequencyBucket {
  /** Minimum occurrence count */
  minOccurrences: number;
  /** How many unique stems fall in this bucket */
  stemCount: number;
  /** Percentage of total unique stems */
  percentage: number;
}

export interface FrequencyTierStats {
  /** Tier name: hapax, rare, medium, core */
  name: FrequencyTierName;
  /** Display label: 1×, 2-5×, etc. */
  label: string;
  /** Tier color for visualization */
  color: string;
  /** Number of unique words in this tier */
  wordCount: number;
  /** Total token count (word instances) in this tier */
  tokenCount: number;
  /** Percentage of total text covered by this tier */
  coveragePercentage: number;
}

export interface AnalysisResult {
  /** Metadata */
  meta: {
    source: string;
    label?: string;
    language: string;
    analyzedAt: string;
    totalSections: number;
    totalWords: number;
    totalTokens: number;
    totalUniqueStems: number;
    stemmer: string;
  };
  /** Per-section progression data (the "curve") */
  sections: SectionStats[];
  /** Global word frequency table (sorted by totalCount desc) */
  vocabulary: WordEntry[];
  /** Frequency distribution buckets (how many words appear 1x, 2x, 5x, etc.) */
  frequencyDistribution: FrequencyBucket[];
  /** Frequency tier statistics (hapax, rare, medium, core) */
  tierStats: FrequencyTierStats[];
}
