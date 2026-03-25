import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useAnalysisData } from './hooks/useAnalysisData';
import { useComparisonData } from './hooks/useComparisonData';
import { useManifest } from './hooks/useManifest';
import { useHashParam } from './hooks/useHashState';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Panel1 } from './components/Panel1';
import { Panel2 } from './components/Panel2';
import { Panel3 } from './components/Panel3';
import { Panel4 } from './components/Panel4';
import { ComparisonView } from './components/ComparisonView';
import { AnkiExportButton } from './components/AnkiExportButton';
import { TextSearchPanel } from './components/TextSearchPanel';
import { ActiveTextsBar } from './components/ActiveTextsBar';
import { InfoTooltip } from './components/InfoTooltip';
import { Loader2, BookOpen, BarChart3 } from 'lucide-react';
import { type Language, t } from './i18n/translations';

type ViewMode = 'single' | 'comparison';
const MAX_COMPARISON_TEXTS = 5;

function formatDensity(pct: number): string {
  return pct >= 10 ? `${pct.toFixed(1)}%` : `${pct.toFixed(2)}%`;
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  buttonText, 
  onButtonClick
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  description: string; 
  buttonText: string; 
  onButtonClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-serif text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground text-sm text-center max-w-md mb-4">{description}</p>
      <button
        onClick={onButtonClick}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
      >
        {buttonText}
      </button>
    </div>
  );
}

export const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
}>({ language: 'en', setLanguage: () => {} });

export function useLanguage() {
  return useContext(LanguageContext);
}

