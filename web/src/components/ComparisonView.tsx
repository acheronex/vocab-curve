import { useMemo } from 'react';
import type { ComparisonResult } from '../hooks/useComparisonData';
import { PanelALadder } from './comparison/PanelALadder';
import { PanelBCoverage } from './comparison/PanelBCoverage';
import { PanelCCurves } from './comparison/PanelCCurves';
import { PanelDBridge } from './comparison/PanelDBridge';
import { PanelEOverview } from './comparison/PanelEOverview';
import { PanelFCorpusStats } from './comparison/PanelFCorpusStats';
import { useLanguage } from '../App';

const MIN_SELECTED = 2;

interface ComparisonViewProps {
  data: ComparisonResult;
  selectedIds: string[];
  onToggleText: (id: string) => void;
}

export function ComparisonView({ data, selectedIds }: ComparisonViewProps) {
  const { language } = useLanguage();

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filteredData = useMemo((): ComparisonResult => {
    const texts = data.texts.filter((t) => selectedIdSet.has(t.id));
    const textIds = new Set(texts.map((t) => t.id));

    const coverage = data.coverage.filter(
      (c) => textIds.has(c.sourceId) && textIds.has(c.targetId),
    );

    const filteredSteps = data.cumulativeLadder.steps.filter((s) =>
      textIds.has(s.id),
    );
    const stepsWithCoverage = filteredSteps.map((step, idx) => ({
      ...step,
      coverageOfNext:
        idx < filteredSteps.length - 1
          ? (data.coverage.find(
              (c) =>
                c.sourceId === step.id &&
                c.targetId === filteredSteps[idx + 1].id,
            )?.coveragePercent ?? null)
          : null,
    }));

    return {
      ...data,
      texts,
      coverage,
      cumulativeLadder: {
        steps: stepsWithCoverage,
        finalVocabulary:
          stepsWithCoverage.length > 0
            ? stepsWithCoverage[stepsWithCoverage.length - 1].cumulativeStems
            : 0,
      },
    };
  }, [data, selectedIdSet]);

  const colorIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    data.texts.forEach((text, i) => map.set(text.id, i));
    return map;
  }, [data.texts]);

  const hasEnoughSelected = selectedIdSet.size >= MIN_SELECTED;

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {!hasEnoughSelected ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground text-lg font-serif">
            {language === 'ru'
              ? 'Выберите минимум 2 текста для отображения панелей сравнения'
              : 'Select at least 2 texts for the comparison panels to appear'}
          </p>
        </div>
      ) : (
        <>
          <section>
            <PanelALadder data={filteredData} colorIndexMap={colorIndexMap} />
          </section>

          <section>
            <PanelBCoverage data={filteredData} />
          </section>

          <section>
            <PanelFCorpusStats data={filteredData} colorIndexMap={colorIndexMap} />
          </section>

          <section>
            <PanelEOverview data={filteredData} colorIndexMap={colorIndexMap} />
          </section>

          <section>
            <PanelCCurves data={filteredData} colorIndexMap={colorIndexMap} />
          </section>

          <section>
            <PanelDBridge data={filteredData} />
          </section>
        </>
      )}
    </div>
  );
}
