import { X, Plus } from 'lucide-react';
import type { Manifest } from '../hooks/useManifest';
import { useLanguage } from '../App';
import { t } from '../i18n/translations';
import { getChartVar, getTextContrastVar } from '../utils/colors';
import { useTheme } from '../hooks/useTheme';
import { useMemo } from 'react';

type ViewMode = 'single' | 'comparison' | 'corpus';

interface ActiveTextsBarProps {
  manifest: Manifest;
  selectedIds: string[];
  activeTextFile: string;
  viewMode: ViewMode;
  onToggle: (id: string) => void;
  onSelectForSingle: (file: string, id: string) => void;
  onOpenSearch: () => void;
}

export function ActiveTextsBar({
  manifest,
  selectedIds,
  activeTextFile,
  viewMode,
  onToggle,
  onSelectForSingle,
  onOpenSearch,
}: ActiveTextsBarProps) {
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const colorIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    manifest.texts.forEach((text, i) => map.set(text.id, i));
    return map;
  }, [manifest.texts]);

  const selectedTexts = useMemo(() => {
    return selectedIds
      .map(id => manifest.texts.find(t => t.id === id))
      .filter(Boolean) as typeof manifest.texts;
  }, [selectedIds, manifest.texts]);

  if (selectedTexts.length === 0) {
    return (
      <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {t('No texts selected', language)}
        </span>
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-text border border-primary/30 rounded-md hover:bg-primary/10 transition-colors"
        >
          <Plus size={14} />
          {t('Add to selection', language)}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 bg-card border border-border rounded-lg px-3 sm:px-4 py-2.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wider mr-1 flex-shrink-0">
        {t('Active Texts', language)}
      </span>
      {selectedTexts.map((text) => {
        const colorIdx = colorIndexMap.get(text.id) ?? 0;
        const color = getChartVar(colorIdx);
        const contrastColor = getTextContrastVar(colorIdx);
        const isActiveInSingle = viewMode === 'single' && text.file === activeTextFile;

        const bgOpacity = isDark 
          ? (isActiveInSingle ? 0.25 : 0.1)
          : (isActiveInSingle ? 0.2 : 0.12);
        const textOpacity = isDark ? 1 : 0.85;

        return (
          <div
            key={text.id}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm transition-all cursor-pointer border ${
              isActiveInSingle
                ? 'font-medium'
                : 'hover:shadow-sm'
            }`}
            style={{
              borderColor: color,
              backgroundColor: `color-mix(in srgb, ${color} ${bgOpacity * 100}%, transparent)`,
              color: contrastColor,
              opacity: textOpacity,
              ...(isActiveInSingle ? { boxShadow: `0 0 0 2px var(--color-background), 0 0 0 4px ${color}` } : {}),
            }}
            onClick={() => {
              if (viewMode === 'single') {
                onSelectForSingle(text.file, text.id);
              }
            }}
          >
            <span className="truncate max-w-[120px] sm:max-w-[200px]">{text.label}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(text.id);
              }}
              className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center hover:bg-current/20 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
      <button
        onClick={onOpenSearch}
        className="flex items-center justify-center w-7 h-7 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary-text hover:text-primary-text transition-colors flex-shrink-0"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}