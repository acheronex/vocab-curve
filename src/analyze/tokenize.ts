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

const GERMAN_ABBREVIATIONS = new Set([
  "z.B.", "z. B.", "u.a.", "u. a.", "usw.", "bzw.", "d.h.", "d. h.",
  "ca.", "etc.", "evtl.", "ggf.", "s.o.", "s.u.", "vgl.", "Nr.", "S.",
  "Bd.", "Hrsg.", "Jg.", "Jh.", "ca", "Dr.", "Prof.", "Hr.", "Fr.",
  "b.A.", "n.Chr.", "v.Chr.", "Mio.", "Mrd.", "Std.", "Min.", "Sek.",
  "Tab.", "Abb.", "Abs.", "Kap.", "Art.", "Abschn.", "Sept.", "Okt.",
  "Nov.", "Dez.", "Jan.", "Feb.", "März", "Apr.", "Mai", "Jun.",
  "Jul.", "Aug.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa.", "So.",
  "Hrsg", "Hg", "Aufl", "Bd", "Nr", "S"
]);

const SENTENCE_END_PATTERN = /[.!?]+[\s\n]+(?=[A-ZÄÖÜ])|[.!?]+$/g;

export function tokenizeSentences(text: string): string[] {
  const sentences: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  const content = text.replace(/\n+/g, " ").trim();
  
  SENTENCE_END_PATTERN.lastIndex = 0;
  
  while ((match = SENTENCE_END_PATTERN.exec(content)) !== null) {
    const sentence = content.slice(lastIndex, match.index + match[0].length).trim();
    if (sentence.length > 0) {
      const wordCount = sentence.split(/\s+/).filter(w =>/\p{L}/u.test(w)).length;
      if (wordCount >= 4) {
        sentences.push(sentence);
      }
    }
    lastIndex = match.index + match[0].length;
  }
  
  const remaining = content.slice(lastIndex).trim();
  if (remaining.length > 0) {
    const wordCount = remaining.split(/\s+/).filter(w =>/\p{L}/u.test(w)).length;
    if (wordCount >= 4) {
      sentences.push(remaining);
    }
  }
  
  return sentences.filter(s => {
    const lower = s.toLowerCase();
    for (const abbr of GERMAN_ABBREVIATIONS) {
      if (lower === abbr.toLowerCase() || lower.endsWith(abbr.toLowerCase() + ".")) {
        if (s.length < abbr.length +5) return false;
      }
    }
    return true;
  });
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
