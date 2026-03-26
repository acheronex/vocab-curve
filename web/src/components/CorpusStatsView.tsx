import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { ComparisonResult } from '../hooks/useComparisonData';
import { useLanguage } from '../App';
import { getTextColor, getTextContrastColor } from '../utils/colors';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { InfoTooltip } from './InfoTooltip';

interface CorpusStatsViewProps {
  data: ComparisonResult;
}

type SortKey = 'label' | 'totalWords' | 'totalTokens' | 'totalUniqueStems' | 'sections' | 'densityNormalized' | 'coreCoverage';

export function CorpusStatsView({ data }: CorpusStatsViewProps) {
  const { language } = useLanguage();
  const [sortKey, setSortKey] = useState<SortKey>('totalUniqueStems');
  const [sortAsc, setSortAsc] = useState(false);
  const [wordSearch, setWordSearch] = useState('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

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
      .slice(0, 30)
      .map(([word, count]) => ({ word, count }));
    
    const stemsChartData = [...data.texts]
      .sort((a, b) => b.totalUniqueStems - a.totalUniqueStems)
      .map((t) => ({
        name: t.label.length > 20 ? t.label.substring(0, 20) + '...' : t.label,
        fullName: t.label,
        stems: t.totalUniqueStems,
        colorIndex: data.texts.findIndex(tt => tt.id === t.id),
      }));
    
    const densityChartData = [...data.texts]
      .sort((a, b) => b.densityNormalized - a.densityNormalized)
      .map((t) => ({
        name: t.label.length > 20 ? t.label.substring(0, 20) + '...' : t.label,
        fullName: t.label,
        density: t.densityNormalized,
        colorIndex: data.texts.findIndex(tt => tt.id === t.id),
      }));
    
    return {
      totalWords,
      totalTokens,
      totalUniqueStems,
      avgUniqueStems,
      avgDensity,
      overlapPercent,
      sortedByDensity,
      topCorpusWords,
      stemsChartData,
      densityChartData,
    };
  }, [data]);

  const sortedTexts = useMemo(() => {
    return [...data.texts].sort((a, b) => {
      let aVal: string | number = a[sortKey];
      let bVal: string | number = b[sortKey];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [data.texts, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortHeader = ({ label, sortValue }: { label: string; sortValue: SortKey }) => (
    <th
      className="text-right py-2 px-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
      onClick={() => handleSort(sortValue)}
    >
      <span className="flex items-center justify-end gap-1">
        {label}
        {sortKey === sortValue && (
          <span className="text-xs">{sortAsc ? '▲' : '▼'}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 md:p-8 shadow-sm overflow-hidden">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-serif text-primary-text mb-1 sm:mb-2">
            {language === 'ru' ? 'Статистика корпуса' : 'Corpus Statistics'}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {language === 'ru'
              ? `Обзор всего корпуса из ${data.texts.length} текстов`
              : `Overview of the entire corpus of ${data.texts.length} texts`}
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
              {language === 'ru' ? 'Пересечение' : 'Overlap'}
            </div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-primary-text">
              {data.texts.length}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              {language === 'ru' ? 'Текстов' : 'Texts'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center text-xs sm:text-sm border-t border-border pt-4">
          <div>
            <span className="text-muted-foreground">{language === 'ru' ? 'Токенов:' : 'Tokens:'}</span>{' '}
            <span className="font-semibold">{stats.totalTokens.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{language === 'ru' ? 'Ср. лемм:' : 'Avg. Stems:'}</span>{' '}
            <span className="font-semibold">{stats.avgUniqueStems.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{language === 'ru' ? 'Ср. плотность:' : 'Avg. Density:'}</span>{' '}
            <span className="font-semibold">{stats.avgDensity}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{language === 'ru' ? 'Секций:' : 'Sections:'}</span>{' '}
            <span className="font-semibold">{data.texts.reduce((sum, t) => sum + t.sections, 0)}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 md:p-8 shadow-sm overflow-hidden">
          <h3 className="text-lg sm:text-xl font-serif text-primary-text-text mb-3 sm:mb-4">
            {language === 'ru' ? 'Словарный запас по текстам' : 'Vocabulary by Text'}
          </h3>
          <p className="text-xs text-muted-foreground mb-3 sm:mb-4">
            {language === 'ru'
              ? 'Общее количество уникальных лемм в каждом тексте'
              : 'Total unique word stems per text'}
          </p>
          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.stemsChartData} layout="vertical" margin={{ left: 0, right: 40, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" stroke="var(--color-muted-foreground)" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="var(--color-muted-foreground)" 
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '0.5rem',
                    color: 'var(--color-foreground)'
                  }}
                  itemStyle={{
                    color: 'var(--color-foreground)'
                  }}
                  labelStyle={{
                    color: 'var(--color-foreground)'
                  }}
                  formatter={(value) => [Number(value).toLocaleString(), language === 'ru' ? 'Лемм' : 'Stems']}
                  labelFormatter={(label) => stats.stemsChartData.find(d => d.name === label)?.fullName || label}
                />
                <Bar dataKey="stems" radius={[0, 4, 4, 0]}>
                  {stats.stemsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getTextColor(entry.colorIndex)} />
                  ))}
                  <LabelList 
                    dataKey="stems" 
                    position="right" 
                    formatter={(value) => Number(value).toLocaleString()}
                    style={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 md:p-8 shadow-sm overflow-hidden">
          <h3 className="text-lg sm:text-xl font-serif text-primary-text-text mb-3 sm:mb-4">
            {language === 'ru' ? 'Плотность словаря' : 'Vocabulary Density'}
          </h3>
          <p className="text-xs text-muted-foreground mb-3 sm:mb-4">
            {language === 'ru'
              ? 'Индекс Гиро (V/√N)'
              : "Guiraud's Index (V/√N)"}
          </p>
          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.densityChartData} layout="vertical" margin={{ left: 0, right: 40, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" stroke="var(--color-muted-foreground)" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="var(--color-muted-foreground)" 
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '0.5rem',
                    color: 'var(--color-foreground)'
                  }}
                  itemStyle={{
                    color: 'var(--color-foreground)'
                  }}
                  labelStyle={{
                    color: 'var(--color-foreground)'
                  }}
                  formatter={(value) => [Number(value).toFixed(2), 'Index']}
                  labelFormatter={(label) => stats.densityChartData.find(d => d.name === label)?.fullName || label}
                />
                <Bar dataKey="density" radius={[0, 4, 4, 0]}>
                  {stats.densityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getTextColor(entry.colorIndex)} />
                  ))}
                  <LabelList 
                    dataKey="density" 
                    position="right" 
                    formatter={(value) => Number(value).toFixed(2)}
                    style={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 md:p-8 shadow-sm overflow-hidden">
          <h3 className="text-lg sm:text-xl font-serif text-primary-text-text mb-3 sm:mb-4">
            {language === 'ru' ? 'Рейтинг по сложности' : 'Difficulty Ranking'}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {language === 'ru'
              ? 'Отсортировано по нормализованной плотности'
              : 'Sorted by normalized density'}
          </p>
          <div className="space-y-1.5 sm:space-y-2 max-h-[280px] sm:max-h-[400px] overflow-y-auto">
            {stats.sortedByDensity.map((text, idx) => (
              <div
                key={text.id}
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors min-w-0"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
                  <span
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: getTextColor(idx), color: getTextContrastColor(idx) }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-xs sm:text-sm truncate">{text.label}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-shrink-0">
                  <span className="text-muted-foreground hidden sm:inline">
                    {text.totalUniqueStems.toLocaleString()} {language === 'ru' ? 'лемм' : 'stems'}
                  </span>
                  <span className="font-mono font-semibold" style={{ color: getTextColor(idx) }}>
                    {text.densityNormalized.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 md:p-8 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-serif text-primary-text">
              {language === 'ru' ? 'Частые слова корпуса' : 'Most Common Corpus Words'}
            </h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={wordSearch}
                onChange={(e) => setWordSearch(e.target.value)}
                placeholder={language === 'ru' ? 'Поиск слова...' : 'Search word...'}
                className="w-full sm:w-48 pl-8 pr-8 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
              />
              {wordSearch && (
                <button
                  onClick={() => setWordSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {language === 'ru'
              ? 'Слова, часто встречающиеся во всех текстах'
              : 'Words appearing frequently across all texts'}
          </p>
          
          {selectedWord ? (
            <div className="mb-4">
              <button
                onClick={() => setSelectedWord(null)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
              >
                <X className="w-3 h-3" />
                {language === 'ru' ? 'Назад к списку' : 'Back to list'}
              </button>
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="text-lg font-serif mb-2">{selectedWord}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {language === 'ru' ? 'Встречается в текстах:' : 'Appears in texts:'}
                </p>
                <div className="space-y-2">
                  {stats.topCorpusWords
                    .filter(w => w.word === selectedWord)
                    .map(({ word, count }) => (
                      <div key={word} className="text-sm">
                        <span className="font-mono font-semibold">{count.toLocaleString()}</span>
                        <span className="text-muted-foreground ml-2">{language === 'ru' ? 'упоминаний' : 'occurrences'}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 max-h-[280px] sm:max-h-[400px] overflow-y-auto">
              {stats.topCorpusWords
                .filter(({ word }) => word.toLowerCase().includes(wordSearch.toLowerCase()))
                .slice(0, 30)
                .map(({ word, count }, idx) => (
                  <button
                    key={word}
                    onClick={() => setSelectedWord(word)}
                    className="flex items-center justify-between p-1.5 sm:p-2 rounded bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <span className="text-[10px] sm:text-xs text-muted-foreground w-4 flex-shrink-0">{idx + 1}.</span>
                      <span className="text-xs sm:text-sm font-medium truncate">{word}</span>
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                      {count.toLocaleString()}×
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

<div className="bg-card border border-border rounded-xl p-4 sm:p-6 md:p-8 shadow-sm overflow-hidden">
        <h3 className="text-lg sm:text-xl font-serif text-primary-text-text mb-3 sm:mb-4">
          {language === 'ru' ? 'Все тексты корпуса' : 'All Corpus Texts'}
        </h3>
        <p className="text-xs text-muted-foreground mb-3 sm:mb-4">
          {language === 'ru' ? 'Нажмите на заголовок для сортировки' : 'Click column headers to sort'}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th
                  className="text-left py-2 px-2 sm:px-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  onClick={() => handleSort('label')}
                >
                  <span className="flex items-center gap-1">
                    {language === 'ru' ? 'Текст' : 'Text'}
                    {sortKey === 'label' && (
                      <span className="text-xs">{sortAsc ? '▲' : '▼'}</span>
                    )}
                  </span>
                </th>
                <SortHeader label={language === 'ru' ? 'Слов' : 'Words'} sortValue="totalWords" />
                <th className="text-right py-2 px-2 sm:px-3 font-medium text-muted-foreground">
                  <span className="flex items-center justify-end gap-1">
                    {language === 'ru' ? 'Токенов' : 'Tokens'}
                    <InfoTooltip type="tokens" />
                  </span>
                </th>
                <SortHeader label={language === 'ru' ? 'Лемм' : 'Stems'} sortValue="totalUniqueStems" />
                <SortHeader label={language === 'ru' ? 'Секций' : 'Sections'} sortValue="sections" />
                <SortHeader label={language === 'ru' ? 'Плотность' : 'Density'} sortValue="densityNormalized" />
                <SortHeader label={language === 'ru' ? 'Ядро %' : 'Core %'} sortValue="coreCoverage" />
              </tr>
            </thead>
            <tbody>
              {sortedTexts.map((text) => {
                const originalIdx = data.texts.findIndex(t => t.id === text.id);
                return (
                  <tr key={text.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-2 px-2 sm:px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getTextColor(originalIdx) }}
                        />
                        <span className="truncate max-w-[150px] sm:max-w-[300px]">{text.label}</span>
                      </div>
                    </td>
                    <td className="text-right py-2 px-2 sm:px-3 font-mono">{text.totalWords.toLocaleString()}</td>
                    <td className="text-right py-2 px-2 sm:px-3 font-mono">{text.totalTokens.toLocaleString()}</td>
                    <td className="text-right py-2 px-2 sm:px-3 font-mono">{text.totalUniqueStems.toLocaleString()}</td>
                    <td className="text-right py-2 px-2 sm:px-3 font-mono">{text.sections}</td>
                    <td className="text-right py-2 px-2 sm:px-3 font-mono font-semibold" style={{ color: getTextColor(originalIdx) }}>
                      {text.densityNormalized.toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-2 sm:px-3 font-mono">{text.coreCoverage.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
