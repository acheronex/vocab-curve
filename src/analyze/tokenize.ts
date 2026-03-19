import { GERMAN_STOP_WORDS } from "./stop-words.js";

export interface TokenizeOptions {
  minWordLength: number;
  filterStopWords: boolean;
}

export interface TokenizeResult {
  tokens: string[];
  rawWordCount: number;
  originalForms: Map<string, string>;
}

export function tokenize(text: string, options: TokenizeOptions): TokenizeResult {
  const allWords = text
    .split(/[\s\n]+/)
    .map(cleanToken)
    .filter((t): t is string => t !== null)
    .filter((t) => /[a-zA-ZäöüÄÖÜßéèê]/u.test(t));

  const rawWordCount = allWords.length;

  const capCounts = new Map<string, number>();
  const lowerCounts = new Map<string, number>();
  const firstCapForm = new Map<string, string>();
  for (const word of allWords) {
    const lower = word.toLowerCase();
    const isCapitalized = word[0] !== word[0].toLowerCase();
    if (isCapitalized) {
      capCounts.set(lower, (capCounts.get(lower) ?? 0) + 1);
      if (!firstCapForm.has(lower)) {
        firstCapForm.set(lower, word);
      }
    } else {
      lowerCounts.set(lower, (lowerCounts.get(lower) ?? 0) + 1);
    }
  }

  const originalForms = new Map<string, string>();
  for (const word of allWords) {
    const lower = word.toLowerCase();
    if (originalForms.has(lower)) continue;
    const capCount = capCounts.get(lower) ?? 0;
    const lowerCount = lowerCounts.get(lower) ?? 0;
    if (capCount > lowerCount && firstCapForm.has(lower)) {
      originalForms.set(lower, firstCapForm.get(lower)!);
    } else {
      originalForms.set(lower, lower);
    }
  }

  const tokens = allWords
    .map((w) => w.toLowerCase())
    .filter((t) => t.length >= options.minWordLength)
    .filter((t) => !options.filterStopWords || !GERMAN_STOP_WORDS.has(t));

  return { tokens, rawWordCount, originalForms };
}

function cleanToken(raw: string): string | null {
  const cleaned = raw
    .replace(/^[^\p{L}]+/u, "")
    .replace(/[^\p{L}]+$/u, "");

  if (cleaned.length === 0) return null;
  return cleaned;
}
