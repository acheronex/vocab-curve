import type { Document, SectionStats, FrequencyBucket, FrequencyTierStats } from "../types.js";
import { FREQUENCY_TIERS } from "../types.js";
import type { SectionTokenData } from "./frequency.js";

export function buildProgression(
  doc: Document,
  sectionData: SectionTokenData[],
): SectionStats[] {
  const seenStems = new Set<string>();
  const stats: SectionStats[] = [];

  for (let i = 0; i < sectionData.length; i++) {
    const section = sectionData[i];
    const docSection = doc.sections[i];
    const stemsInSection = new Set(section.stemmedTokens.keys());
    const newStems: string[] = [];

    for (const stem of stemsInSection) {
      if (!seenStems.has(stem)) {
        newStems.push(stem);
        seenStems.add(stem);
      }
    }

    const newWords = newStems.map((stem) => {
      const tokens = section.stemmedTokens.get(stem)!;
      return mostFrequent(tokens);
    });

    stats.push({
      index: docSection.index,
      title: docSection.title,
      totalWords: section.rawWordCount,
      totalTokens: section.tokens.length,
      uniqueStems: stemsInSection.size,
      newStems: newStems.length,
      cumulativeUniqueStems: seenStems.size,
      newWords,
    });
  }

  return stats;
}

export function buildFrequencyDistribution(
  totalUniqueStems: number,
  vocabulary: { totalCount: number }[],
): FrequencyBucket[] {
  const thresholds = [1, 2, 3, 5, 10, 20, 50];
  return thresholds.map((minOccurrences) => {
    const stemCount = vocabulary.filter(
      (w) => w.totalCount >= minOccurrences,
    ).length;
    return {
      minOccurrences,
      stemCount,
      percentage: totalUniqueStems > 0
        ? Math.round((stemCount / totalUniqueStems) * 1000) / 10
        : 0,
    };
  });
}

export function buildTierStats(vocabulary: { totalCount: number }[]): FrequencyTierStats[] {
  const totalTokens = vocabulary.reduce((sum, v) => sum + v.totalCount, 0);
  
  return FREQUENCY_TIERS.map((tier) => {
    const [min, max] = tier.range;
    const wordsInTier = vocabulary.filter((v) => {
      if (max === Infinity) {
        return v.totalCount >= min;
      }
      return v.totalCount >= min && v.totalCount <= max;
    });
    
    const wordCount = wordsInTier.length;
    const tokenCount = wordsInTier.reduce((sum, v) => sum + v.totalCount, 0);
    const coveragePercentage = totalTokens > 0
      ? Math.round((tokenCount / totalTokens) * 1000) / 10
      : 0;
    
    return {
      name: tier.name,
      label: tier.label,
      color: tier.color,
      wordCount,
      tokenCount,
      coveragePercentage,
    };
  });
}

function mostFrequent(tokens: string[]): string {
  const counts = new Map<string, number>();
  for (const t of tokens) {
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  let best = tokens[0];
  let bestCount = 0;
  for (const [token, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      best = token;
    }
  }
  return best;
}
