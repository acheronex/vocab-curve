import type { ComparisonResult } from '../../hooks/useComparisonData';
import { useLanguage } from '../../App';
import { t } from '../../i18n/translations';
import { getCardColorClass } from '../../utils/colors';
import { InfoTooltip } from '../InfoTooltip';

interface PanelEOverviewProps {
  data: ComparisonResult;
  colorIndexMap: Map<string, number>;
}

export function PanelEOverview({ data, colorIndexMap }: PanelEOverviewProps) {
  const { language } = useLanguage();

  const gridCols = data.texts.length <= 2
    ? 'grid-cols-1 md:grid-cols-2'
    : data.texts.length === 3
      ? 'grid-cols-1 md:grid-cols-3'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-full">
      <div className="mb-6">
        <h2 className="text-xl font-serif text-primary mb-1">{t('Text Overview', language)}</h2>
        <p className="text-sm text-muted-foreground">
          {t('Key statistics and most frequent words for each text.', language)}
        </p>
      </div>

      <div className={`grid ${gridCols} gap-4`}>
        {data.texts.map((text) => {
          const colorIdx = colorIndexMap.get(text.id) ?? 0;
          const colorClass = getCardColorClass(colorIdx);
          const densityPct = text.totalUniqueStems / text.totalWords * 100;
          const density = densityPct >= 10 ? `${densityPct.toFixed(1)}%` : `${densityPct.toFixed(2)}%`;

          return (
            <div key={text.id} className={`border rounded-lg p-4 flex flex-col ${colorClass}`}>
              <h3 className="font-serif font-medium text-lg mb-3 truncate" title={text.label}>
                {text.label}
              </h3>

              <div className="space-y-2 mb-4 flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider opacity-70">{t('Words', language)}</span>
                  <span className="font-mono font-medium text-sm">{text.totalWords.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider opacity-70">{language === 'ru' ? 'Уникальных стемов' : 'Unique Stems'}</span>
                  <span className="font-mono font-medium text-sm">{text.totalUniqueStems.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider opacity-70">{language === 'ru' ? 'Разделов' : 'Sections'}</span>
                  <span className="font-mono font-medium text-sm">{text.sections}</span>
                </div>
                <div className="h-px bg-current/10 my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider flex items-center gap-1">
                    <span className="opacity-70">{language === 'ru' ? 'Плотность (норм.)' : 'Density (norm.)'}</span>
                    <InfoTooltip />
                  </span>
                  <span className="font-mono font-bold text-sm">{text.densityNormalized?.toFixed(1) ?? '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider opacity-70" title={language === 'ru' ? 'Процент уникальных слов от общего числа слов' : 'Percentage of unique stems out of total words'}>{language === 'ru' ? 'Плотность' : 'Density'}</span>
                  <span className="font-mono text-sm opacity-70">{density}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider opacity-70" title={language === 'ru' ? '% текста, покрытый словами с частотой 20+' : '% of text covered by words appearing 20+ times'}>{t('Core Coverage', language)}</span>
                  <span className="font-mono text-sm opacity-70">{text.coreCoverage.toFixed(1)}%</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider opacity-70 mb-2">{language === 'ru' ? 'Топ слов' : 'Top Words'}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {text.topWords.slice(0, 20).map((word, i) => (
                    <span
                      key={i}
                      className="text-xs bg-background/50 px-2 py-1 rounded border border-current/10"
                    >
                      {word.displayForm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
