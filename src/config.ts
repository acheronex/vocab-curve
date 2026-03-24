import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import yaml from "js-yaml";
import type { Config } from "./types.js";

const DEFAULTS: Config = {
  input: {
    file: "",
    language: "de",
  },
  structure: {
    splitPattern: "^## ",
    titlePattern: "^## \\d+\\.\\s*(.+)",
    includeSections: [],
    excludePatterns: [],
  },
  analysis: {
    stemmer: "simplemma",
    minWordLength: 2,
    stopWords: true,
  },
  output: {
    path: "./output/analysis.json",
  },
};

interface RawYaml {
  input?: {
    file?: string;
    language?: string;
    label?: string;
  };
  structure?: {
    split_pattern?: string;
    title_pattern?: string;
    include_sections?: string[];
    exclude_patterns?: string[];
  };
  analysis?: {
    stemmer?: string;
    min_word_length?: number;
    stop_words?: boolean;
  };
  output?: {
    path?: string;
  };
}

export function loadConfig(configPath: string): Config {
  const raw = yaml.load(
    readFileSync(resolve(configPath), "utf-8"),
  ) as RawYaml;

  if (!raw?.input?.file) {
    throw new Error("Config must specify input.file");
  }

  return {
    input: {
      file: raw.input.file,
      language: raw.input.language ?? DEFAULTS.input.language,
      label: raw.input.label,
    },
    structure: {
      splitPattern:
        raw.structure?.split_pattern ?? DEFAULTS.structure.splitPattern,
      titlePattern:
        raw.structure?.title_pattern ?? DEFAULTS.structure.titlePattern,
      includeSections:
        raw.structure?.include_sections ?? DEFAULTS.structure.includeSections,
      excludePatterns:
        raw.structure?.exclude_patterns ?? DEFAULTS.structure.excludePatterns,
    },
    analysis: {
      stemmer:
        (raw.analysis?.stemmer as Config["analysis"]["stemmer"]) ??
        DEFAULTS.analysis.stemmer,
      minWordLength:
        raw.analysis?.min_word_length ?? DEFAULTS.analysis.minWordLength,
      stopWords: raw.analysis?.stop_words ?? DEFAULTS.analysis.stopWords,
    },
    output: {
      path: raw.output?.path ?? DEFAULTS.output.path,
    },
  };
}
