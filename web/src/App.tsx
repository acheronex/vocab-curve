import { useState, createContext, useContext } from 'react';
import { useAnalysisData } from './hooks/useAnalysisData';
import { useComparisonData } from './hooks/useComparisonData';
import { Panel1 } from './components/Panel1';
import { Panel2 } from './components/Panel2';
import { Panel3 } from './components/Panel3';
import { Panel4 } from './components/Panel4';
import { ComparisonView } from './components/ComparisonView';
import { Loader2 } from 'lucide-react';
import { type Language, t } from './i18n/translations';

type ViewMode = 'single' | 'comparison';

export const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
}>({ language: 'en', setLanguage: () => {} });

export function useLanguage() {
  return useContext(LanguageContext);
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('comparison');
  const [sourceFile, setSourceFile] = useState('analysis.json');
  const [language, setLanguage] = useState<Language>('en');
  const { data: singleData, loading: singleLoading, error: singleError } = useAnalysisData(sourceFile);
  const { data: comparisonData, loading: comparisonLoading, error: comparisonError } = useComparisonData();
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null);

  const loading = singleLoading || comparisonLoading;
  const error = singleError || comparisonError;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="animate-spin" size={32} />
          <p className="font-serif text-lg">Analyzing corpus...</p>
        </div>
      </div>
    );
  }

  if (error || (!singleData && viewMode === 'single') || (!comparisonData && viewMode === 'comparison')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border p-6 rounded-xl max-w-md text-center">
          <h2 className="text-xl font-serif text-primary mb-2">Failed to load data</h2>
          <p className="text-muted-foreground text-sm">
            {error?.message || 'Unknown error occurred while loading analysis data.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight">
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
              <p className="text-muted-foreground max-w-2xl">
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
              <div className="flex bg-card border border-border rounded-lg p-1">
                <button
                  onClick={() => setViewMode('comparison')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'comparison' 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {t('Comparison View', language)}
                </button>
                <button
                  onClick={() => setViewMode('single')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'single' 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {t('Single Text Analysis', language)}
                </button>
              </div>

              {viewMode === 'single' && singleData && (
                <div className="flex flex-col gap-2 items-end">
                  <select
                    value={sourceFile}
                    onChange={(e) => setSourceFile(e.target.value)}
                    className="bg-card border border-border text-foreground text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2"
                  >
                    <option value="analysis.json">82 B1 Exam Topics</option>
                    <option value="tribute-von-panem.json">Die Tribute von Panem</option>
                    <option value="drei-kameraden.json">Drei Kameraden</option>
                  </select>
                  <div className="flex gap-4 text-sm font-mono text-muted-foreground bg-card px-4 py-2 rounded-lg border border-border">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wider opacity-60">
                        {t(sourceFile === 'analysis.json' ? 'Topics' : 'Chapters', language)}
                      </span>
                      <span className="text-foreground">{singleData.meta.totalSections}</span>
                    </div>
                    <div className="w-px bg-border"></div>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wider opacity-60">{t('Words', language)}</span>
                      <span className="text-foreground">{singleData.meta.totalWords?.toLocaleString() ?? singleData.meta.totalTokens.toLocaleString()}</span>
                    </div>
                    <div className="w-px bg-border"></div>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wider opacity-60">{t('Unique Words', language)}</span>
                      <span className="text-foreground">{singleData.meta.totalUniqueStems.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </header>

          <main className="space-y-8">
            {viewMode === 'comparison' && comparisonData ? (
              <ComparisonView data={comparisonData} />
            ) : singleData ? (
              <>
                <section>
                  <Panel1
                    data={singleData}
                    onSectionClick={setSelectedSectionIndex}
                    selectedSectionIndex={selectedSectionIndex}
                  />
                </section>

                <section>
                  <Panel2 data={singleData} />
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
                    />
                  </div>
                </section>
              </>
            ) : null}
          </main>

          <footer className="pt-8 pb-4 text-center text-sm text-muted-foreground border-t border-border">
            <p>
              {viewMode === 'single' && singleData 
                ? `${t('dataSource', language)}: ${singleData.meta.source} • ${t('language', language)}: ${singleData.meta.language}`
                : `${t('language', language)}: German • ${t('texts', language)}: 82 B1 Topics, Die Tribute von Panem, Drei Kameraden`}
            </p>
          </footer>
        </div>
      </div>
    </LanguageContext.Provider>
  );
}

export default App;
