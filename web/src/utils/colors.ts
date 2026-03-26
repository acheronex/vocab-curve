const CHART_COLORS = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--chart-6',
  '--chart-7',
  '--chart-8',
] as const;

const CHART_COLORS_HEX_LIGHT = [
  '#e8a080',
  '#6ba8b8',
  '#b898d9',
  '#d4b896',
  '#5fd896',
  '#e87468',
  '#5da8d8',
  '#e8b858',
];

const CHART_COLORS_HEX_DARK = [
  '#d97757',
  '#4a8b9d',
  '#9b72cf',
  '#d4a373',
  '#22c55e',
  '#e74c3c',
  '#3498db',
  '#f39c12',
];

function isDarkMode(): boolean {
  if (typeof window === 'undefined') return true;
  return document.documentElement.classList.contains('dark');
}

export function getChartVar(index: number): string {
  return `var(${CHART_COLORS[index % CHART_COLORS.length]})`;
}

export function getTextColor(index: number): string {
  return getChartVar(index);
}

export function getTextContrastVar(index: number): string {
  const fgVar = `${CHART_COLORS[index % CHART_COLORS.length]}-fg`;
  return `var(${fgVar})`;
}

export function getTextContrastColor(index: number): string {
  if (isDarkMode()) {
    const lightColors = ['#d4a373', '#f39c12', '#22c55e'];
    const color = CHART_COLORS_HEX_DARK[index % CHART_COLORS_HEX_DARK.length];
    return lightColors.includes(color) ? '#111110' : '#f4f4f0';
  } else {
    return '#1a1a19';
  }
}

export function getBarBgStyle(index: number): React.CSSProperties {
  return {
    backgroundColor: getChartVar(index),
  };
}

export function getCardStyle(index: number): React.CSSProperties {
  const color = getChartVar(index);
  return {
    borderColor: color,
    backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)`,
  };
}

export function getActiveTextStyle(index: number): React.CSSProperties {
  const color = getChartVar(index);
  return {
    borderColor: color,
    backgroundColor: color,
    color: getTextContrastVar(index),
  };
}

export { CHART_COLORS_HEX_LIGHT, CHART_COLORS_HEX_DARK };