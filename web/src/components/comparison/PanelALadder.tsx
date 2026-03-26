import { useState, useMemo, useCallback, useEffect } from 'react';
import type { ComparisonResult } from '../../hooks/useComparisonData';
import { ArrowDown, GripVertical, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../App';
import { t } from '../../i18n/translations';
import { getBarBgStyle } from '../../utils/colors';

interface PanelALadderProps {
  data: ComparisonResult;
  colorIndexMap: Map<string, number>;
}

function recalculateLadder(
  orderedIds: string[],
  texts: ComparisonResult['texts']
) {
  const accumulated = new Set<string>();
  const accumulatedAtStep: Set<string>[] = [];
  const steps: Array<{
    id: string;
    label: string;
    stemsAdded: number;
    cumulativeStems: number;
    coverageOfNext: number | null;
  }> = [];

  for (const id of orderedIds) {
    const text = texts.find((t) => t.id === id)!;
    const stemsAdded = text.stems.filter((s) => !accumulated.has(s)).length;
    text.stems.forEach((s) => accumulated.add(s));
    accumulatedAtStep.push(new Set(accumulated));
    steps.push({
      id,
      label: text.label,
      stemsAdded,
      cumulativeStems: accumulated.size,
      coverageOfNext: null,
    });
  }

  for (let i = 0; i < steps.length - 1; i++) {
    const nextText = texts.find((t) => t.id === steps[i + 1].id)!;
    let covered = 0;
    for (const s of nextText.stems) {
      if (accumulatedAtStep[i].has(s)) covered++;
    }
    steps[i].coverageOfNext =
      Math.round((covered / nextText.stems.length) * 1000) / 10;
  }

  return { steps, finalVocabulary: accumulated.size };
}

export function PanelALadder({ data, colorIndexMap }: PanelALadderProps) {
  const { language } = useLanguage();

  const defaultOrder = useMemo(
    () => data.cumulativeLadder.steps.map((s) => s.id),
    [data]
  );

  const [order, setOrder] = useState<string[]>(defaultOrder);
  useEffect(() => { setOrder(defaultOrder); }, [defaultOrder]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const isDefaultOrder =
    order.length === defaultOrder.length &&
    order.every((id, i) => id === defaultOrder[i]);

  const { steps, finalVocabulary } = useMemo(() => {
    if (isDefaultOrder) {
      return data.cumulativeLadder;
    }
    const validIds = new Set(data.texts.map((t) => t.id));
    const validOrder = order.filter((id) => validIds.has(id));
    const missingIds = data.texts
      .map((t) => t.id)
      .filter((id) => !validOrder.includes(id));
    const effectiveOrder = [...validOrder, ...missingIds];
    if (effectiveOrder.length === 0) {
      return { steps: [], finalVocabulary: 0 };
    }
    return recalculateLadder(effectiveOrder, data.texts);
  }, [order, data, isDefaultOrder]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
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
    },
    [dragIndex]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 md:p-8 shadow-sm overflow-hidden">
      <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-start justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif text-primary-text mb-1 sm:mb-2">
            {t('The Language Learning Ladder', language)}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('How vocabulary builds', language)}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {t('Drag to reorder', language)}
          </span>
          {!isDefaultOrder && (
            <button
              onClick={() => setOrder(defaultOrder)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-background border border-border rounded-md hover:border-primary/50 transition-colors"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">{t('Reset order', language)}</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {steps.map((step, index) => {
          const previousCumulative =
            index > 0 ? steps[index - 1].cumulativeStems : 0;
          const effectiveStemsAdded = step.cumulativeStems - previousCumulative;
          const previousWidthPercent =
            (previousCumulative / finalVocabulary) * 100;
          const newWidthPercent =
            (effectiveStemsAdded / finalVocabulary) * 100;
          const colorIdx = colorIndexMap.get(step.id) ?? index;
          const isDragging = dragIndex === index;
          const isDragOver = dragOverIndex === index && dragIndex !== index;

          return (
            <div
              key={step.id}
              className={`relative group transition-all duration-150 ${
                isDragging ? 'opacity-50' : ''
              } ${isDragOver ? 'border-t-2 border-primary' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex flex-row items-center gap-2 sm:gap-4 mb-2 transition-all duration-200 group-hover:translate-x-1">
                <div className="w-6 sm:w-8 flex-shrink-0">
                  <GripVertical
                    size={16}
                    className="text-muted-foreground/50 cursor-grab active:cursor-grabbing"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-sm sm:text-base font-medium text-foreground truncate group-hover:text-primary-text transition-colors">
                      {step.label}
                    </span>
                    <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                      +{effectiveStemsAdded.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-6 sm:h-8 md:h-10 bg-background rounded-md overflow-hidden flex relative border border-border transition-shadow group-hover:shadow-md group-hover:border-primary/30">
                    {index > 0 && (
                      <div
                        className="h-full bg-muted opacity-50 transition-all duration-1000 ease-out"
                        style={{ width: `${previousWidthPercent}%` }}
                      />
                    )}
                    <div
                      className="h-full transition-all duration-1000 ease-out"
                      style={{ ...getBarBgStyle(colorIdx), width: `${newWidthPercent}%` }}
                    />
                  </div>
                </div>
                <div className="text-right font-mono text-xs sm:text-sm flex-shrink-0 w-20 sm:w-28 md:w-32">
                  <span className="text-foreground font-bold">
                    {step.cumulativeStems.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground text-[10px] sm:text-xs block">
                    {t('stems total', language)}
                  </span>
                </div>
              </div>

              {step.coverageOfNext !== null && (
                <div className="flex items-center gap-2 sm:gap-4 my-3 sm:my-4 ml-6 sm:ml-8">
                  <div className="flex flex-col items-center">
                    <div className="w-px h-4 sm:h-8 bg-border"></div>
                    <div className="bg-background border border-border rounded-full p-0.5 sm:p-1 z-10 -my-2 sm:-my-3">
                      <ArrowDown
                        size={14}
                        className="text-muted-foreground sm:w-4 sm:h-4"
                      />
                    </div>
                    <div className="w-px h-4 sm:h-8 bg-border"></div>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground bg-background border border-border px-2 sm:px-3 py-1 sm:py-1.5 rounded-md">
                    {t('Covers', language)}{' '}
                    <strong className="text-foreground">
                      {step.coverageOfNext.toFixed(1)}%
                    </strong>{' '}
                    <span className="hidden sm:inline">{t('of next text', language)}</span>
                    <span className="sm:hidden">→</span>
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
