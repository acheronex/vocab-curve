import { useState, useMemo } from 'react';
import { Search, X, ChevronDown, ChevronRight } from 'lucide-react';
import type { ComparisonResult } from '../../hooks/useComparisonData';
import { useLanguage } from '../../App';
import { t } from '../../i18n/translations';

interface PanelDBridgeProps {
  data: ComparisonResult;
}

interface FrequencyBand {
  key: string;
  labelKey: string;
  min: number;
  max: number;
  color: string;
}

const FREQUENCY_BANDS: FrequencyBand[] = [
  { key: 'core', labelKey: 'Core (20+×)', min: 20, max: Infinity, color: '#22c55e' },
  { key: 'medium', labelKey: 'Medium (6-19×)', min: 6, max: 19, color: '#f59e0b' },
  { key: 'rare', labelKey: 'Rare (2-5×)', min: 2, max: 5, color: '#60a5fa' },
  { key: 'hapax', labelKey: 'Hapax (1×)', min: 1, max: 1, color: '#94a3b8' },
];

export function PanelDBridge({ data }: PanelDBridgeProps) {
  const { language } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedBands, setCollapsedBands] = useState<Set<string>>(new Set());
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});

  const currentCoverage = data.coverage[selectedIndex];

  const groupedBridgeWords = useMemo(() => {
    if (!currentCoverage) return [];

    const allWords = currentCoverage.bridgeWords;
    const query = searchQuery.toLowerCase();

    return FREQUENCY_BANDS.map(band => {
      const words = allWords
        .filter(w => w.countInTarget >= band.min && w.countInTarget <= band.max)
        .filter(w => !query || w.displayForm.toLowerCase().includes(query) || w.stem.toLowerCase().includes(query));

      return { band, words };
    }).filter(g => g.words.length > 0);
  }, [currentCoverage, searchQuery]);

  const totalFilteredWords = useMemo(
    () => groupedBridgeWords.reduce((sum, g) => sum + g.words.length, 0),
    [groupedBridgeWords]
  );

  const toggleBand = (key: string) => {
    setCollapsedBands(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!currentCoverage) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-serif text-primary-text mb-2">{t('Bridge Words', language)}</h2>
          <p className="text-muted-foreground max-w-2xl">
            {t('Words that appear in the target text but are NOT covered by the source text.', language)}
          </p>
        </div>
        
        <div className="flex flex-col gap-3 min-w-[250px]">
          <select
            className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={selectedIndex}
            onChange={(e) => {
              setSelectedIndex(Number(e.target.value));
              setSearchQuery('');
              setVisibleCounts({});
            }}
          >
            {data.coverage.map((c, i) => (
              <option key={i} value={i}>
                {c.sourceLabel} → {c.targetLabel}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-background border border-border rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
          <span className="text-lg font-medium text-primary-text">
            {currentCoverage.coveragePercent.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('Filter bridge words...', language)}
          className="w-full bg-background border border-border rounded-lg pl-9 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
        {searchQuery && (
          <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {totalFilteredWords}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {groupedBridgeWords.map(({ band, words }) => {
          const isCollapsed = collapsedBands.has(band.key);
          return (
            <div key={band.key} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleBand(band.key)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-background hover:bg-muted/30 transition-colors"
              >
                {isCollapsed ? <ChevronRight size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: band.color }}
                />
                <span className="text-sm font-medium text-foreground">
                  {t(band.labelKey, language)}
                </span>
                <span className="text-xs text-muted-foreground font-mono ml-auto">
                  {words.length} {language === 'ru' ? 'слов' : 'words'}
                </span>
              </button>
              {!isCollapsed && (
                <div className="p-4 flex flex-wrap gap-2">
                  {words.slice(0, visibleCounts[band.key] ?? 100).map((word, i) => (
                    <div
                      key={i}
                      className="flex items-center bg-background border border-border rounded-md overflow-hidden group hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 cursor-default"
                    >
                      <span className="px-3 py-1.5 text-sm text-foreground font-medium group-hover:text-primary-text transition-colors">
                        {word.displayForm}
                      </span>
                      <span className="px-2 py-1.5 text-xs bg-muted/50 text-muted-foreground border-l border-border group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-150">
                        {word.countInTarget}
                      </span>
                    </div>
                  ))}
                  {words.length > (visibleCounts[band.key] ?? 100) && (
                    <div className="w-full flex justify-center mt-2">
                      <button
                        onClick={() => setVisibleCounts(prev => ({
                          ...prev,
                          [band.key]: (prev[band.key] ?? 100) + 100,
                        }))}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground bg-background border border-border rounded-lg hover:border-primary/50 transition-colors"
                      >
                        {t('Show 50 more', language).replace('50', '100')} ({words.length} {language === 'ru' ? 'всего' : 'total'})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
