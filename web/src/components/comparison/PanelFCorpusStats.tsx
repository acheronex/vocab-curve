import { useMemo } from 'react';
import type { ComparisonResult } from '../../hooks/useComparisonData';
import { useLanguage } from '../../App';
import { getTextColor } from '../../utils/colors';

interface PanelFCorpusStatsProps {
  data: ComparisonResult;
  colorIndexMap: Map<string, number>;
}

export function PanelFCorpusStats({ data, colorIndexMap }: PanelFCorpusStatsProps) {
  const { language } = useLanguage();

  const stats = useMemo(() => {
    const totalWords = data.texts.reduce((sum, t) => sum + t.totalWords, 0);
    const totalTokens = data.texts.reduce((sum, t) => sum + t.totalTokens, 0);
    const totalUniqueStems = data.cumulativeLadder.finalVocabulary;
    
    const avgUniqueStems = Math.round(
      data.texts.reduce((sum, t) => sum + t.totalUniqueStems, 0) / data.texts.length
    );
    const avgDensity = (
      data.texts.reduce((sum, t) => sum + t.densityNormalized, 0) / data.texts.length
    ).toFixed(2);
    
    const sumOfIndividualStems = data.texts.reduce((sum, t) => sum + t.totalUniqueStems, 0);
    const overlapCount = sumOfIndividualStems - totalUniqueStems;
    const overlapPercent = ((overlapCount / sumOfIndividualStems) * 100).toFixed(1);
    
    const sortedByDensity = [...data.texts].sort((a, b) => b.densityNormalized - a.densityNormalized);
    
    const wordCounts: Map<string, number> = new Map();
    data.texts.forEach(text => {
      text.topWords.forEach(w => {
        const current = wordCounts.get(w.displayForm) || 0;
        wordCounts.set(w.displayForm, current + w.count);
      });
    });
    const topCorpusWords = [...wordCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
    
    return {
      totalWords,
      totalTokens,
      totalUniqueStems,
      avgUniqueStems,
      avgDensity,
      overlapPercent,
      sortedByDensity,
      topCorpusWords,
    };
  }, [data]);

  return (
    <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-primary mb-2">
          {language === 'ru' ? 'Статистика выбранных текстов' : 'Selected Texts Statistics'}
        </h2>
        <p className="text-muted-foreground">
          {language === 'ru'
            ? 'Обзор словарного запаса по выбранным текстам'
            : 'Vocabulary overview across selected texts'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-primary">
            {stats.totalWords.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {language === 'ru' ? 'Всего слов' : 'Total Words'}
          </div>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-primary">
            {stats.totalUniqueStems.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {language === 'ru' ? 'Уникальных лемм' : 'Unique Stems'}
          </div>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-primary">
            {stats.overlapPercent}%
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {language === 'ru' ? 'Пересечение словаря' : 'Vocabulary Overlap'}
          </div>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-primary">
            {stats.avgDensity}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {language === 'ru' ? 'Ср. плотность' : 'Avg. Density'}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-serif text-primary mb-4">
            {language === 'ru' ? 'Рейтинг сложности' : 'Difficulty Ranking'}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {language === 'ru'
              ? 'Отсортировано по нормализованной плотности (индекс Гиро)'
              : 'Sorted by normalized density (Guiraud\'s Index)'}
          </p>
          <div className="space-y-2">
            {stats.sortedByDensity.map((text, idx) => {
              const colorIdx = colorIndexMap.get(text.id) ?? 0;
              const color = getTextColor(colorIdx);
              return (
                <div
                  key={text.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm truncate max-w-[200px]">{text.label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {text.totalUniqueStems.toLocaleString()} {language === 'ru' ? 'лемм' : 'stems'}
                    </span>
                    <span className="font-mono font-semibold" style={{ color }}>
                      {text.densityNormalized.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-serif text-primary mb-4">
            {language === 'ru' ? 'Частые слова корпуса' : 'Most Common Corpus Words'}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {language === 'ru'
              ? 'Слова, часто встречающиеся во всех текстах'
              : 'Words appearing frequently across all texts'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {stats.topCorpusWords.slice(0, 16).map(({ word, count }, idx) => (
              <div
                key={word}
                className="flex items-center justify-between p-2 rounded bg-muted/20"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                  <span className="text-sm font-medium">{word}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {count.toLocaleString()}×
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
          <div>
            <span className="text-muted-foreground">
              {language === 'ru' ? 'Текстов:' : 'Texts:'}
            </span>{' '}
            <span className="font-semibold">{data.texts.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">
              {language === 'ru' ? 'Токенов:' : 'Tokens:'}
            </span>{' '}
            <span className="font-semibold">{stats.totalTokens.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">
              {language === 'ru' ? 'Ср. лемм:' : 'Avg. Stems:'}
            </span>{' '}
            <span className="font-semibold">{stats.avgUniqueStems.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">
              {language === 'ru' ? 'Секций:' : 'Sections:'}
            </span>{' '}
            <span className="font-semibold">
              {data.texts.reduce((sum, t) => sum + t.sections, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
