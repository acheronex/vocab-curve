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

function formatDensity(pct: number): string {
  return pct >= 10 ? `${pct.toFixed(1)}%` : `${pct.toFixed(2)}%`;
}

interface Panel1Props {
  data: AnalysisResult | null;
  onSectionClick: (sectionIndex: number) => void;
  selectedSectionIndex: number | null;
  wordMode: 'all' | 'new';
  onWordModeChange: (mode: 'all' | 'new') => void;
}

export function Panel1({ data, onSectionClick, selectedSectionIndex, wordMode, onWordModeChange }: Panel1Props) {
  const { language } = useLanguage();
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.sections.map((s) => ({
      name: (s.index + 1).toString(),
      title: s.title,
      barValue: wordMode === 'all' ? s.uniqueStems : s.newStems,
      totalWords: s.totalWords,
      cumulative: s.cumulativeUniqueStems,
      uniquePercent: s.totalWords > 0 ? Math.round((s.uniqueStems / s.totalWords) * 1000) / 10 : 0,
      index: s.index,
    }));
  }, [data, wordMode]);

  if (!data) return null;

  return (
    <div className="w-full h-[40vh] min-h-[400px] bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif text-foreground mb-1">{language === 'ru' ? 'Кривая словарного запаса' : 'The Vocabulary Curve'}</h2>
          <p className="text-muted-foreground text-sm">
            {language === 'ru'
              ? 'Новые слова на раздел против накопленного словарного запаса.'
              : 'New words introduced per topic vs. cumulative vocabulary growth.'}
          </p>
        </div>
        <div className="flex gap-1 bg-background p-1 rounded-lg border border-border flex-shrink-0">
          <button
            onClick={() => onWordModeChange('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              wordMode === 'all'
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {t('All unique', language)}
          </button>
          <button
            onClick={() => onWordModeChange('new')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              wordMode === 'new'
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {t('New only', language)}
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
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
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => wordMode === 'all' ? formatDensity(value) : `${value}`}
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
                        <span className="text-primary">
                          {wordMode === 'all' ? t('All unique', language) : t('New Words', language)}:
                        </span>
                        <span className="font-mono">{data.barValue}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary">
                          {wordMode === 'all'
                            ? (language === 'ru' ? 'Плотность' : 'Density')
                            : (language === 'ru' ? 'Накопленные' : 'Cumulative')}:
                        </span>
                        <span className="font-mono">
                          {wordMode === 'all' ? `${formatDensity(data.uniquePercent)} (${data.barValue}/${data.totalWords})` : data.cumulative}
                        </span>
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
              dataKey="barValue"
              radius={[2, 2, 0, 0]}
              className="cursor-pointer"
              activeBar={{ stroke: 'var(--color-accent)', strokeWidth: 1 }}
              onClick={(data: any) => {
                if (data && data.index !== undefined) {
                  onSectionClick(data.index);
                }
              }}
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
              dataKey={wordMode === 'all' ? 'uniquePercent' : 'cumulative'}
              stroke="var(--color-secondary)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: 'var(--color-secondary)', stroke: 'var(--color-background)', strokeWidth: 2 }}
              style={{ filter: 'drop-shadow(0 0 1px var(--color-background))' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
