export const TEXT_COLORS = [
  '#d97757',
  '#4a8b9d',
  '#9b72cf',
  '#d4a373',
  '#22c55e',
  '#e74c3c',
  '#3498db',
  '#f39c12',
];

export function getTextColor(index: number): string {
  return TEXT_COLORS[index % TEXT_COLORS.length];
}

export function getBarBgClass(index: number): string {
  const classes = [
    'bg-[#d97757]',
    'bg-[#4a8b9d]',
    'bg-[#9b72cf]',
    'bg-[#d4a373]',
    'bg-[#22c55e]',
    'bg-[#e74c3c]',
    'bg-[#3498db]',
    'bg-[#f39c12]',
  ];
  return classes[index % classes.length];
}

export function getCardColorClass(index: number): string {
  const classes = [
    'text-[#d97757] border-[#d97757]/20 bg-[#d97757]/5',
    'text-[#4a8b9d] border-[#4a8b9d]/20 bg-[#4a8b9d]/5',
    'text-[#9b72cf] border-[#9b72cf]/20 bg-[#9b72cf]/5',
    'text-[#d4a373] border-[#d4a373]/20 bg-[#d4a373]/5',
    'text-[#22c55e] border-[#22c55e]/20 bg-[#22c55e]/5',
    'text-[#e74c3c] border-[#e74c3c]/20 bg-[#e74c3c]/5',
    'text-[#3498db] border-[#3498db]/20 bg-[#3498db]/5',
    'text-[#f39c12] border-[#f39c12]/20 bg-[#f39c12]/5',
  ];
  return classes[index % classes.length];
}
