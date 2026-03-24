import type { Document, WordEntry } from "../types.js";
import type { StemFunction } from "./stem.js";
import { tokenize, tokenizeSentences, type TokenizeOptions, type TokenizeResult } from "./tokenize.js";

export interface SectionTokenData {
  sectionIndex: number;
  tokens: string[];
  rawWordCount: number;
  originalForms: Map<string, string>;
  stemmedTokens: Map<string, string[]>;
  sentences: string[];
}

const MIN_SENTENCE_WORDS = 7;
const MAX_SENTENCE_WORDS = 16;

function countWords(sentence: string): number {
  return sentence.split(/\s+/).filter(w =>/\p{L}/u.test(w)).length;
}

function stemSentenceTokens(sentence: string, stem: StemFunction): Set<string> {
  const tokens = sentence
    .split(/[\s\n]+/)
    .map(t => t.replace(/^[^\p{L}]+/u, "").replace(/[^\p{L}]+$/u, ""))
    .filter((t): t is string => t !== null && t.length >= 2 &&/\p{L}/u.test(t))
    .map(t => stem(t.toLowerCase()));
  return new Set(tokens);
}

function selectBestSentence(
  sentences: { text: string; stemOccurrences: number; sectionIndex: number }[],
  usedSentences: Set<string>
): { text: string; sectionIndex: number } | null {
  const valid = sentences.filter(s => {
    if (usedSentences.has(s.text)) return false;
    const wordCount = countWords(s.text);
    return wordCount >= MIN_SENTENCE_WORDS && wordCount <= MAX_SENTENCE_WORDS;
  });
  
  if (valid.length === 0) return null;
  
  valid.sort((a, b) => {
    if (a.stemOccurrences !== b.stemOccurrences) {
      return a.stemOccurrences - b.stemOccurrences;
    }
    return countWords(a.text) - countWords(b.text);
  });
  
  return { text: valid[0].text, sectionIndex: valid[0].sectionIndex };
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

    const sentences = tokenizeSentences(section.text);

    return {
      sectionIndex: section.index,
      tokens: result.tokens,
      rawWordCount: result.rawWordCount,
      originalForms: result.originalForms,
      stemmedTokens,
      sentences,
    };
  });
}

export function buildVocabulary(
  sectionData: SectionTokenData[],
  stem: StemFunction,
  lemmaDisplayForms?: Map<string, string>,
): WordEntry[] {
  const globalStems = new Map<
    string,
    { forms: Map<string, number>; sections: Set<number>; sectionCounts: Map<number, number> }
  >();

  for (const section of sectionData) {
    for (const [stemKey, tokens] of section.stemmedTokens) {
      let entry = globalStems.get(stemKey);
      if (!entry) {
        entry = { forms: new Map(), sections: new Set(), sectionCounts: new Map() };
        globalStems.set(stemKey, entry);
      }

      entry.sections.add(section.sectionIndex);
      entry.sectionCounts.set(section.sectionIndex, tokens.length);
      for (const token of tokens) {
        entry.forms.set(token, (entry.forms.get(token) ?? 0) + 1);
      }
    }
  }

  const sentenceCandidates = new Map<string, { text: string; stemOccurrences: number; sectionIndex: number }[]>();

  for (const section of sectionData) {
    for (const sentence of section.sentences) {
      const stemsInSentence = stemSentenceTokens(sentence, stem);
      
      for (const stemKey of stemsInSentence) {
        if (!sentenceCandidates.has(stemKey)) {
          sentenceCandidates.set(stemKey, []);
        }
        sentenceCandidates.get(stemKey)!.push({
          text: sentence,
          stemOccurrences: stemsInSentence.size,
          sectionIndex: section.sectionIndex,
        });
      }
    }
  }

  const vocabulary: WordEntry[] = [];
  const usedSentences = new Set<string>();

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

    const candidates = sentenceCandidates.get(stem) || [];
    const best = selectBestSentence(candidates, usedSentences);
    
    if (best) {
      usedSentences.add(best.text);
    }

    vocabulary.push({
      stem,
      displayForm,
      forms,
      totalCount,
      sections: Array.from(entry.sections).sort((a, b) => a - b),
      sectionCounts: Object.fromEntries(entry.sectionCounts),
      exampleSentence: best?.text,
      exampleSentenceSection: best?.sectionIndex,
    });
  }

  return vocabulary.sort((a, b) => b.totalCount - a.totalCount);
}
