import { useMemo } from 'react';
import type { ComparisonResult } from '../../hooks/useComparisonData';
import { useLanguage } from '../../App';
import { getTextColor, getTextContrastColor } from '../../utils/colors';

interface PanelFCorpusStatsProps {
  data: ComparisonResult;
  colorIndexMap: Map<string, number>;
}

export function PanelFCorpusStats({ data, colorIndexMap }: PanelFCorpusStatsProps) {
  const { language } = useLanguage();

  const stats = useMemo(() => {
    const totalWords = data.texts.reduce((sum, t) => sum + t.totalWords, 0);
    const totalTokens = data.texts.reduce((sum, t) => sum + t.totalTokens, 0);
    const totalUniqueStems = data.globalVocabulary.length;
    
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
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 md:p-8 shadow-sm overflow-hidden">
      <div className="mb-4 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-serif text-primary-text mb-1 sm:mb-2">
          {language === 'ru' ? 'Статистика выбранных текстов' : 'Selected Texts Statistics'}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {language === 'ru'
            ? 'Обзор словарного запаса по выбранным текстам'
            : 'Vocabulary overview across selected texts'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-muted/30 rounded-lg p-3 sm:p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-primary-text">
            {stats.totalWords.toLocaleString()}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">
            {language === 'ru' ? 'Всего слов' : 'Total Words'}
          </div>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-3 sm:p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-primary-text">
            {stats.totalUniqueStems.toLocaleString()}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">
            {language === 'ru' ? 'Уникальных лемм' : 'Unique Stems'}
          </div>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-3 sm:p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-primary-text">
            {stats.overlapPercent}%
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">
            {language === 'ru' ? 'Пересечение словаря' : 'Vocabulary Overlap'}
          </div>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-3 sm:p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-primary-text">
            {stats.avgDensity}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">
            {language === 'ru' ? 'Ср. плотность' : 'Avg. Density'}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
        <div>
          <h3 className="text-base sm:text-lg font-serif text-primary-text mb-3 sm:mb-4">
            {language === 'ru' ? 'Рейтинг сложности' : 'Difficulty Ranking'}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {language === 'ru'
              ? 'Отсортировано по нормализованной плотности (индекс Гиро)'
              : 'Sorted by normalized density (Guiraud\'s Index)'}
          </p>
          <div className="space-y-1.5 sm:space-y-2 max-h-[280px] sm:max-h-[400px] overflow-y-auto">
            {stats.sortedByDensity.map((text, idx) => {
              const colorIdx = colorIndexMap.get(text.id) ?? 0;
              const color = getTextColor(colorIdx);
              return (
                <div
                  key={text.id}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors min-w-0"
                >
                  <span
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: color, color: getTextContrastColor(colorIdx) }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <span className="text-xs sm:text-sm truncate block">{text.label}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-shrink-0">
                    <span className="text-muted-foreground hidden sm:inline">
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
          <h3 className="text-base sm:text-lg font-serif text-primary-text mb-3 sm:mb-4">
            {language === 'ru' ? 'Частые слова корпуса' : 'Most Common Corpus Words'}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {language === 'ru'
              ? 'Слова, часто встречающиеся во всех текстах'
              : 'Words appearing frequently across all texts'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 max-h-[280px] sm:max-h-[400px] overflow-y-auto">
            {stats.topCorpusWords.slice(0, 16).map(({ word, count }, idx) => (
              <div
                key={word}
                className="flex items-center justify-between p-1.5 sm:p-2 rounded bg-muted/20"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="text-xs text-muted-foreground w-4 flex-shrink-0">{idx + 1}.</span>
                  <span className="text-xs sm:text-sm font-medium truncate">{word}</span>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {count.toLocaleString()}×
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center text-xs sm:text-sm">
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
