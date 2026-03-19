import type { ComparisonResult } from '../../hooks/useComparisonData';
import { useLanguage } from '../../App';
import { t } from '../../i18n/translations';

interface PanelBCoverageProps {
  data: ComparisonResult;
}

export function PanelBCoverage({ data }: PanelBCoverageProps) {
  const { language } = useLanguage();
  const texts = data.texts;
  
  const getCoverage = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return null;
    const match = data.coverage.find(
      c => c.sourceId === sourceId && c.targetId === targetId
    );
    return match ? match.coveragePercent : 0;
  };

  const getIntensityClass = (percent: number | null) => {
    if (percent === null) return 'bg-muted/20 text-muted-foreground';
    if (percent < 15) return 'bg-primary/10 text-foreground';
    if (percent < 30) return 'bg-primary/30 text-foreground';
    if (percent < 50) return 'bg-primary/50 text-foreground font-medium';
    if (percent < 70) return 'bg-primary/70 text-primary-foreground font-medium';
    return 'bg-primary text-primary-foreground font-bold';
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-full">
      <div className="mb-6">
        <h2 className="text-xl font-serif text-primary mb-1">{t('Coverage Matrix', language)}</h2>
        <p className="text-sm text-muted-foreground">
          {t("What % of the target text's vocabulary is covered by the source text?", language)}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-medium text-muted-foreground border-b border-border">
                Source ↓ \ Target →
              </th>
              {texts.map(text => (
                <th key={text.id} className="p-2 text-center text-xs font-medium text-foreground border-b border-border">
                  {text.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {texts.map(source => (
              <tr key={source.id}>
                <th className="p-2 text-left text-xs font-medium text-foreground border-b border-border whitespace-nowrap">
                  {source.label}
                </th>
                {texts.map(target => {
                  const coverage = getCoverage(source.id, target.id);
                  return (
                    <td 
                      key={`${source.id}-${target.id}`}
                      className={`p-3 text-center text-sm border-b border-border transition-all duration-200 hover:scale-105 hover:shadow-md cursor-default ${getIntensityClass(coverage)}`}
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
