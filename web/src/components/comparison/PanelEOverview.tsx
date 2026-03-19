import type { ComparisonResult } from '../../hooks/useComparisonData';
import { useLanguage } from '../../App';
import { t } from '../../i18n/translations';

interface PanelEOverviewProps {
  data: ComparisonResult;
}

export function PanelEOverview({ data }: PanelEOverviewProps) {
  const { language } = useLanguage();
  const colors = [
    'text-primary border-primary/20 bg-primary/5',
    'text-[#4a8b9d] border-[#4a8b9d]/20 bg-[#4a8b9d]/5',
    'text-[#d4a373] border-[#d4a373]/20 bg-[#d4a373]/5',
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-full">
      <div className="mb-6">
        <h2 className="text-xl font-serif text-primary mb-1">{t('Text Overview', language)}</h2>
        <p className="text-sm text-muted-foreground">
          {t('Key statistics and most frequent words for each text.', language)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.texts.map((text, index) => {
          const colorClass = colors[index % colors.length];
          
          return (
            <div key={text.id} className={`border rounded-lg p-4 flex flex-col ${colorClass}`}>
              <h3 className="font-serif font-medium text-lg mb-4 truncate" title={text.label}>
                {text.label}
              </h3>
              
              <div className="space-y-3 mb-6 flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider opacity-70">{t('Words', language)}</span>
                  <span className="font-mono font-medium">{text.totalTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider opacity-70">{language === 'ru' ? 'Уникальных стемов' : 'Unique Stems'}</span>
                  <span className="font-mono font-medium">{text.totalUniqueStems.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider opacity-70">{language === 'ru' ? 'Разделов' : 'Sections'}</span>
                  <span className="font-mono font-medium">{text.sections}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider opacity-70 mb-2">{language === 'ru' ? 'Топ слов' : 'Top Words'}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {text.topWords.slice(0, 10).map((word, i) => (
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
