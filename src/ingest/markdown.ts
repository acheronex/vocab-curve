import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Config, Document, Section } from "../types.js";

export function parseMarkdown(config: Config): Document {
  const filePath = resolve(config.input.file);
  const raw = readFileSync(filePath, "utf-8");
  const lines = raw.split("\n");

  const splitRe = new RegExp(config.structure.splitPattern);
  const titleRe = new RegExp(config.structure.titlePattern);
  const excludeRes = config.structure.excludePatterns.map(
    (p) => new RegExp(p),
  );

  const rawSections = splitIntoRawSections(lines, splitRe, titleRe);
  const sections = rawSections.map((raw, index) => {
    const text = extractAnalyzableText(
      raw.lines,
      config.structure.includeSections,
      excludeRes,
    );
    return { index, title: raw.title, text };
  });

  return {
    source: config.input.file,
    language: config.input.language,
    sections: sections.filter((s) => s.text.trim().length > 0),
  };
}

interface RawSection {
  title: string;
  lines: string[];
}

function splitIntoRawSections(
  lines: string[],
  splitRe: RegExp,
  titleRe: RegExp,
): RawSection[] {
  const sections: RawSection[] = [];
  let currentTitle = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    if (splitRe.test(line)) {
      if (currentLines.length > 0 || currentTitle) {
        sections.push({ title: currentTitle, lines: currentLines });
      }
      const match = titleRe.exec(line);
      currentTitle = match?.[1]?.trim() ?? line.replace(splitRe, "").trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0 || currentTitle) {
    sections.push({ title: currentTitle, lines: currentLines });
  }

  return sections;
}

function extractAnalyzableText(
  lines: string[],
  includeSections: string[],
  excludeRes: RegExp[],
): string {
  let filtered: string[];

  if (includeSections.length > 0) {
    filtered = filterBySubsections(lines, includeSections);
  } else {
    filtered = [...lines];
  }

  filtered = filtered
    .filter((line) => !excludeRes.some((re) => re.test(line)))
    .map(stripMarkdownAndHtml)
    .filter((line) => line.trim().length > 0);

  return filtered.join("\n");
}

function filterBySubsections(
  lines: string[],
  includeSections: string[],
): string[] {
  const result: string[] = [];
  let inIncludedSection = false;
  const subsectionRe = /^### /;

  for (const line of lines) {
    if (subsectionRe.test(line)) {
      const header = line.replace(/^###\s*/, "").trim();
      inIncludedSection = includeSections.some(
        (s) => header.toLowerCase().includes(s.toLowerCase()),
      );
      continue;
    }

    if (includeSections.length === 0 || inIncludedSection) {
      result.push(line);
    }
  }

  if (result.length === 0) {
    return lines;
  }

  return result;
}

function stripMarkdownAndHtml(line: string): string {
  return (
    line
      // Remove HTML tags
      .replace(/<[^>]+>/g, "")
      // Remove markdown bold/italic
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      // Remove markdown links [text](url)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove leading markdown list markers
      .replace(/^\s*[-*+]\s+/, "")
      // Remove numbered list markers like "1. **word** –"
      .replace(/^\s*\d+\.\s+/, "")
      // Collapse multiple spaces
      .replace(/\s+/g, " ")
      .trim()
  );
}
