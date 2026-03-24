import { useState, useEffect } from 'react';

export interface ManifestText {
  id: string;
  label: string;
  file: string;
  totalWords: number;
  totalTokens: number;
  totalUniqueStems: number;
  sections: number;
}

export interface Manifest {
  generatedAt: string;
  texts: ManifestText[];
}

export function useManifest() {
  const [data, setData] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch('/manifest.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load manifest');
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
