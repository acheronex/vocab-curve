import { useMemo, useState } from 'react';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';
import type { AnalysisResult } from '../hooks/useAnalysisData';
import { useFilteredSections } from '../hooks/useAnalysisData';
import { useLanguage } from '../App';
import { t } from '../i18n/translations';

interface Panel2Props {
  data: AnalysisResult | null;
}

export function Panel2({ data }: Panel2Props) {
  const { language } = useLanguage();
  const [threshold, setThreshold] = useState(1);
  const filteredSections = useFilteredSections(data, threshold);

  const THRESHOLDS = [
    { value: 1, label: language === 'ru' ? 'Все слова' : 'All words' },
    { value: 2, label: language === 'ru' ? '2+ раза' : '2+ occurrences' },
    { value: 5, label: language === 'ru' ? '5+ раз' : '5+ occurrences' },
    { value: 10, label: language === 'ru' ? '10+ раз' : '10+ occurrences' },
    { value: 20, label: language === 'ru' ? '20+ раз' : '20+ occurrences' },
  ];

  const chartData = useMemo(() => {
    return filteredSections.map((s) => ({
      name: s.index.toString(),
      title: s.title,
      newStems: s.newStems,
      cumulative: s.cumulativeUniqueStems,
      index: s.index,
    }));
  }, [filteredSections]);

  const totalWordsAtThreshold = useMemo(() => {
    if (!data) return 0;
    return data.vocabulary.filter((v) => v.totalCount >= threshold).length;
  }, [data, threshold]);

  if (!data) return null;

  return (
    <div className="w-full bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif text-foreground mb-1">{language === 'ru' ? 'Сглаживание кривой' : 'Flatten the Curve'}</h2>
          <p className="text-muted-foreground text-sm">
            {language === 'ru' 
              ? 'Как фокус на частых словах снижает нагрузку при изучении.'
              : 'See how focusing on high-frequency words reduces the learning burden.'}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2 bg-background p-1 rounded-lg border border-border">
            {THRESHOLDS.map((t) => (
              <button
                key={t.value}
                onClick={() => setThreshold(t.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  threshold === t.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {language === 'ru' ? 'Показано' : 'Showing'} <span className="font-mono text-foreground">{totalWordsAtThreshold}</span> {language === 'ru' ? 'из' : 'of'}{' '}
            <span className="font-mono text-foreground">{data.meta.totalUniqueStems}</span> {language === 'ru' ? 'слов' : 'words'}
          </p>
        </div>
      </div>

      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              yAxisId="left"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              domain={[0, 'dataMax + 10']}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              domain={[0, data.meta.totalUniqueStems]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-card border border-border p-3 rounded-lg shadow-lg max-w-[250px]">
                      <p className="text-xs text-muted-foreground mb-1">Topic {data.index + 1}</p>
                      <p className="text-sm font-medium text-foreground mb-2 leading-tight">
                        {data.title}
                      </p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-primary">{t('New Words', language)}:</span>
                        <span className="font-mono">{data.newStems}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary">{t('Total Words', language)}:</span>
                        <span className="font-mono">{data.cumulative}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
            />
            <Bar
              yAxisId="left"
              dataKey="newStems"
              fill="var(--color-primary)"
              radius={[2, 2, 0, 0]}
              animationDuration={500}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              stroke="var(--color-secondary)"
              strokeWidth={3}
              dot={false}
              animationDuration={500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
