import type { ComparisonResult } from '../../hooks/useComparisonData';
import { ArrowDown } from 'lucide-react';
import { useLanguage } from '../../App';
import { t } from '../../i18n/translations';

interface PanelALadderProps {
  data: ComparisonResult;
}

export function PanelALadder({ data }: PanelALadderProps) {
  const { language } = useLanguage();
  const { steps, finalVocabulary } = data.cumulativeLadder;
  
  const colors = [
    'bg-primary',
    'bg-[#4a8b9d]',
    'bg-[#d4a373]',
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-primary mb-2">{t('The Language Learning Ladder', language)}</h2>
        <p className="text-muted-foreground">
          {t('How vocabulary builds', language)}
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => {
          const previousCumulative = index > 0 ? steps[index - 1].cumulativeStems : 0;
          const previousWidthPercent = (previousCumulative / finalVocabulary) * 100;
          const newWidthPercent = (step.stemsAdded / finalVocabulary) * 100;

          return (
            <div key={step.id} className="relative group">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2 transition-all duration-200 group-hover:translate-x-1">
                <div className="w-48 font-medium text-foreground transition-colors group-hover:text-primary">{step.label}</div>
                <div className="flex-1 h-12 bg-background rounded-md overflow-hidden flex relative border border-border transition-shadow group-hover:shadow-md group-hover:border-primary/30">
                  {index > 0 && (
                    <div 
                      className="h-full bg-muted opacity-50 transition-all duration-1000 ease-out"
                      style={{ width: `${previousWidthPercent}%` }}
                    />
                  )}
                  <div 
                    className={`h-full ${colors[index % colors.length]} transition-all duration-1000 ease-out flex items-center px-3`}
                    style={{ width: `${newWidthPercent}%` }}
                  >
                    {newWidthPercent > 10 && (
                      <span className="text-xs font-mono text-background font-bold mix-blend-luminosity">
                        +{step.stemsAdded.toLocaleString()} {t('new stems', language)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-32 text-right font-mono text-sm">
                  <span className="text-foreground font-bold">{step.cumulativeStems.toLocaleString()}</span>
                  <span className="text-muted-foreground text-xs block">{t('stems total', language)}</span>
                </div>
              </div>

              {step.coverageOfNext !== null && (
                <div className="flex items-center gap-4 my-4 ml-48">
                  <div className="flex flex-col items-center">
                    <div className="w-px h-8 bg-border"></div>
                    <div className="bg-background border border-border rounded-full p-1 z-10 -my-3">
                      <ArrowDown size={16} className="text-muted-foreground" />
                    </div>
                    <div className="w-px h-8 bg-border"></div>
                  </div>
                  <div className="text-sm text-muted-foreground bg-background border border-border px-3 py-1.5 rounded-md">
                    {t('Covers', language)} <strong className="text-foreground">{step.coverageOfNext.toFixed(1)}%</strong> {t('of next text', language)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
