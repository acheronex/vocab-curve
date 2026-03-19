import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { AnalysisResult } from '../hooks/useAnalysisData';
import { useLanguage } from '../App';
import { t } from '../i18n/translations';

interface Panel4Props {
  data: AnalysisResult | null;
  selectedSectionIndex: number | null;
  onClearSelection: () => void;
}

export function Panel4({ data, selectedSectionIndex, onClearSelection }: Panel4Props) {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const section = useMemo(() => {
    if (!data || selectedSectionIndex === null) return null;
    return data.sections.find((s) => s.index === selectedSectionIndex) || null;
  }, [data, selectedSectionIndex]);

  const wordsToDisplay = useMemo(() => {
    if (!data) return [];

    let words = data.vocabulary;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      words = words.filter(
        (w) =>
          w.stem.toLowerCase().includes(query) ||
          w.displayForm.toLowerCase().includes(query) ||
          Object.keys(w.forms).some((f) => f.toLowerCase().includes(query))
      );
    } else if (section) {
      const sectionNewWords = new Set(section.newWords);
      words = words.filter((w) => sectionNewWords.has(w.stem));
    } else {
      words = [...words].sort((a, b) => b.totalCount - a.totalCount).slice(0, 50);
    }

    return words;
  }, [data, section, searchQuery]);

  const wordDetails = useMemo(() => {
    if (!data || !selectedWord) return null;
    return data.vocabulary.find((w) => w.stem === selectedWord) || null;
  }, [data, selectedWord]);

  if (!data) return null;

  return (
    <div className="w-full h-full bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-serif text-foreground mb-1">{language === 'ru' ? 'Исследование слов' : 'Word Explorer'}</h2>
            <p className="text-muted-foreground text-sm">
              {section
                ? (language === 'ru' 
                    ? `Новые слова в разделе ${section.index + 1}: ${section.title}`
                    : `New words in Topic ${section.index + 1}: ${section.title}`)
                : (language === 'ru' ? '50 самых частых слов' : 'Top 50 most frequent words')}
            </p>
          </div>
          {section && (
            <button
              onClick={onClearSelection}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[300px] flex flex-col md:flex-row gap-6 overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {wordsToDisplay.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              {t('No words found.', language)}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 content-start">
              {wordsToDisplay.map((word) => (
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
                  <span className="ml-2 text-xs opacity-60 font-mono">{word.totalCount}</span>
                </button>
              ))}
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
              <p className="text-xs text-muted-foreground font-mono">stem: {wordDetails.stem}</p>
            </div>

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
                {language === 'ru' ? `Встречается в ${wordDetails.sections.length} разделах` : `Appears in ${wordDetails.sections.length} topics`}
              </h4>
              <div className="flex flex-wrap gap-1">
                {wordDetails.sections.map((idx) => (
                  <div
                    key={idx}
                    className="w-4 h-4 rounded-sm bg-secondary/20 border border-secondary/30 flex items-center justify-center text-[10px] text-secondary"
                    title={language === 'ru' ? `Раздел ${idx + 1}` : `Topic ${idx + 1}`}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
