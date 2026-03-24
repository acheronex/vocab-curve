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
import { useLanguage } from '../App';
import { t } from '../i18n/translations';

interface Panel2Props {
  data: AnalysisResult | null;
}

type ThresholdTier = 'all' | '20' | '6' | '2';

const TIER_BUTTONS: { tier: ThresholdTier; labelEn: string; labelRu: string; color: string }[] = [
  { tier: 'all', labelEn: 'All', labelRu: 'Все', color: '#6b7280' },
  { tier: '2', labelEn: '2+', labelRu: '2+', color: '#60a5fa' },
  { tier: '6', labelEn: '6+', labelRu: '6+', color: '#f59e0b' },
  { tier: '20', labelEn: '20+', labelRu: '20+', color: '#22c55e' },
];

export function Panel2({ data }: Panel2Props) {
  const { language } = useLanguage();
  const [selectedTier, setSelectedTier] = useState<ThresholdTier>('all');

  const tierWords = useMemo(() => {
    if (!data) return new Set<string>();

    if (selectedTier === 'all') {
      return new Set(data.vocabulary.map(v => v.stem));
    }

    const minCount = Number(selectedTier);
    return new Set(
      data.vocabulary
        .filter(v => v.totalCount >= minCount)
        .map(v => v.stem)
    );
  }, [data, selectedTier]);

  const chartData = useMemo(() => {
    if (!data) return [];
    
    const seenStems = new Set<string>();
    let cumulative = 0;
    
    return data.sections.map((section) => {
      const sectionWords = data.vocabulary.filter(
        v => v.sections.includes(section.index) && tierWords.has(v.stem)
      );
      
      let newStemsCount = 0;
      for (const word of sectionWords) {
        if (!seenStems.has(word.stem)) {
          seenStems.add(word.stem);
          newStemsCount++;
        }
      }
      
      cumulative += newStemsCount;
      
      return {
        name: (section.index + 1).toString(),
        title: section.title,
        newStems: newStemsCount,
        cumulative,
        index: section.index,
      };
    });
  }, [data, tierWords]);

  const tierWordCount = tierWords.size;
  const totalWords = data?.meta.totalUniqueStems || 0;

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
            {TIER_BUTTONS.map((btn) => (
              <button
                key={btn.tier}
                onClick={() => setSelectedTier(btn.tier)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  selectedTier === btn.tier
                    ? 'text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                style={selectedTier === btn.tier ? { backgroundColor: btn.color } : {}}
              >
                {language === 'ru' ? btn.labelRu : btn.labelEn}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {language === 'ru' ? 'Показано' : 'Showing'} <span className="font-mono text-foreground">{tierWordCount.toLocaleString()}</span> {language === 'ru' ? 'из' : 'of'}{' '}
            <span className="font-mono text-foreground">{totalWords.toLocaleString()}</span> {language === 'ru' ? 'слов' : 'words'}
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
              domain={[0, tierWordCount + 50]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-card border border-border p-3 rounded-lg shadow-lg max-w-[250px]">
                      <p className="text-xs text-muted-foreground mb-1">{language === 'ru' ? 'Раздел' : 'Topic'} {d.index + 1}</p>
                      <p className="text-sm font-medium text-foreground mb-2 leading-tight">
                        {d.title}
                      </p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-primary">{t('New Words', language)}:</span>
                        <span className="font-mono">{d.newStems}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary">{t('Total Words', language)}:</span>
                        <span className="font-mono">{d.cumulative}</span>
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