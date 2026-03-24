import { useMemo } from 'react';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Cell,
} from 'recharts';
import type { AnalysisResult } from '../hooks/useAnalysisData';
import { useLanguage } from '../App';
import { t } from '../i18n/translations';

interface Panel3Props {
  data: AnalysisResult | null;
}

const TIER_LABELS: Record<string, { en: string; ru: string }> = {
  hapax: { en: 'Hapax (1×)', ru: 'Гапакс (1×)' },
  rare: { en: 'Rare (2-5×)', ru: 'Редкие (2-5×)' },
  medium: { en: 'Medium (6-19×)', ru: 'Средние (6-19×)' },
  core: { en: 'Core (20+×)', ru: 'Core (20+×)' },
};

export function Panel3({ data }: Panel3Props) {
  const { language } = useLanguage();
  
  const chartData = useMemo(() => {
    if (!data?.tierStats) return [];
    return data.tierStats.map((tier) => ({
      name: TIER_LABELS[tier.name]?.[language] ?? tier.label,
      tierName: tier.name,
      wordCount: tier.wordCount,
      tokenCount: tier.tokenCount,
      coverage: tier.coveragePercentage,
      color: tier.color,
    }));
  }, [data, language]);

  if (!data) return null;

  return (
    <div className="w-full h-full max-h-[400px] bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-serif text-foreground mb-1">
          {language === 'ru' ? 'Частотные tiers' : 'Frequency Tiers'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {language === 'ru' 
            ? 'Распределение слов по частотности и покрытие текста' 
            : 'Word distribution by frequency and text coverage'}
        </p>
      </div>

      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            layout="vertical"
            data={chartData}
            margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
            <XAxis
              type="number"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
                      <p className="text-sm font-medium text-foreground mb-2">{d.name}</p>
                      <div className="flex justify-between items-center text-sm gap-4">
                        <span className="text-muted-foreground">{t('Words:', language)}</span>
                        <span className="font-mono text-primary">{d.wordCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm gap-4">
                        <span className="text-muted-foreground">{language === 'ru' ? 'Токены:' : 'Tokens:'}</span>
                        <span className="font-mono">{d.tokenCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm gap-4">
                        <span className="text-muted-foreground">{language === 'ru' ? 'Покрытие:' : 'Coverage:'}</span>
                        <span className="font-mono text-secondary">{d.coverage.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
            />
            <Bar
              dataKey="coverage"
              radius={[0, 4, 4, 0]}
              barSize={28}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}