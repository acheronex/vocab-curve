import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { ComparisonResult } from '../../hooks/useComparisonData';
import { useLanguage } from '../../App';

interface PanelCCurvesProps {
  data: ComparisonResult;
}

export function PanelCCurves({ data }: PanelCCurvesProps) {
  const { language } = useLanguage();
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

  const colors = {
    'b1-topics': '#d97757',
    'panem': '#4a8b9d',
    'drei-kameraden': '#d4a373'
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-primary mb-2">{language === 'ru' ? 'Сравнение кривых словарного запаса' : 'Vocabulary Curves Compared'}</h2>
        <p className="text-muted-foreground">
          {language === 'ru' 
            ? 'Накопленный словарный запас по ходу каждого текста (нормализовано до 0-100%). Более крутые кривые означают бо́льшую плотность словарного запаса и сложность.'
            : 'Cumulative unique words over the course of each text (normalized to 0-100% completion). Steeper curves indicate higher vocabulary density and difficulty.'}
        </p>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis 
              dataKey="percent" 
              stroke="var(--color-muted-foreground)"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              tickFormatter={(val) => `${val}%`}
              tickMargin={10}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              tickFormatter={(val) => val.toLocaleString()}
              tickMargin={10}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'var(--color-card)', 
                borderColor: 'var(--color-border)',
                borderRadius: '0.5rem',
                color: 'var(--color-foreground)'
              }}
              itemStyle={{ color: 'var(--color-foreground)' }}
              labelFormatter={(val) => `${val}% through text`}
              formatter={(value: any, name: any) => {
                const textId = String(name).replace('_cumulative', '');
                const text = data.texts.find(t => t.id === textId);
                return [Number(value).toLocaleString(), text?.label || String(name)];
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              formatter={(value) => {
                const textId = value.replace('_cumulative', '');
                const text = data.texts.find(t => t.id === textId);
                return <span className="text-foreground ml-2">{text?.label}</span>;
              }}
            />
            
            {data.texts.map(text => (
              <Line
                key={text.id}
                type="monotone"
                dataKey={`${text.id}_cumulative`}
                name={`${text.id}_cumulative`}
                stroke={colors[text.id as keyof typeof colors] || '#fff'}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: colors[text.id as keyof typeof colors] || '#fff' }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
