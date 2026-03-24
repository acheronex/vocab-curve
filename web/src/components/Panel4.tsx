import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { AnalysisResult } from '../hooks/useAnalysisData';
import { type FrequencyTierName, useTierFilteredVocabulary } from '../hooks/useAnalysisData';
import { useLanguage } from '../App';
import { t } from '../i18n/translations';

function HighlightedSentence({ sentence, word, forms }: { sentence: string; word: string; forms: string[] }) {
  const allForms = useMemo(() => {
    const set = new Set([word, ...forms]);
    return [...set].sort((a, b) => b.length - a.length);
  }, [word, forms]);

  const parts = useMemo(() => {
    const pattern = allForms.map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    return sentence.split(regex);
  }, [sentence, allForms]);

  const formsLower = useMemo(() => new Set(allForms.map(f => f.toLowerCase())), [allForms]);

  return (
    <span>
      {parts.map((part, i) =>
        formsLower.has(part.toLowerCase()) ? (
          <mark key={i} className="bg-primary/25 text-foreground rounded-sm px-0.5 not-italic font-medium">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

interface Panel4Props {
  data: AnalysisResult | null;
  selectedSectionIndex: number | null;
  onClearSelection: () => void;
  wordMode: 'all' | 'new';
}

const TIER_BUTTONS: { tier: FrequencyTierName | 'all'; labelEn: string; labelRu: string; color: string }[] = [
  { tier: 'all', labelEn: 'All', labelRu: 'Все', color: '#6b7280' },
  { tier: 'core', labelEn: 'Core (20+)', labelRu: 'Core (20+)', color: '#22c55e' },
  { tier: 'medium', labelEn: 'Medium (6-19)', labelRu: 'Средние (6-19)', color: '#f59e0b' },
  { tier: 'rare', labelEn: 'Rare (2-5)', labelRu: 'Редкие (2-5)', color: '#60a5fa' },
];

export function Panel4({ data, selectedSectionIndex, onClearSelection, wordMode }: Panel4Props) {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<FrequencyTierName | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(50);

  useEffect(() => { setVisibleCount(50); }, [selectedSectionIndex]);

  const section = useMemo(() => {
    if (!data || selectedSectionIndex === null) return null;
    return data.sections.find((s) => s.index === selectedSectionIndex) || null;
  }, [data, selectedSectionIndex]);

  // Reuse the existing hook from useAnalysisData.ts for tier filtering
  const filteredByTier = useTierFilteredVocabulary(data, selectedTier);

  const wordsToDisplay = useMemo(() => {
    if (!data) return [];

    let words = filteredByTier;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      words = words.filter(
        (w) =>
          w.stem.toLowerCase().includes(query) ||
          w.displayForm.toLowerCase().includes(query) ||
          Object.keys(w.forms).some((f) => f.toLowerCase().includes(query))
      );
    } else if (selectedSectionIndex !== null) {
      if (wordMode === 'all') {
        // All unique words that appear in this section
        words = words.filter((w) => w.sections.includes(selectedSectionIndex));
      } else {
        // Only words whose first appearance is this section
        words = words.filter((w) =>
          w.sections.length > 0 && w.sections[0] === selectedSectionIndex
        );
      }
      words = [...words].sort((a, b) =>
        (b.sectionCounts?.[selectedSectionIndex] ?? 0) - (a.sectionCounts?.[selectedSectionIndex] ?? 0)
      );
    } else {
      // No section selected: both modes show the same thing (all words by frequency)
      words = [...words].sort((a, b) => b.totalCount - a.totalCount);
    }

    return words;
  }, [filteredByTier, selectedSectionIndex, searchQuery, wordMode]);

  const visibleWords = useMemo(() => {
    if (searchQuery) return wordsToDisplay;
    return wordsToDisplay.slice(0, visibleCount);
  }, [wordsToDisplay, visibleCount, searchQuery]);

  const remainingCount = searchQuery ? 0 : Math.max(0, wordsToDisplay.length - visibleCount);

  const wordDetails = useMemo(() => {
    if (!data || !selectedWord) return null;
    return data.vocabulary.find((w) => w.stem === selectedWord) || null;
  }, [data, selectedWord]);

  const handleTierChange = (tier: FrequencyTierName | 'all') => {
    setSelectedTier(tier);
    setVisibleCount(50);
  };

  if (!data) return null;

  return (
    <div className="w-full h-full bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-serif text-foreground mb-1">{language === 'ru' ? 'Исследование слов' : 'Word Explorer'}</h2>
            <p className="text-muted-foreground text-sm">
              {selectedSectionIndex !== null && section
                ? (wordMode === 'all'
                    ? (language === 'ru'
                        ? `Все уникальные слова в разделе ${section.index + 1}: ${section.title}`
                        : `All unique words in Topic ${section.index + 1}: ${section.title}`)
                    : (language === 'ru'
                        ? `Новые слова в разделе ${section.index + 1}: ${section.title}`
                        : `New words in Topic ${section.index + 1}: ${section.title}`))
                : searchQuery
                  ? (language === 'ru' ? 'Результаты поиска' : 'Search results')
                  : (language === 'ru'
                      ? `Топ ${Math.min(visibleCount, wordsToDisplay.length)} самых частых слов`
                      : `Top ${Math.min(visibleCount, wordsToDisplay.length)} most frequent words`)}
            </p>
          </div>
          {section && (
            <button
              onClick={() => {
                onClearSelection();
                setVisibleCount(50);
              }}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 transition-colors"
              title={t('Clear selection', language)}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder={language === 'ru' ? 'Поиск по словарю...' : 'Search vocabulary...'}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(50);
            }}
            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setVisibleCount(50);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-2 bg-background p-1 rounded-lg border border-border">
          {TIER_BUTTONS.map((btn) => (
            <button
              key={btn.tier}
              onClick={() => handleTierChange(btn.tier)}
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

      </div>

      <div className="flex-1 min-h-[300px] flex flex-col md:flex-row gap-6 overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {visibleWords.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              {t('No words found.', language)}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 content-start">
              {visibleWords.map((word) => (
                <button
                  key={word.stem}
                  onClick={() => setSelectedWord(word.stem)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    selectedWord === word.stem
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-background border border-border text-foreground hover:border-primary/50 hover:text-primary'
                  }`}
                >
                  {word.displayForm}
                  <span className="ml-2 text-xs opacity-60 font-mono">
                    {selectedSectionIndex !== null
                      ? word.sectionCounts?.[selectedSectionIndex] ?? 0
                      : word.totalCount}
                  </span>
                </button>
              ))}
              {remainingCount > 0 && (
                <div className="w-full flex justify-center mt-4">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 50)}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground bg-background border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    {t('Show 50 more', language)} ({wordsToDisplay.length} {language === 'ru' ? 'всего' : 'total'})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {wordDetails && (
          <div className="w-full md:w-1/3 bg-background border border-border rounded-lg p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-2xl font-serif text-foreground">{wordDetails.displayForm}</h3>
                <span className="font-mono text-primary bg-primary/10 px-2 py-1 rounded text-sm">
                  {wordDetails.totalCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">{language === 'ru' ? 'стем' : 'stem'}: {wordDetails.stem}</p>
            </div>

            {wordDetails.exampleSentence && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {t('Example Sentence', language)}
                </h4>
                <div className="text-sm text-foreground/90 leading-relaxed bg-card border border-border rounded-md p-3 italic">
                  <HighlightedSentence
                    sentence={wordDetails.exampleSentence}
                    word={wordDetails.displayForm}
                    forms={Object.keys(wordDetails.forms)}
                  />
                  {wordDetails.exampleSentenceSection !== undefined && (
                    <span className="block text-xs text-muted-foreground mt-2 not-italic">
                      — {(() => {
                        const sec = data.sections.find(s => s.index === wordDetails.exampleSentenceSection);
                        return sec ? sec.title : `${language === 'ru' ? 'Раздел' : 'Section'} ${wordDetails.exampleSentenceSection + 1}`;
                      })()}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {t('Forms', language)}
              </h4>
              <div className="flex flex-col gap-1">
                {Object.entries(wordDetails.forms)
                  .sort(([, a], [, b]) => b - a)
                  .map(([form, count]) => (
                    <div key={form} className="flex justify-between text-sm">
                      <span className="text-foreground">{form}</span>
                      <span className="text-muted-foreground font-mono">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {language === 'ru' ? `Встречается в ${wordDetails.sections.length} разделах` : `Appears in ${wordDetails.sections.length} sections`}
              </h4>
              <div className="flex flex-wrap gap-1">
                {wordDetails.sections.map((idx) => {
                  const sec = data.sections.find(s => s.index === idx);
                  const title = sec ? sec.title : `${language === 'ru' ? 'Раздел' : 'Section'} ${idx + 1}`;
                  return (
                    <div
                      key={idx}
                      className="w-4 h-4 rounded-sm bg-secondary/20 border border-secondary/30 flex items-center justify-center text-[10px] text-secondary"
                      title={title}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
