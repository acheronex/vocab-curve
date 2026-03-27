import { useState, useEffect } from 'react';

export interface ComparisonResult {
  globalVocabulary: string[];
  globalWordCounts: number[];
  texts: Array<{
    id: string;
    label: string;
    totalWords: number;
    totalTokens: number;
    totalUniqueStems: number;
    sections: number;
    coreCoverage: number;
    densityNormalized: number;
    topWords: Array<{ displayForm: string; count: number }>;
    curve: Array<{ section: number; newStems: number; cumulative: number }>;
    stemIds: number[];
  }>;
  coverage: Array<{
    sourceId: string;
    sourceLabel: string;
    targetId: string;
    targetLabel: string;
    targetTotalStems: number;
    coveredStems: number;
    coveragePercent: number;
    bridgeWords: Array<{ displayForm: string; stem: string; countInTarget: number }>;
    bridgeWordsTotal: number;
  }>;
}

export function useComparisonData() {
  const [data, setData] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch('/comparison.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load comparison data');
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
  }, []);

  return { data, loading, error };
}