export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  isDark: boolean;
  previewColors: {
    bg: string;
    primary: string;
    secondary: string;
    tertiary: string;
  };
}

export const themes: ThemeDefinition[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Gold and sand on white',
    isDark: false,
    previewColors: {
      bg: '#f7f7f5',
      primary: '#e8b820',
      secondary: '#7a7774',
      tertiary: 'hsl(220, 50%, 48%)'
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Gold and sand on charcoal',
    isDark: true,
    previewColors: {
      bg: '#121110',
      primary: '#FECF40',
      secondary: '#7a7774',
      tertiary: 'hsl(220, 50%, 58%)'
    }
  },
  {
    id: 'claude',
    name: 'Claude',
    description: 'Warm sand & terracotta',
    isDark: true,
    previewColors: {
      bg: '#1a1614',
      primary: 'hsl(24, 70%, 55%)',
      secondary: 'hsl(15, 50%, 52%)',
      tertiary: 'hsl(70, 30%, 42%)'
    }
  },
  {
    id: 'print',
    name: 'Print',
    description: 'Paper and ink',
    isDark: false,
    previewColors: {
      bg: '#f2efea',
      primary: 'hsl(218, 55%, 48%)',
      secondary: 'hsl(200, 40%, 42%)',
      tertiary: 'hsl(195, 25%, 45%)'
    }
  },
  {
    id: 'dusk',
    name: 'Dusk',
    description: 'Indigo, copper, and sage',
    isDark: false,
    previewColors: {
      bg: '#f6f5f3',
      primary: 'hsl(245, 42%, 40%)',
      secondary: 'hsl(18, 48%, 52%)',
      tertiary: 'hsl(155, 28%, 44%)'
    }
  }
];

export const themeIds = themes.map((t) => t.id);
export const darkThemeIds = themes.filter((t) => t.isDark).map((t) => t.id);

export function getThemeDefinition(id: string): ThemeDefinition | undefined {
  return themes.find((t) => t.id === id);
}
