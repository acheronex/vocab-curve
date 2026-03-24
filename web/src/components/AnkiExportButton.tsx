import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { AnalysisResult, FrequencyTierName } from '../hooks/useAnalysisData';
import { useLanguage } from '../App';

interface AnkiExportButtonProps {
  data: AnalysisResult | null;
}

const TIER_INFO: Record<string, { en: string; ru: string; desc_en: string; desc_ru: string }> = {
  core: {
    en: 'Core (20+×)',
    ru: 'Core (20+×)',
    desc_en: 'Essential vocabulary - covers 61% of text',
    desc_ru: 'Базовая лексика - покрывает 61% текста',
  },
  medium: {
    en: 'Medium (6-19×)',
    ru: 'Средние (6-19×)',
    desc_en: 'Important words for fluency',
    desc_ru: 'Важные слова для беглости',
  },
  rare: {
    en: 'Rare (2-5×)',
    ru: 'Редкие (2-5×)',
    desc_en: 'Less common but useful vocabulary',
    desc_ru: 'Менее частая, но полезная лексика',
  },
  hapax: {
    en: 'Hapax (1×)',
    ru: 'Гапакс (1×)',
    desc_en: 'Words appearing only once',
    desc_ru: 'Слова, встречающиеся только один раз',
  },
};

export function AnkiExportButton({ data }: AnkiExportButtonProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<FrequencyTierName | 'all'>('all');

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  if (!data?.tierStats) return null;

  const sourceFile = data.meta.source.split('/').pop() || 'analysis';

  const generateCommand = () => {
    const tierFlag = selectedTier === 'all' ? '' : ` --tier ${selectedTier}`;
    return `python3 scripts/anki_export.py output/${sourceFile.replace('.md', '.json')}${tierFlag}`;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span className="hidden sm:inline">{language === 'ru' ? 'Экспорт в Anki' : 'Export to Anki'}</span>
        <span className="sm:hidden">Anki</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-serif text-lg text-foreground">
                {language === 'ru' ? 'Экспорт в Anki' : 'Export to Anki'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto">
              <div className="py-1">
                <button
                  onClick={() => setSelectedTier('all')}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-muted/50 ${
                    selectedTier === 'all' ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {language === 'ru' ? 'Все tiers' : 'All Tiers'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {data.meta.totalUniqueStems.toLocaleString()} {language === 'ru' ? 'слов' : 'words'}
                    </div>
                  </div>
                  {selectedTier === 'all' && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>

                {data.tierStats.map((tier) => (
                  <button
                    key={tier.name}
                    onClick={() => setSelectedTier(tier.name)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-muted/50 ${
                      selectedTier === tier.name ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tier.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        {TIER_INFO[tier.name]?.[language] || tier.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {tier.wordCount.toLocaleString()} {language === 'ru' ? 'слов' : 'words'} · {tier.coveragePercentage.toFixed(1)}% {language === 'ru' ? 'покрытие' : 'coverage'}
                      </div>
                    </div>
                    {selectedTier === tier.name && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">
                {language === 'ru'
                  ? 'Выполните в терминале:'
                  : 'Run in terminal:'}
              </p>
              <code className="block bg-background p-2 rounded text-xs font-mono text-foreground overflow-x-auto">
                {generateCommand()}
              </code>
            </div>

            <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex justify-between">
              <span>
                {selectedTier === 'all'
                  ? `${data.meta.totalUniqueStems.toLocaleString()} ${language === 'ru' ? 'слов' : 'words'}`
                  : `${data.tierStats.find(t => t.name === selectedTier)?.wordCount.toLocaleString() ?? '—'} ${language === 'ru' ? 'слов' : 'words'}`}
              </span>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border">Esc</kbd>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
