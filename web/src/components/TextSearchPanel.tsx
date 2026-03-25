import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Check, Plus, AlertCircle } from 'lucide-react';
import type { Manifest } from '../hooks/useManifest';
import { useLanguage } from '../App';
import { t } from '../i18n/translations';

type ViewMode = 'single' | 'comparison';
const MAX_TEXTS = 5;

interface TextSearchPanelProps {
  open: boolean;
  onClose: () => void;
  manifest: Manifest;
  selectedIds: string[];
  viewMode: ViewMode;
  onToggle: (id: string) => void;
  onSelectForSingle: (file: string, id: string) => void;
}

export function TextSearchPanel({
  open,
  onClose,
  manifest,
  selectedIds,
  viewMode,
  onToggle,
  onSelectForSingle,
}: TextSearchPanelProps) {
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [limitWarning, setLimitWarning] = useState(false);

  useEffect(() => {
    if (open) {
      setQuery('');
      setLimitWarning(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Auto-dismiss limit warning after 2 seconds
  useEffect(() => {
    if (limitWarning) {
      const timer = setTimeout(() => setLimitWarning(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [limitWarning]);

  const sortedTexts = useMemo(() => {
    return [...manifest.texts].sort((a, b) => a.label.localeCompare(b.label));
  }, [manifest.texts]);

  const filteredTexts = useMemo(() => {
    if (!query.trim()) return sortedTexts;
    const q = query.toLowerCase();
    return sortedTexts.filter(
      text =>
        text.label.toLowerCase().includes(q) ||
        text.id.toLowerCase().includes(q)
    );
  }, [sortedTexts, query]);

  if (!open) return null;

  const handleSelect = (text: typeof manifest.texts[0]) => {
    const isSelected = selectedIds.includes(text.id);
    
    if (isSelected) {
      // Removing from selection
      onToggle(text.id);
    } else {
      // Adding to selection
      if (selectedIds.length >= MAX_TEXTS) {
        // Show limit warning instead of silently failing
        setLimitWarning(true);
        return;
      }
      
      if (viewMode === 'single') {
        // In single mode, onSelectForSingle handles both adding and setting active
        onSelectForSingle(text.file, text.id);
      } else {
        // In comparison mode, just toggle
        onToggle(text.id);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={18} className="text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search texts...', language)}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
          />
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {filteredTexts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {t('No texts matching your search.', language)}
            </div>
          ) : (
            <div className="py-1">
              {filteredTexts.map((text) => {
                const isSelected = selectedIds.includes(text.id);
                const isDisabled = !isSelected && selectedIds.length >= MAX_TEXTS;
                return (
                  <button
                    key={text.id}
                    onClick={() => handleSelect(text)}
                    disabled={isDisabled}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                      isSelected ? 'bg-primary/5' : isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {text.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {text.totalWords.toLocaleString()} {language === 'ru' ? 'слов' : 'words'} · {text.totalUniqueStems.toLocaleString()} {language === 'ru' ? 'уникальных' : 'unique'} · {text.sections} {language === 'ru' ? 'разд.' : 'sec.'}
                      </div>
                    </div>
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : isDisabled
                        ? 'border border-border/50 text-muted-foreground/50'
                        : 'border border-border text-muted-foreground hover:border-primary hover:text-primary'
                    }`}>
                      {isSelected ? <Check size={14} /> : <Plus size={14} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex justify-between items-center">
          <span>
            {filteredTexts.length} {language === 'ru' ? 'текстов' : 'texts'}
          </span>
          <span className={limitWarning ? 'text-destructive font-medium animate-pulse' : ''}>
            {limitWarning && <AlertCircle size={12} className="inline mr-1" />}
            {selectedIds.length}/{MAX_TEXTS} {language === 'ru' ? 'выбрано' : 'selected'}
            {limitWarning && (language === 'ru' ? ' (максимум!)' : ' (max!)')}
          </span>
        </div>
      </div>
    </div>
  );
}
