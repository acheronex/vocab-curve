import { useMemo } from 'react';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import type { AnalysisResult } from '../hooks/useAnalysisData';
import { useLanguage } from '../App';
import { t } from '../i18n/translations';

interface Panel3Props {
  data: AnalysisResult | null;
}

export function Panel3({ data }: Panel3Props) {
  const { language } = useLanguage();
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.frequencyDistribution.map((d) => ({
      name: `${d.minOccurrences}+`,
      count: d.stemCount,
      percentage: d.percentage,
    }));
  }, [data]);

  if (!data) return null;

  return (
    <div className="w-full h-full bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-serif text-foreground mb-1">{language === 'ru' ? 'Частотность слов' : 'Word Frequency'}</h2>
        <p className="text-muted-foreground text-sm">
          {language === 'ru' ? 'Сколько слов встречаются минимум N раз?' : 'How many words appear at least N times?'}
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
              domain={[0, data.meta.totalUniqueStems]}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
                      <p className="text-sm font-medium text-foreground mb-1">
                        {data.name} {t('occurrences', language)}
                      </p>
                      <div className="flex justify-between items-center text-sm gap-4">
                        <span className="text-muted-foreground">{t('Words:', language)}</span>
                        <span className="font-mono text-primary">{data.count}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm gap-4">
                        <span className="text-muted-foreground">{t('Percentage:', language)}</span>
                        <span className="font-mono text-secondary">{data.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
            />
            <Bar
              dataKey="count"
              fill="var(--color-secondary)"
              radius={[0, 2, 2, 0]}
              barSize={24}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
