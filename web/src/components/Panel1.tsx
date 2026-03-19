import { useMemo } from 'react';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Cell,
} from 'recharts';
import type { AnalysisResult } from '../hooks/useAnalysisData';
import { useLanguage } from '../App';
import { t } from '../i18n/translations';

interface Panel1Props {
  data: AnalysisResult | null;
  onSectionClick: (sectionIndex: number) => void;
  selectedSectionIndex: number | null;
}

export function Panel1({ data, onSectionClick, selectedSectionIndex }: Panel1Props) {
  const { language } = useLanguage();
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.sections.map((s) => ({
      name: s.index.toString(),
      title: s.title,
      newStems: s.newStems,
      cumulative: s.cumulativeUniqueStems,
      index: s.index,
    }));
  }, [data]);

  if (!data) return null;

  return (
    <div className="w-full h-[40vh] min-h-[400px] bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-serif text-foreground mb-1">{language === 'ru' ? 'Кривая словарного запаса' : 'The Vocabulary Curve'}</h2>
        <p className="text-muted-foreground text-sm">
          {language === 'ru' 
            ? 'Новые слова на раздел против накопленного словарного запаса.'
            : 'New words introduced per topic vs. cumulative vocabulary growth.'}
        </p>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload.length > 0) {
                onSectionClick(e.activePayload[0].payload.index);
              }
            }}
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
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-card border border-border p-3 rounded-lg shadow-lg max-w-[250px]">
                      <p className="text-xs text-muted-foreground mb-1">{language === 'ru' ? 'Раздел' : 'Topic'} {data.index + 1}</p>
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
              radius={[2, 2, 0, 0]}
              className="cursor-pointer transition-opacity hover:opacity-80"
              activeBar={{ stroke: 'var(--color-accent)', strokeWidth: 1 }}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={selectedSectionIndex === entry.index ? 'var(--color-accent)' : 'var(--color-primary)'} 
                />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              stroke="var(--color-secondary)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: 'var(--color-secondary)', stroke: 'var(--color-background)', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
