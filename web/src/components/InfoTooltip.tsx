import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLanguage } from '../App';

type TooltipType = 'density' | 'tokens';

interface InfoTooltipProps {
  type?: TooltipType;
}

const DENSITY_EN = [
  { type: 'heading' as const, text: 'Normalized Density (Guiraud\'s Index)' },
  { type: 'formula' as const, text: 'V / √N' },
  { type: 'paragraph' as const, text: 'V = unique word stems · N = total words (raw, before filtering)' },
  { type: 'heading' as const, text: 'Why normalize?' },
  { type: 'paragraph' as const, text: 'Raw density (V/N) naturally decreases as text gets longer — a 10,000-word novella will always look "denser" than a 650,000-word series, even if the vocabulary is simpler.' },
  { type: 'paragraph' as const, text: 'Dividing by √N instead of N compensates for this. It follows Heap\'s Law — the empirical observation that vocabulary grows roughly proportional to the square root of text length.' },
  { type: 'heading' as const, text: 'Reading the number' },
  { type: 'paragraph' as const, text: 'Higher → richer vocabulary per unit of text. Lower → more repetitive vocabulary.' },
  { type: 'note' as const, text: 'This metric measures lexical richness only. It does not account for grammar complexity, sentence structure, or word familiarity. Use it as one signal among many, not as a definitive difficulty score.' },
];

const DENSITY_RU = [
  { type: 'heading' as const, text: 'Нормализованная плотность (индекс Гиро)' },
  { type: 'formula' as const, text: 'V / √N' },
  { type: 'paragraph' as const, text: 'V = уникальные основы слов · N = общее число слов (до фильтрации)' },
  { type: 'heading' as const, text: 'Зачем нормализовать?' },
  { type: 'paragraph' as const, text: 'Обычная плотность (V/N) естественно снижается с ростом длины текста — новелла на 10 000 слов всегда выглядит «плотнее» романа на 650 000 слов, даже если словарь проще.' },
  { type: 'paragraph' as const, text: 'Деление на √N вместо N компенсирует это. Оно следует закону Хипса — эмпирическому наблюдению, что словарь растёт примерно пропорционально корню из длины текста.' },
  { type: 'heading' as const, text: 'Как читать число' },
  { type: 'paragraph' as const, text: 'Выше → богаче словарь на единицу текста. Ниже → более повторяющийся словарь.' },
  { type: 'note' as const, text: 'Эта метрика измеряет только лексическое богатство. Она не учитывает сложность грамматики, структуру предложений или знакомость слов. Используйте как один из сигналов, а не как окончательную оценку сложности.' },
];

const TOKENS_EN = [
  { type: 'heading' as const, text: 'What are Tokens?' },
  { type: 'paragraph' as const, text: 'Tokens are the filtered, analyzable words from the text — after removing stop words, punctuation, and applying lemmatization.' },
  { type: 'heading' as const, text: 'Words vs Tokens' },
  { type: 'paragraph' as const, text: 'Words = raw word count in the original text. Tokens = words that actually contribute to vocabulary analysis.' },
  { type: 'heading' as const, text: 'Example' },
  { type: 'paragraph' as const, text: 'A sentence "Der Hund läuft schnell" has 4 words. After filtering (removing "der") and lemmatization ("läuft" → "laufen"), it yields 3 tokens: "Hund", "laufen", and "schnell".' },
  { type: 'note' as const, text: 'Tokens are what get counted for unique stems and density calculations. They represent the meaningful vocabulary content.' },
];

const TOKENS_RU = [
  { type: 'heading' as const, text: 'Что такое токены?' },
  { type: 'paragraph' as const, text: 'Токены — это отфильтрованные, анализируемые слова из текста — после удаления стоп-слов, пунктуации и применения лемматизации.' },
  { type: 'heading' as const, text: 'Слова vs Токены' },
  { type: 'paragraph' as const, text: 'Слова = общее количество слов в оригинальном тексте. Токены = слова, которые реально участвуют в анализе словаря.' },
  { type: 'heading' as const, text: 'Пример' },
  { type: 'paragraph' as const, text: 'Предложение "Der Hund läuft schnell" содержит 4 слова. После фильтрации (удаление "der") и лемматизации ("läuft" → "laufen") получаем 3 токена: "Hund", "laufen" и "schnell".' },
  { type: 'note' as const, text: 'Токены используются для подсчёта уникальных лемм и расчёта плотности. Они представляют значимое содержание словаря.' },
];

const CONTENT_MAP = {
  density: { en: DENSITY_EN, ru: DENSITY_RU },
  tokens: { en: TOKENS_EN, ru: TOKENS_RU },
};

const TITLE_MAP = {
  density: { en: 'Normalized Density', ru: 'Нормализованная плотность' },
  tokens: { en: 'Tokens', ru: 'Токены' },
};

export function InfoTooltip({ type = 'density' }: InfoTooltipProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const content = CONTENT_MAP[type][language === 'ru' ? 'ru' : 'en'];
  const title = TITLE_MAP[type][language === 'ru' ? 'ru' : 'en'];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-current/30 text-[10px] leading-none hover:opacity-100 transition-opacity cursor-help"
        aria-label="Info"
      >
        ?
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] normal-case">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-serif text-base text-primary">
                {title}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto px-5 py-4">
              <div className="space-y-3">
                {content.map((block, i) => {
                  switch (block.type) {
                    case 'heading':
                      return <h4 key={i} className="font-serif font-medium text-primary text-sm">{block.text}</h4>;
                    case 'formula':
                      return <div key={i} className="font-mono text-lg text-foreground text-center py-1.5 rounded-lg border border-border bg-muted">{block.text}</div>;
                    case 'paragraph':
                      return <p key={i} className="text-sm leading-relaxed text-foreground">{block.text}</p>;
                    case 'note':
                      return <p key={i} className="text-sm leading-relaxed text-foreground/80 italic border-t border-border pt-2 mt-1">{block.text}</p>;
                  }
                })}
              </div>
            </div>

            <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex justify-end">
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border">Esc</kbd>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
