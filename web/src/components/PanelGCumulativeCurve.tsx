import { useMemo, useState, useCallback } from 'react';
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
import type { ComparisonResult } from '../hooks/useComparisonData';
import { useLanguage } from '../App';
import { GripVertical, RotateCcw } from 'lucide-react';
import { getTextColor } from '../utils/colors';

interface PanelGCumulativeCurveProps {
  data: ComparisonResult;
}

type ThresholdTier = 'all' | '2' | '6' | '20' | '100';

const TIER_BUTTONS: { tier: ThresholdTier; labelEn: string; labelRu: string; color: string }[] = [
  { tier: 'all', labelEn: 'All', labelRu: 'Все', color: '#6b7280' },
  { tier: '2', labelEn: '2+', labelRu: '2+', color: '#60a5fa' },
  { tier: '6', labelEn: '6+', labelRu: '6+', color: '#f59e0b' },
  { tier: '20', labelEn: '20+', labelRu: '20+', color: '#22c55e' },
  { tier: '100', labelEn: '100+', labelRu: '100+', color: '#a855f7' },
];

export function PanelGCumulativeCurve({ data }: PanelGCumulativeCurveProps) {
  const { language } = useLanguage();
  const [selectedTier, setSelectedTier] = useState<ThresholdTier>('all');
  const [order, setOrder] = useState<string[]>(() => 
    [...data.texts].sort((a, b) => a.totalUniqueStems - b.totalUniqueStems).map(t => t.id)
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const isDefaultOrder = useMemo(() => {
    const defaultOrder = [...data.texts].sort((a, b) => a.totalUniqueStems - b.totalUniqueStems).map(t => t.id);
    return order.length === defaultOrder.length && order.every((id, i) => id === defaultOrder[i]);
  }, [order, data.texts]);

  const { chartData, accumulatedStems, tierStemIds } = useMemo(() => {
    const accumulated = new Set<number>();
    const tierMin = selectedTier === 'all' ? 1 : Number(selectedTier);
    
    const filteredStemIds = new Set<number>();
    for (let stemId = 0; stemId < data.globalWordCounts.length; stemId++) {
      if (data.globalWordCounts[stemId] >= tierMin) {
        filteredStemIds.add(stemId);
      }
    }
    
    const steps: Array<{
      id: string;
      label: string;
      shortLabel: string;
      newStems: number;
      cumulative: number;
      colorIndex: number;
    }> = [];
    
    for (const id of order) {
      const text = data.texts.find(t => t.id === id);
      if (!text) continue;
      
      let newStemsCount = 0;
      for (const stemId of text.stemIds) {
        if (filteredStemIds.has(stemId) && !accumulated.has(stemId)) {
          accumulated.add(stemId);
          newStemsCount++;
        }
      }
      
      const colorIndex = data.texts.findIndex(t => t.id === id);
      
      steps.push({
        id,
        label: text.label,
        shortLabel: text.label.length > 12 ? text.label.substring(0, 12) + '...' : text.label,
        newStems: newStemsCount,
        cumulative: accumulated.size,
        colorIndex,
      });
    }
    
    return {
      chartData: steps,
      accumulatedStems: accumulated.size,
      tierStemIds: filteredStemIds.size,
    };
  }, [order, data.texts, selectedTier]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    setOrder((prev) => {
      const newOrder = [...prev];
      const [removed] = newOrder.splice(dragIndex, 1);
      newOrder.splice(dropIndex, 0, removed);
      return newOrder;
    });
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 md:p-8 shadow-sm">
      <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif text-primary-text mb-1 sm:mb-2">
            {language === 'ru' ? 'Кривая накопления корпуса' : 'Corpus Accumulation Curve'}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {language === 'ru'
              ? 'Как растёт словарный запас при чтении в разном порядке.'
              : 'See how vocabulary grows as you read texts in different orders.'}
          </p>
        </div>
        
        <div className="flex flex-col items-start md:items-end gap-2">
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
            {language === 'ru' ? 'Показано' : 'Showing'} <span className="font-mono text-foreground">{accumulatedStems.toLocaleString()}</span> {language === 'ru' ? 'из' : 'of'}{' '}
            <span className="font-mono text-foreground">{tierStemIds.toLocaleString()}</span> {language === 'ru' ? 'слов (фильтр)' : 'words (filtered)'}
          </p>
        </div>
      </div>

      <div className="mb-4 overflow-x-auto pb-2">
        <div className="flex gap-1 min-w-max">
          {!isDefaultOrder && (
            <button
              onClick={() => setOrder([...data.texts].sort((a, b) => a.totalUniqueStems - b.totalUniqueStems).map(t => t.id))}
              className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground bg-background border border-border rounded-md hover:border-primary/50 transition-colors mr-2 flex-shrink-0"
            >
              <RotateCcw size={12} />
              <span>{language === 'ru' ? 'Сбросить' : 'Reset'}</span>
            </button>
          )}
          {order.map((id, index) => {
            const text = data.texts.find(t => t.id === id);
            if (!text) return null;
            const isDragging = dragIndex === index;
            const isDragOver = dragOverIndex === index && dragIndex !== index;
            
            return (
              <div
                key={id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-1 px-2 py-1 rounded-md border cursor-grab active:cursor-grabbing transition-all flex-shrink-0 ${
                  isDragging ? 'opacity-50 border-primary' : 'border-border hover:border-primary/50'
                } ${isDragOver ? 'border-t-2 border-primary' : ''}`}
                style={{ backgroundColor: `color-mix(in srgb, ${getTextColor(index)} 15%, transparent)` }}
              >
                <GripVertical size={12} className="text-muted-foreground/50" />
                <span className="text-xs font-medium truncate max-w-[80px]">{text.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, bottom: 60, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="shortLabel"
              stroke="var(--color-muted-foreground)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis
              yAxisId="left"
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              domain={[0, tierStemIds + 100]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
                      <p className="text-sm font-medium text-foreground mb-2">{d.label}</p>
                      <div className="flex justify-between items-center text-sm gap-4">
                        <span className="text-primary-text">{language === 'ru' ? 'Новых слов' : 'New words'}:</span>
                        <span className="font-mono font-semibold">+{d.newStems.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm gap-4">
                        <span className="text-secondary">{language === 'ru' ? 'Всего' : 'Total'}:</span>
                        <span className="font-mono">{d.cumulative.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ fill: 'var(--color-muted)', opacity: 0.3 }}
            />
            <Bar
              yAxisId="left"
              dataKey="newStems"
              animationDuration={300}
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.id}`} fill={getTextColor(entry.colorIndex)} />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              stroke="var(--color-secondary)"
              strokeWidth={2}
              dot={false}
              animationDuration={300}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-border text-center text-xs text-muted-foreground">
        {language === 'ru' ? 'Перетащите тексты для изменения порядка' : 'Drag texts to reorder'}
      </div>
    </div>
  );
}