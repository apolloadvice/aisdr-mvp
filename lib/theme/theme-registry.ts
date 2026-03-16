export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  isDark: boolean;
  previewColors: {
    bg: string;
    primary: string;
    accent: string;
  };
}

export const themes: ThemeDefinition[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Paper and ink',
    isDark: false,
    previewColors: {
      bg: '#f2efea',
      primary: 'hsl(218, 55%, 48%)',
      accent: 'hsl(200, 40%, 42%)'
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Paper and ink (dark)',
    isDark: true,
    previewColors: {
      bg: '#1c1a17',
      primary: 'hsl(218, 55%, 58%)',
      accent: 'hsl(200, 40%, 52%)'
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
      accent: 'hsl(15, 50%, 52%)'
    }
  },
  {
    id: 'spotify',
    name: 'Spotify',
    description: 'Electric green on black',
    isDark: true,
    previewColors: {
      bg: '#121212',
      primary: 'hsl(141, 73%, 42%)',
      accent: 'hsl(160, 55%, 40%)'
    }
  }
];

export const themeIds = themes.map((t) => t.id);
export const darkThemeIds = themes.filter((t) => t.isDark).map((t) => t.id);

export function getThemeDefinition(id: string): ThemeDefinition | undefined {
  return themes.find((t) => t.id === id);
}
