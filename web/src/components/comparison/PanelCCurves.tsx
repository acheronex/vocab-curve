import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { ComparisonResult } from '../../hooks/useComparisonData';
import { useLanguage } from '../../App';
import { getTextColor } from '../../utils/colors';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PanelCCurvesProps {
  data: ComparisonResult;
  colorIndexMap: Map<string, number>;
}

export function PanelCCurves({ data, colorIndexMap }: PanelCCurvesProps) {
  const { language } = useLanguage();
  const [showLegend, setShowLegend] = useState(true);

  const chartData = useMemo(() => {
    const normalizedData: any[] = [];

    for (let i = 0; i <= 100; i++) {
      const point: any = { percent: i };

      data.texts.forEach(text => {
        const targetSection = Math.max(1, Math.round((i / 100) * text.sections));

        const curvePoint = text.curve.find(c => c.section === targetSection) ||
                           text.curve[text.curve.length - 1];

        if (curvePoint) {
          point[`${text.id}_cumulative`] = curvePoint.cumulative;
          point[`${text.id}_new`] = curvePoint.newStems;
        }
      });

      normalizedData.push(point);
    }

    return normalizedData;
  }, [data]);

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 md:p-8 shadow-sm overflow-hidden">
      <div className="mb-4 sm:mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif text-primary-text mb-1 sm:mb-2">
              {language === 'ru' ? 'Сравнение кривых словарного запаса' : 'Vocabulary Curves Compared'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {language === 'ru'
                ? 'Накопленный словарный запас по ходу каждого текста.'
                : 'Cumulative unique words over the course of each text.'}
            </p>
          </div>
        </div>
        
        {data.texts.length > 1 && (
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center gap-1.5 mt-2 sm:mt-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showLegend ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{language === 'ru' ? 'Легенда' : 'Legend'}</span>
          </button>
        )}
      </div>

      {showLegend && data.texts.length > 1 && (
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
          {data.texts.map(text => {
            const colorIdx = colorIndexMap.get(text.id) ?? 0;
            const color = getTextColor(colorIdx);
            return (
              <div
                key={text.id}
                className="flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <div
                  className="w-3 h-0.5 sm:w-4 sm:h-0.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-foreground truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px]">
                  {text.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="h-[250px] sm:h-[350px] md:h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="percent"
              stroke="var(--color-muted-foreground)"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
              tickFormatter={(val) => `${val}%`}
              tickMargin={8}
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
              tickMargin={8}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                borderRadius: '0.5rem',
                color: 'var(--color-foreground)',
                fontSize: '12px',
                padding: '8px 12px'
              }}
              itemStyle={{ color: 'var(--color-foreground)' }}
              labelFormatter={(val) => language === 'ru' ? `${val}% текста` : `${val}% through text`}
              formatter={(value: any, name: any) => {
                const textId = String(name).replace('_cumulative', '');
                const text = data.texts.find(t => t.id === textId);
                return [Number(value).toLocaleString(), text?.label || String(name)];
              }}
            />

            {data.texts.map(text => {
              const colorIdx = colorIndexMap.get(text.id) ?? 0;
              const color = getTextColor(colorIdx);
              return (
                <Line
                  key={text.id}
                  type="monotone"
                  dataKey={`${text.id}_cumulative`}
                  name={`${text.id}_cumulative`}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: color, stroke: 'var(--color-background)', strokeWidth: 1 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
