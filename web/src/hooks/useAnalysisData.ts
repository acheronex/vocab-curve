import { useState, useEffect, useMemo } from 'react';

export const FREQUENCY_TIERS = [
  { name: 'hapax' as const, label: '1×', range: [1, 1] as const, color: '#94a3b8' },
  { name: 'rare' as const, label: '2-5×', range: [2, 5] as const, color: '#60a5fa' },
  { name: 'medium' as const, label: '6-19×', range: [6, 19] as const, color: '#f59e0b' },
  { name: 'core' as const, label: '20+×', range: [20, Infinity] as const, color: '#22c55e' },
];

export type FrequencyTierName = typeof FREQUENCY_TIERS[number]['name'];

export interface FrequencyTierStats {
  name: FrequencyTierName;
  label: string;
  color: string;
  wordCount: number;
  tokenCount: number;
  coveragePercentage: number;
}

export interface AnalysisResult {
  meta: {
    source: string;
    label?: string;
    language: string;
    totalSections: number;
    totalWords?: number;
    totalTokens: number;
    totalUniqueStems: number;
    stemmer: string;
  };
  sections: Array<{
    index: number;
    title: string;
    totalWords: number;
    totalTokens: number;
    uniqueStems: number;
    newStems: number;
    cumulativeUniqueStems: number;
    newWords: string[];
  }>;
  vocabulary: Array<{
    stem: string;
    displayForm: string;
    forms: Record<string, number>;
    totalCount: number;
    sections: number[];
    sectionCounts: Record<number, number>;
    exampleSentence?: string;
    exampleSentenceSection?: number;
  }>;
  frequencyDistribution: Array<{
    minOccurrences: number;
    stemCount: number;
    percentage: number;
  }>;
  tierStats: FrequencyTierStats[];
}

export function useAnalysisData(sourceFile: string = '') {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sourceFile) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    
    setLoading(true);
    fetch(`/${sourceFile}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load data');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [sourceFile]);

  return { data, loading, error };
}

export function useFilteredSections(data: AnalysisResult | null, threshold: number) {
  return useMemo(() => {
    if (!data) return [];
    if (threshold <= 1) return data.sections;

    const validWords = new Set(
      data.vocabulary
        .filter((v) => v.totalCount >= threshold)
        .map((v) => v.stem)
    );

    const seenStems = new Set<string>();
    let cumulative =0;

    return data.sections.map((section) => {
      const sectionWords = data.vocabulary
        .filter(v => v.sections.includes(section.index) && validWords.has(v.stem));
      
      let newStemsCount = 0;
      const newWords: string[] = [];

      for (const word of sectionWords) {
        if (!seenStems.has(word.stem)) {
          seenStems.add(word.stem);
          newStemsCount++;
          newWords.push(word.stem);
        }
      }

      cumulative += newStemsCount;

      return {
        ...section,
        newStems: newStemsCount,
        cumulativeUniqueStems: cumulative,
        newWords,
      };
    });
  }, [data, threshold]);
}

export function getFrequencyTier(count: number): FrequencyTierName {
  for (const tier of FREQUENCY_TIERS) {
    const [min, max] = tier.range;
    if (count >= min && count <= max) return tier.name;
  }
  return 'hapax';
}

export function useTierFilteredVocabulary(
  data: AnalysisResult | null,
  tierName: FrequencyTierName | 'all'
) {
  return useMemo(() => {
    if (!data) return [];
    if (tierName === 'all') return data.vocabulary;
    
    const tier = FREQUENCY_TIERS.find(t => t.name === tierName);
    if (!tier) return data.vocabulary;
    
    const [min, max] = tier.range;
    return data.vocabulary.filter(v => {
      if (max === Infinity) return v.totalCount >= min;
      return v.totalCount >= min && v.totalCount <= max;
    });
  }, [data, tierName]);
}
