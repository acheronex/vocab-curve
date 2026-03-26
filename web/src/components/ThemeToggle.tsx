import { Sun, Moon, Monitor } from 'lucide-react';
import { useLanguage } from '../App';
import { useTheme, type Theme } from '../hooks/useTheme';

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; labelEn: string; labelRu: string }[] = [
  { value: 'light', icon: Sun, labelEn: 'Light', labelRu: 'Светлая' },
  { value: 'dark', icon: Moon, labelEn: 'Dark', labelRu: 'Тёмная' },
  { value: 'system', icon: Monitor, labelEn: 'System', labelRu: 'Система' },
];

export function ThemeToggle() {
  const { language } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex bg-card border border-border rounded-lg p-1">
      {THEME_OPTIONS.map(({ value, icon: Icon, labelEn, labelRu }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            theme === value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
          title={language === 'ru' ? labelRu : labelEn}
        >
          <Icon size={14} />
          <span className="hidden sm:inline">{language === 'ru' ? labelRu : labelEn}</span>
        </button>
      ))}
    </div>
  );
}