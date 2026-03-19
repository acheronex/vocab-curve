// @ts-expect-error — snowball-stemmers has no type declarations
import { newStemmer } from "snowball-stemmers";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

export type StemFunction = (word: string) => string;

export function createStemmer(type: "snowball" | "simplemma" | "none"): StemFunction {
  if (type === "none") {
    return (word: string) => word.toLowerCase();
  }

  if (type === "simplemma") {
    throw new Error("Use createBatchStemmer() for simplemma — call it after collecting all unique tokens");
  }

  const stemmer = newStemmer("german");
  return (word: string) => stemmer.stem(word.toLowerCase()) as string;
}

export interface BatchStemResult {
  stem: StemFunction;
  lemmaDisplayForms: Map<string, string>;
}

export function createBatchStemmer(uniqueTokens: string[], originalForms: Map<string, string>): BatchStemResult {
  const venvPython = resolve(".venv/bin/python3");
  const scriptPath = resolve("scripts/lemmatize.py");

  const tokensWithCap = uniqueTokens.filter((t) => {
    const orig = originalForms.get(t);
    return orig && orig[0] !== orig[0].toLowerCase();
  });
  const tokensLowerOnly = uniqueTokens.filter((t) => {
    const orig = originalForms.get(t);
    return !orig || orig[0] === orig[0].toLowerCase();
  });

  console.log(`  Lemmatizing ${uniqueTokens.length} unique tokens via simplemma...`);
  console.log(`    ${tokensWithCap.length} with capitalized original, ${tokensLowerOnly.length} lowercase-only`);

  const capInput = tokensWithCap.map((t) => originalForms.get(t) ?? t).join("\n") + "\n";
  const lowerInput = tokensLowerOnly.join("\n") + "\n";

  const capOutput = tokensWithCap.length > 0
    ? execFileSync(venvPython, [scriptPath], { input: capInput, encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 }).trim().split("\n")
    : [];
  const lowerOutput = tokensLowerOnly.length > 0
    ? execFileSync(venvPython, [scriptPath], { input: lowerInput, encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 }).trim().split("\n")
    : [];

  const lookupMap = new Map<string, string>();
  const lemmaDisplayForms = new Map<string, string>();

  for (let i = 0; i < tokensWithCap.length && i < capOutput.length; i++) {
    const parts = capOutput[i].split("\t");
    const stemKey = parts[0];
    const display = parts[1] ?? parts[0];
    lookupMap.set(tokensWithCap[i], stemKey);
    if (!lemmaDisplayForms.has(stemKey)) {
      lemmaDisplayForms.set(stemKey, display);
    }
  }

  for (let i = 0; i < tokensLowerOnly.length && i < lowerOutput.length; i++) {
    const parts = lowerOutput[i].split("\t");
    const stemKey = parts[0];
    const display = parts[1] ?? parts[0];
    lookupMap.set(tokensLowerOnly[i], stemKey);
    if (!lemmaDisplayForms.has(stemKey)) {
      lemmaDisplayForms.set(stemKey, display);
    }
  }
  console.log(`  Lemmatization complete: ${lookupMap.size} mappings`);

  const stem: StemFunction = (word: string) => {
    const lower = word.toLowerCase();
    return lookupMap.get(lower) ?? lower;
  };

  return { stem, lemmaDisplayForms };
}
