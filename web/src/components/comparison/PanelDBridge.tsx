import { useState, useMemo } from 'react';
import type { ComparisonResult } from '../../hooks/useComparisonData';
import { useLanguage } from '../../App';
import { t } from '../../i18n/translations';

interface PanelDBridgeProps {
  data: ComparisonResult;
}

export function PanelDBridge({ data }: PanelDBridgeProps) {
  const { language } = useLanguage();
  const [selectedPair, setSelectedPair] = useState<string>(() => {
    const firstCoverage = data.coverage[0];
    return `${firstCoverage.sourceId}-${firstCoverage.targetId}`;
  });

  const [filterProperNouns, setFilterProperNouns] = useState(true);

  const currentCoverage = useMemo(() => {
    const [sourceId, targetId] = selectedPair.split('-');
    return data.coverage.find(c => c.sourceId === sourceId && c.targetId === targetId);
  }, [data, selectedPair]);

  const filteredBridgeWords = useMemo(() => {
    if (!currentCoverage) return [];
    
    let words = currentCoverage.bridgeWords;
    
    if (filterProperNouns) {
      words = words.filter(w => {
        const isCapitalized = w.displayForm.charAt(0) === w.displayForm.charAt(0).toUpperCase();
        const isLikelyName = isCapitalized && w.countInTarget > 5;
        return !isLikelyName;
      });
    }
    
    return words.slice(0, 100);
  }, [currentCoverage, filterProperNouns]);

  if (!currentCoverage) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-serif text-primary mb-2">{t('Bridge Words', language)}</h2>
          <p className="text-muted-foreground max-w-2xl">
            {t('Words that appear in the target text but are NOT covered by the source text.', language)}
          </p>
        </div>
        
        <div className="flex flex-col gap-3 min-w-[250px]">
          <select 
            className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
          >
            {data.coverage.map(c => (
              <option key={`${c.sourceId}-${c.targetId}`} value={`${c.sourceId}-${c.targetId}`}>
                {c.sourceLabel} → {c.targetLabel}
              </option>
            ))}
          </select>
          
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input 
              type="checkbox" 
              className="rounded border-border bg-background text-primary focus:ring-primary/50"
              checked={filterProperNouns}
              onChange={(e) => setFilterProperNouns(e.target.checked)}
            />
            {t('Filter proper nouns', language)}
          </label>
        </div>
      </div>

      <div className="bg-background border border-border rounded-lg p-4 mb-6 flex items-center justify-between">
        <div>
          <span className="text-2xl font-serif text-foreground">
            {currentCoverage.bridgeWordsTotal.toLocaleString()}
          </span>
          <span className="text-muted-foreground ml-2">
            {language === 'ru' ? 'слов' : 'words'} {language === 'ru' ? 'в' : 'in'} {currentCoverage.targetLabel} {language === 'ru' ? 'не покрыто' : 'not covered by'} {currentCoverage.sourceLabel}
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm text-muted-foreground block">{t('Coverage', language)}</span>
          <span className="text-lg font-medium text-primary">
            {currentCoverage.coveragePercent.toFixed(1)}%
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
          {language === 'ru' ? 'Топ-100 недостающих слов (по частоте)' : 'Top 100 Missing Words (by frequency)'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {filteredBridgeWords.map((word, i) => (
            <div
              key={i}
              className="flex items-center bg-background border border-border rounded-md overflow-hidden group hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 cursor-default"
            >
              <span className="px-3 py-1.5 text-sm text-foreground font-medium group-hover:text-primary transition-colors">
                {word.displayForm}
              </span>
              <span className="px-2 py-1.5 text-xs bg-muted/50 text-muted-foreground border-l border-border group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-150">
                {word.countInTarget}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