function App() {
  const [language, setLanguage] = useLocalStorage<Language>('er-lang', 'en');

  const [viewModeHash, setViewModeHash] = useHashParam('view', '');
  const viewMode: ViewMode = (viewModeHash === 'single' || viewModeHash === 'comparison')
    ? viewModeHash
    : 'comparison';
  const setViewMode = (mode: ViewMode) => {
    setViewModeHash(mode);
  };

  const { data: manifest, loading: manifestLoading } = useManifest();

  const [textsParam, setTextsParam] = useHashParam('texts', '');
  const [activeTextParam, setActiveTextParam] = useHashParam('text', '');

  const selectedTextIds: string[] = textsParam 
    ? textsParam.split(',').filter(Boolean) 
    : [];

  const activeTextFile: string = activeTextParam || '';

  const setSelectedTextIds = useCallback((ids: string[]) => {
    setTextsParam(ids.join(','));
  }, [setTextsParam]);

  const setActiveTextFile = useCallback((file: string) => {
    setActiveTextParam(file);
  }, [setActiveTextParam]);

  const toggleTextForComparison = useCallback((id: string) => {
    const current = [...selectedTextIds];
    const idx = current.indexOf(id);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else if (current.length < MAX_COMPARISON_TEXTS) {
      current.push(id);
    }
    setSelectedTextIds(current);
  }, [selectedTextIds, setSelectedTextIds]);

  const selectTextForSingle = useCallback((file: string, id: string) => {
    setActiveTextFile(file);
    if (!selectedTextIds.includes(id)) {
      const next = [...selectedTextIds, id].slice(0, MAX_COMPARISON_TEXTS);
      setSelectedTextIds(next);
    }
  }, [selectedTextIds, setSelectedTextIds, setActiveTextFile]);

  const { data: singleData, loading: singleLoading, error: singleError } = useAnalysisData(activeTextFile);
  const { data: comparisonData, loading: comparisonLoading, error: comparisonError } = useComparisonData();

  const [sectionParam, setSectionParam] = useHashParam('section', '');
  const selectedSectionIndex = sectionParam ? parseInt(sectionParam, 10) : null;
  const setSelectedSectionIndex = (idx: number | null) => {
    setSectionParam(idx !== null ? String(idx) : '');
  };

  const [wordMode, setWordMode] = useState<'all' | 'new'>('new');

  const [searchPanelOpen, setSearchPanelOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchPanelOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchPanelOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const loading = manifestLoading || (viewMode === 'comparison' && comparisonLoading) || (viewMode === 'single' && activeTextFile && singleLoading);
  const error = comparisonError || (activeTextFile && singleError);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="animate-spin" size={32} />
          <p className="font-serif text-lg">{language === 'ru' ? 'Анализ корпуса...' : 'Analyzing corpus...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border p-6 rounded-xl max-w-md text-center">
          <h2 className="text-xl font-serif text-primary mb-2">{language === 'ru' ? 'Ошибка загрузки данных' : 'Failed to load data'}</h2>
          <p className="text-muted-foreground text-sm">
            {error?.message || (language === 'ru' ? 'При загрузке данных произошла неизвестная ошибка.' : 'Unknown error occurred while loading analysis data.')}
          </p>
        </div>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border p-6 rounded-xl max-w-md text-center">
          <h2 className="text-xl font-serif text-primary mb-2">{language === 'ru' ? 'Манифест не найден' : 'Manifest not found'}</h2>
          <p className="text-muted-foreground text-sm">
            {language === 'ru' ? 'Не удалось загрузить список текстов.' : 'Could not load the list of texts.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium tracking-tight">
                  {t('Extensive Reading Analysis', language)}
                </h1>
                <div className="flex bg-card border border-border rounded-lg p-1 md:hidden">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                      language === 'en' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setLanguage('ru')}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                      language === 'ru' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    RU
                  </button>
                </div>
              </div>
              <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
                {t('A visual exploration of vocabulary progression across German texts.', language)}
              </p>
            </div>
            
            <div className="flex flex-col gap-4 items-end">
              <div className="hidden md:flex bg-card border border-border rounded-lg p-1 mb-2">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    language === 'en' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('ru')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    language === 'ru' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  RU
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setSearchPanelOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-card border border-border rounded-lg hover:border-primary/50 hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <span className="hidden sm:inline">{t('Search texts...', language)}</span>
                  <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border">⌘K</kbd>
                </button>
                <div className="flex bg-card border border-border rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('comparison')}
                    className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'comparison' 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {t('Comparison View', language)}
                  </button>
                  <button
                    onClick={() => setViewMode('single')}
                    className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'single' 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {t('Single Text Analysis', language)}
                  </button>
                </div>
              </div>
            </div>
          </header>

          {manifest && (
            <ActiveTextsBar
              manifest={manifest}
              selectedIds={selectedTextIds}
              activeTextFile={activeTextFile}
              viewMode={viewMode}
              onToggle={toggleTextForComparison}
              onSelectForSingle={selectTextForSingle}
              onOpenSearch={() => setSearchPanelOpen(true)}
            />
          )}

          <main className="space-y-8">
            {viewMode === 'comparison' ? (
              selectedTextIds.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title={language === 'ru' ? 'Выберите тексты для сравнения' : 'Select texts to compare'}
                  description={language === 'ru' 
                    ? 'Используйте панель поиска выше или нажмите ⌘K, чтобы добавить тексты для анализа.'
                    : 'Use the search panel above or press ⌘K to add texts for analysis.'}
                  buttonText={language === 'ru' ? 'Добавить тексты' : 'Add texts'}
                  onButtonClick={() => setSearchPanelOpen(true)}
                />
              ) : comparisonData ? (
                <ComparisonView
                  data={comparisonData}
                  selectedIds={selectedTextIds}
                  onToggleText={toggleTextForComparison}
                />
              ) : null
            ) : (
              (() => {
                const activeText = manifest?.texts.find(t => t.file === activeTextFile);
                const isActiveTextSelected = activeText && selectedTextIds.includes(activeText.id);
                
                if (!activeText || !isActiveTextSelected || !singleData) {
                  return (
                    <EmptyState
                      icon={BookOpen}
                      title={language === 'ru' ? 'Выберите текст для анализа' : 'Select a text to analyze'}
                      description={language === 'ru' 
                        ? 'Используйте панель поиска выше или нажмите ⌘K, чтобы выбрать текст для детального анализа.'
                        : 'Use the search panel above or press ⌘K to select a text for detailed analysis.'}
                      buttonText={language === 'ru' ? 'Выбрать текст' : 'Select text'}
                      onButtonClick={() => setSearchPanelOpen(true)}
                    />
                  );
                }
                
                return (
                  <>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-serif text-foreground">
                          {singleData.meta.label || singleData.meta.source}
                        </h2>
                        <AnkiExportButton data={singleData} />
                      </div>
                      <div className="flex gap-3 sm:gap-4 text-sm font-mono text-muted-foreground bg-card px-3 sm:px-4 py-2 rounded-lg border border-border flex-wrap">
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-wider opacity-60">
                            {t('Sections', language)}
                          </span>
                          <span className="text-foreground">{singleData.meta.totalSections}</span>
                        </div>
                        <div className="w-px bg-border"></div>
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-wider opacity-60">{t('Words', language)}</span>
                          <span className="text-foreground">{(singleData.meta.totalWords ?? singleData.meta.totalTokens).toLocaleString()}</span>
                        </div>
                        <div className="w-px bg-border"></div>
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-wider opacity-60">{t('Unique Words', language)}</span>
                          <span className="text-foreground">{singleData.meta.totalUniqueStems.toLocaleString()}</span>
                        </div>
                        <div className="w-px bg-border hidden sm:block"></div>
                        <div className="hidden sm:flex flex-col">
                          <span className="text-xs uppercase tracking-wider opacity-60">{t('Density', language)}</span>
                          <span className="text-foreground">{formatDensity(singleData.meta.totalUniqueStems / (singleData.meta.totalWords ?? singleData.meta.totalTokens) * 100)}</span>
                        </div>
                        <div className="w-px bg-border hidden sm:block"></div>
                        <div className="hidden sm:flex flex-col">
                          <span className="text-xs uppercase tracking-wider flex items-center gap-1">
                            <span className="opacity-60">{language === 'ru' ? 'Плотн. (норм.)' : 'Density (norm.)'}</span>
                            <InfoTooltip />
                          </span>
                          <span className="text-foreground font-bold">{(singleData.meta.totalUniqueStems / Math.sqrt(singleData.meta.totalWords ?? singleData.meta.totalTokens)).toFixed(1)}</span>
                        </div>
                        <div className="w-px bg-border hidden md:block"></div>
                        <div className="hidden md:flex flex-col">
                          <span className="text-xs uppercase tracking-wider opacity-60">{t('Core Coverage', language)}</span>
                          <span className="text-foreground">{singleData.tierStats.find(ts => ts.name === 'core')?.coveragePercentage.toFixed(1) ?? '—'}%</span>
                        </div>
                      </div>
                    </div>

                    <section>
                      <Panel2 data={singleData} />
                    </section>

                    <section>
                      <Panel1
                        data={singleData}
                        onSectionClick={setSelectedSectionIndex}
                        selectedSectionIndex={selectedSectionIndex}
                        wordMode={wordMode}
                        onWordModeChange={setWordMode}
                      />
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1">
                        <Panel3 data={singleData} />
                      </div>
                      <div className="lg:col-span-2">
                        <Panel4
                          data={singleData}
                          selectedSectionIndex={selectedSectionIndex}
                          onClearSelection={() => setSelectedSectionIndex(null)}
                          wordMode={wordMode}
                        />
                      </div>
                    </section>
                  </>
                );
              })()
            )}
          </main>

          <footer className="pt-8 pb-4 text-center text-sm text-muted-foreground border-t border-border">
            <p>
              {viewMode === 'single' && singleData
                ? `${t('dataSource', language)}: ${singleData.meta.label || singleData.meta.source} • ${t('language', language)}: ${singleData.meta.language}`
                : `${t('language', language)}: German • ${t('texts', language)}: ${manifest?.texts.map(t => t.label).join(', ') ?? '...'}`}
            </p>
          </footer>
        </div>
      </div>

      {manifest && (
        <TextSearchPanel
          open={searchPanelOpen}
          onClose={() => setSearchPanelOpen(false)}
          manifest={manifest}
          selectedIds={selectedTextIds}
          viewMode={viewMode}
          onToggle={toggleTextForComparison}
          onSelectForSingle={selectTextForSingle}
        />
      )}
    </LanguageContext.Provider>
  );
}

export default App;
