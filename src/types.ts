// ── Pipeline Config ──────────────────────────────────────────────

export interface Config {
  input: {
    file: string;
    language: string;
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

export interface AnalysisResult {
  /** Metadata */
  meta: {
    source: string;
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
}
