export type AppThemeId = 'cobalt' | 'emerald' | 'swiss' | 'graphite';

export interface ThemeDefinition {
  id: AppThemeId;
  name: string;
  category: string;
  description: string;
  primaryHex: string;
  accentHex: string;
  bgHex: string;
  cardHex: string;
  borderHex: string;
}

export const APP_THEMES: ThemeDefinition[] = [
  {
    id: 'cobalt',
    name: 'Cobalt Agency',
    category: 'Modern Digital Studio',
    description: 'Midnight navy canvas, royal cobalt CTA buttons, and warm solar amber location savings badges.',
    primaryHex: '#2563eb',
    accentHex: '#f59e0b',
    bgHex: '#0b1120',
    cardHex: '#0f172a',
    borderHex: '#1e293b'
  },
  {
    id: 'emerald',
    name: 'Obsidian & Emerald',
    category: 'Enterprise Fintech',
    description: 'Deep obsidian charcoal canvas, electric emerald green pricing badges, and velocity charts.',
    primaryHex: '#10b981',
    accentHex: '#34d399',
    bgHex: '#09090b',
    cardHex: '#121215',
    borderHex: '#27272a'
  },
  {
    id: 'swiss',
    name: 'Swiss Monochrome',
    category: 'Minimalist Architectural',
    description: 'Pitch carbon black, stark white contrasts, razor-sharp hairline dividers, and tabular figures.',
    primaryHex: '#ffffff',
    accentHex: '#e5e5e5',
    bgHex: '#000000',
    cardHex: '#0a0a0a',
    borderHex: '#262626'
  },
  {
    id: 'graphite',
    name: 'Warm Graphite & Bronze',
    category: 'Boutique Advisory',
    description: 'Warm espresso graphite stone surfaces, burnished bronze buttons, and golden amber accents.',
    primaryHex: '#d97706',
    accentHex: '#f59e0b',
    bgHex: '#141211',
    cardHex: '#1c1917',
    borderHex: '#38332f'
  }
];
