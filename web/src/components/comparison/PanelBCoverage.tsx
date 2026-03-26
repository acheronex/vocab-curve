import { useMemo } from 'react';
import type { ComparisonResult } from '../../hooks/useComparisonData';
import { useLanguage } from '../../App';
import { t } from '../../i18n/translations';
import { useTheme } from '../../hooks/useTheme';

interface PanelBCoverageProps {
  data: ComparisonResult;
}

function getHeatmapStyle(percent: number | null, isDark: boolean): React.CSSProperties {
  if (percent === null) return { 
    backgroundColor: 'var(--color-muted)', 
    color: 'var(--color-muted-foreground)',
  };
  
  const intensity = Math.min(percent / 70, 1);
  
  if (isDark) {
    const r = Math.round(217 * intensity + 26 * (1 - intensity));
    const g = Math.round(119 * intensity + 26 * (1 - intensity));
    const b = Math.round(87 * intensity + 26 * (1 - intensity));
    return {
      backgroundColor: `rgb(${r}, ${g}, ${b})`,
      color: '#ffffff',
      fontWeight: intensity > 0.35 ? 600 : 400,
    };
  } else {
    const r = Math.round(217 * intensity + 248 * (1 - intensity));
    const g = Math.round(119 * intensity + 248 * (1 - intensity));
    const b = Math.round(87 * intensity + 246 * (1 - intensity));
    return {
      backgroundColor: `rgb(${r}, ${g}, ${b})`,
      color: '#1a1a19',
      fontWeight: intensity > 0.35 ? 600 : 400,
    };
  }
}

export function PanelBCoverage({ data }: PanelBCoverageProps) {
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const texts = data.texts;

  const isDark = resolvedTheme === 'dark';
  
  const maxWidth = texts.length <= 2 ? 560 : texts.length <= 3 ? 740 : texts.length <= 4 ? 920 : undefined;
  
  const coverageMap = useMemo(() => {
    const map = new Map<string, number>();
    data.coverage.forEach(c => {
      map.set(`${c.sourceId}-${c.targetId}`, c.coveragePercent);
    });
    return map;
  }, [data.coverage]);

  const getCoverage = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return null;
    return coverageMap.get(`${sourceId}-${targetId}`) ?? 0;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm overflow-hidden">
      <div className="mb-6">
        <h2 className="text-xl font-serif text-primary-text mb-1">{t('Coverage Matrix', language)}</h2>
        <p className="text-sm text-muted-foreground">
          {t("What % of the target text's vocabulary is covered by the source text?", language)}
        </p>
      </div>

      <div className="overflow-x-auto" style={maxWidth ? { maxWidth } : undefined}>
        <table className="w-full border-collapse min-w-[400px]">
          <thead>
            <tr>
              <th className="p-2 sm:p-3 text-left text-xs font-medium text-muted-foreground border-b border-border">
                {language === 'ru' ? 'Источник ↓ \\ Цель →' : 'Source ↓ \\ Target →'}
              </th>
              {texts.map(text => (
                <th key={text.id} className="p-2 sm:p-3 text-center text-xs font-medium text-foreground border-b border-border" title={text.label}>
                  <span className="block max-w-[10rem] truncate mx-auto">
                    {text.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {texts.map(source => (
              <tr key={source.id}>
                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium text-foreground border-b border-border whitespace-nowrap" title={source.label}>
                  {source.label.length > 22 ? source.label.slice(0, 20) + '…' : source.label}
                </th>
                {texts.map(target => {
                  const coverage = getCoverage(source.id, target.id);
                  return (
                    <td 
                      key={`${source.id}-${target.id}`}
                      className="p-3 sm:p-4 text-center text-sm sm:text-base border-b border-border/50 transition-all"
                      style={getHeatmapStyle(coverage, isDark)}
                    >
                      {coverage === null ? '—' : `${coverage.toFixed(1)}%`}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 text-xs text-muted-foreground space-y-2">
        <p>
          <strong>{t('Read as', language)}:</strong> "{t('Vocabulary from [Row] covers X% of the unique words in [Column].', language)}"
        </p>
        <p>
          {t("Notice how B1 covers only ~10% of the novels' unique words, yet those are the most common words — covering much more of the actual text you'd read.", language)}
        </p>
      </div>
    </div>
  );
}