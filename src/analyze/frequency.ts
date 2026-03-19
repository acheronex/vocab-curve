import type { Document, WordEntry } from "../types.js";
import type { StemFunction } from "./stem.js";
import { tokenize, type TokenizeOptions, type TokenizeResult } from "./tokenize.js";

export interface SectionTokenData {
  sectionIndex: number;
  tokens: string[];
  rawWordCount: number;
  originalForms: Map<string, string>;
  stemmedTokens: Map<string, string[]>;
}

export function buildSectionTokenData(
  doc: Document,
  stem: StemFunction,
  tokenOpts: TokenizeOptions,
): SectionTokenData[] {
  return doc.sections.map((section) => {
    const result: TokenizeResult = tokenize(section.text, tokenOpts);
    const stemmedTokens = new Map<string, string[]>();

    for (const token of result.tokens) {
      const stemKey = stem(token);
      const existing = stemmedTokens.get(stemKey);
      if (existing) {
        existing.push(token);
      } else {
        stemmedTokens.set(stemKey, [token]);
      }
    }

    return {
      sectionIndex: section.index,
      tokens: result.tokens,
      rawWordCount: result.rawWordCount,
      originalForms: result.originalForms,
      stemmedTokens,
    };
  });
}

export function buildVocabulary(
  sectionData: SectionTokenData[],
  lemmaDisplayForms?: Map<string, string>,
): WordEntry[] {
  const globalStems = new Map<
    string,
    { forms: Map<string, number>; sections: Set<number> }
  >();

  for (const section of sectionData) {
    for (const [stemKey, tokens] of section.stemmedTokens) {
      let entry = globalStems.get(stemKey);
      if (!entry) {
        entry = { forms: new Map(), sections: new Set() };
        globalStems.set(stemKey, entry);
      }

      entry.sections.add(section.sectionIndex);
      for (const token of tokens) {
        entry.forms.set(token, (entry.forms.get(token) ?? 0) + 1);
      }
    }
  }

  const vocabulary: WordEntry[] = [];

  for (const [stem, entry] of globalStems) {
    const forms: Record<string, number> = {};
    let totalCount = 0;
    let maxCount = 0;
    let mostFrequentForm = stem;

    for (const [form, count] of entry.forms) {
      forms[form] = count;
      totalCount += count;
      if (count > maxCount) {
        maxCount = count;
        mostFrequentForm = form;
      }
    }

    let displayForm: string;
    if (lemmaDisplayForms?.has(stem)) {
      displayForm = lemmaDisplayForms.get(stem)!;
    } else {
      displayForm = mostFrequentForm;
    }

    vocabulary.push({
      stem,
      displayForm,
      forms,
      totalCount,
      sections: Array.from(entry.sections).sort((a, b) => a - b),
    });
  }

  return vocabulary.sort((a, b) => b.totalCount - a.totalCount);
}
