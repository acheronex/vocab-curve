import { useMemo, useState } from 'react';
import type { ComparisonResult } from '../hooks/useComparisonData';
import { useLanguage } from '../App';
import { getTextColor } from '../utils/colors';
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
    <div className="space-y-8">
      <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-serif text-primary mb-2">
            {language === 'ru' ? 'Статистика корпуса' : 'Corpus Statistics'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ru'
              ? `Обзор всего корпуса из ${data.texts.length} текстов`
              : `Overview of the entire corpus of ${data.texts.length} texts`}
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
              {data.texts.length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {language === 'ru' ? 'Текстов' : 'Texts'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm border-t border-border pt-4">
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

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
          <h3 className="text-xl font-serif text-primary mb-4">
            {language === 'ru' ? 'Словарный запас по текстам' : 'Vocabulary by Text'}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {language === 'ru'
              ? 'Общее количество уникальных лемм в каждом тексте — выше = богаче словарь'
              : 'Total unique word stems per text — higher = richer vocabulary'}
          </p>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.stemsChartData} layout="vertical" margin={{ left: 20, right: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" stroke="var(--color-muted-foreground)" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="var(--color-muted-foreground)" 
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                  width={120}
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
                    style={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
          <h3 className="text-xl font-serif text-primary mb-4">
            {language === 'ru' ? 'Плотность словаря' : 'Vocabulary Density'}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {language === 'ru'
              ? 'Индекс Гиро (V/√N) — выше = более сложный текст'
              : "Guiraud's Index (V/√N) — higher = more complex text"}
          </p>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.densityChartData} layout="vertical" margin={{ left: 20, right: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" stroke="var(--color-muted-foreground)" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="var(--color-muted-foreground)" 
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                  width={120}
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
                    style={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
          <h3 className="text-xl font-serif text-primary mb-4">
            {language === 'ru' ? 'Рейтинг по сложности' : 'Difficulty Ranking'}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {language === 'ru'
              ? 'Отсортировано по нормализованной плотности'
              : 'Sorted by normalized density'}
          </p>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {stats.sortedByDensity.map((text, idx) => (
              <div
                key={text.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: getTextColor(idx) }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-sm truncate max-w-[250px]">{text.label}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
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

        <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
          <h3 className="text-xl font-serif text-primary mb-4">
            {language === 'ru' ? 'Частые слова корпуса' : 'Most Common Corpus Words'}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {language === 'ru'
              ? 'Слова, часто встречающиеся во всех текстах'
              : 'Words appearing frequently across all texts'}
          </p>
          <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
            {stats.topCorpusWords.map(({ word, count }, idx) => (
              <div
                key={word}
                className="flex items-center justify-between p-2 rounded bg-muted/20"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
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

      <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
        <h3 className="text-xl font-serif text-primary mb-4">
          {language === 'ru' ? 'Все тексты корпуса' : 'All Corpus Texts'}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          {language === 'ru' ? 'Нажмите на заголовок для сортировки' : 'Click column headers to sort'}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th
                  className="text-left py-2 px-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
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
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">
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
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getTextColor(originalIdx) }}
                        />
                        <span className="truncate max-w-[300px]">{text.label}</span>
                      </div>
                    </td>
                    <td className="text-right py-2 px-3 font-mono">{text.totalWords.toLocaleString()}</td>
                    <td className="text-right py-2 px-3 font-mono">{text.totalTokens.toLocaleString()}</td>
                    <td className="text-right py-2 px-3 font-mono">{text.totalUniqueStems.toLocaleString()}</td>
                    <td className="text-right py-2 px-3 font-mono">{text.sections}</td>
                    <td className="text-right py-2 px-3 font-mono font-semibold" style={{ color: getTextColor(originalIdx) }}>
                      {text.densityNormalized.toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-3 font-mono">{text.coreCoverage.toFixed(1)}%</td>
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
