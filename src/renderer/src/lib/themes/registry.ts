export interface ThemeVars {
  '--bg-primary': string
  '--bg-secondary': string
  '--bg-sidebar': string
  '--bg-titlebar': string
  '--text-primary': string
  '--text-secondary': string
  '--text-muted': string
  '--border-color': string
  '--accent-color': string
  '--accent-hover': string
  '--selection-bg': string
  '--scrollbar-thumb': string
}

export interface ThemeDefinition {
  id: string
  name: string
  description: string
  author?: string
  isDark: boolean
  builtin?: boolean
  variables: ThemeVars
}

export const BUILTIN_THEMES: ThemeDefinition[] = [
  {
    id: 'light',
    name: 'GitHub Light',
    description: 'Clean light theme inspired by GitHub',
    author: 'GitHub',
    isDark: false,
    builtin: true,
    variables: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f8f9fa',
      '--bg-sidebar': '#f0f0f0',
      '--bg-titlebar': '#f5f5f5',
      '--text-primary': '#24292f',
      '--text-secondary': '#57606a',
      '--text-muted': '#8c959f',
      '--border-color': '#d0d7de',
      '--accent-color': '#0969da',
      '--accent-hover': '#0550ae',
      '--selection-bg': '#ddf4ff',
      '--scrollbar-thumb': '#d0d7de'
    }
  },
  {
    id: 'dark',
    name: 'GitHub Dark',
    description: 'Dark theme inspired by GitHub',
    author: 'GitHub',
    isDark: true,
    builtin: true,
    variables: {
      '--bg-primary': '#0d1117',
      '--bg-secondary': '#161b22',
      '--bg-sidebar': '#161b22',
      '--bg-titlebar': '#161b22',
      '--text-primary': '#e6edf3',
      '--text-secondary': '#8d96a0',
      '--text-muted': '#484f58',
      '--border-color': '#30363d',
      '--accent-color': '#58a6ff',
      '--accent-hover': '#79c0ff',
      '--selection-bg': '#1c2d42',
      '--scrollbar-thumb': '#30363d'
    }
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    description: 'Precision colors for machines and people',
    author: 'Ethan Schoonover',
    isDark: false,
    builtin: true,
    variables: {
      '--bg-primary': '#fdf6e3',
      '--bg-secondary': '#eee8d5',
      '--bg-sidebar': '#eee8d5',
      '--bg-titlebar': '#eee8d5',
      '--text-primary': '#657b83',
      '--text-secondary': '#839496',
      '--text-muted': '#93a1a1',
      '--border-color': '#d3cbb8',
      '--accent-color': '#268bd2',
      '--accent-hover': '#2aa198',
      '--selection-bg': '#eee8d5',
      '--scrollbar-thumb': '#d3cbb8'
    }
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    description: 'Precision colors for machines and people (dark)',
    author: 'Ethan Schoonover',
    isDark: true,
    builtin: true,
    variables: {
      '--bg-primary': '#002b36',
      '--bg-secondary': '#073642',
      '--bg-sidebar': '#073642',
      '--bg-titlebar': '#073642',
      '--text-primary': '#839496',
      '--text-secondary': '#657b83',
      '--text-muted': '#586e75',
      '--border-color': '#073642',
      '--accent-color': '#268bd2',
      '--accent-hover': '#2aa198',
      '--selection-bg': '#073642',
      '--scrollbar-thumb': '#586e75'
    }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    description: 'A dark theme for many editors and tools',
    author: 'Zeno Rocha',
    isDark: true,
    builtin: true,
    variables: {
      '--bg-primary': '#282a36',
      '--bg-secondary': '#1e1f29',
      '--bg-sidebar': '#21222c',
      '--bg-titlebar': '#21222c',
      '--text-primary': '#f8f8f2',
      '--text-secondary': '#6272a4',
      '--text-muted': '#44475a',
      '--border-color': '#44475a',
      '--accent-color': '#bd93f9',
      '--accent-hover': '#ff79c6',
      '--selection-bg': '#44475a',
      '--scrollbar-thumb': '#44475a'
    }
  }
]

export const CURATED_THEMES: ThemeDefinition[] = [
  {
    id: 'nord',
    name: 'Nord',
    description: 'An arctic, north-bluish color palette',
    author: 'Arctic Ice Studio',
    isDark: true,
    variables: {
      '--bg-primary': '#2e3440',
      '--bg-secondary': '#3b4252',
      '--bg-sidebar': '#3b4252',
      '--bg-titlebar': '#3b4252',
      '--text-primary': '#eceff4',
      '--text-secondary': '#d8dee9',
      '--text-muted': '#4c566a',
      '--border-color': '#4c566a',
      '--accent-color': '#88c0d0',
      '--accent-hover': '#81a1c1',
      '--selection-bg': '#4c566a',
      '--scrollbar-thumb': '#4c566a'
    }
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    description: 'A clean dark theme that celebrates the lights of downtown Tokyo',
    author: 'enkia',
    isDark: true,
    variables: {
      '--bg-primary': '#1a1b26',
      '--bg-secondary': '#16161e',
      '--bg-sidebar': '#16161e',
      '--bg-titlebar': '#16161e',
      '--text-primary': '#c0caf5',
      '--text-secondary': '#a9b1d6',
      '--text-muted': '#414868',
      '--border-color': '#292e42',
      '--accent-color': '#7aa2f7',
      '--accent-hover': '#2ac3de',
      '--selection-bg': '#292e42',
      '--scrollbar-thumb': '#414868'
    }
  },
  {
    id: 'tokyo-night-light',
    name: 'Tokyo Night Light',
    description: 'Light variant of the Tokyo Night theme',
    author: 'enkia',
    isDark: false,
    variables: {
      '--bg-primary': '#d5d6db',
      '--bg-secondary': '#cbccd1',
      '--bg-sidebar': '#cbccd1',
      '--bg-titlebar': '#cbccd1',
      '--text-primary': '#343b58',
      '--text-secondary': '#565a6e',
      '--text-muted': '#9699a3',
      '--border-color': '#b0b5c3',
      '--accent-color': '#2959aa',
      '--accent-hover': '#33635c',
      '--selection-bg': '#b0b5c3',
      '--scrollbar-thumb': '#9699a3'
    }
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    description: 'Soothing pastel theme — Mocha variant',
    author: 'Catppuccin',
    isDark: true,
    variables: {
      '--bg-primary': '#1e1e2e',
      '--bg-secondary': '#181825',
      '--bg-sidebar': '#181825',
      '--bg-titlebar': '#181825',
      '--text-primary': '#cdd6f4',
      '--text-secondary': '#bac2de',
      '--text-muted': '#6c7086',
      '--border-color': '#313244',
      '--accent-color': '#cba6f7',
      '--accent-hover': '#89b4fa',
      '--selection-bg': '#313244',
      '--scrollbar-thumb': '#6c7086'
    }
  },
  {
    id: 'catppuccin-latte',
    name: 'Catppuccin Latte',
    description: 'Soothing pastel theme — Latte (light) variant',
    author: 'Catppuccin',
    isDark: false,
    variables: {
      '--bg-primary': '#eff1f5',
      '--bg-secondary': '#e6e9ef',
      '--bg-sidebar': '#e6e9ef',
      '--bg-titlebar': '#e6e9ef',
      '--text-primary': '#4c4f69',
      '--text-secondary': '#5c5f77',
      '--text-muted': '#9ca0b0',
      '--border-color': '#bcc0cc',
      '--accent-color': '#8839ef',
      '--accent-hover': '#209fb5',
      '--selection-bg': '#bcc0cc',
      '--scrollbar-thumb': '#9ca0b0'
    }
  },
  {
    id: 'one-dark-pro',
    name: 'One Dark Pro',
    description: "Atom's iconic One Dark theme for editors",
    author: 'binaryify',
    isDark: true,
    variables: {
      '--bg-primary': '#282c34',
      '--bg-secondary': '#21252b',
      '--bg-sidebar': '#21252b',
      '--bg-titlebar': '#21252b',
      '--text-primary': '#abb2bf',
      '--text-secondary': '#828997',
      '--text-muted': '#4b5263',
      '--border-color': '#3e4451',
      '--accent-color': '#61afef',
      '--accent-hover': '#56b6c2',
      '--selection-bg': '#3e4451',
      '--scrollbar-thumb': '#4b5263'
    }
  },
  {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    description: 'Retro groove color scheme — dark variant',
    author: 'morhetz',
    isDark: true,
    variables: {
      '--bg-primary': '#282828',
      '--bg-secondary': '#1d2021',
      '--bg-sidebar': '#1d2021',
      '--bg-titlebar': '#1d2021',
      '--text-primary': '#ebdbb2',
      '--text-secondary': '#d5c4a1',
      '--text-muted': '#665c54',
      '--border-color': '#504945',
      '--accent-color': '#83a598',
      '--accent-hover': '#8ec07c',
      '--selection-bg': '#504945',
      '--scrollbar-thumb': '#665c54'
    }
  },
  {
    id: 'gruvbox-light',
    name: 'Gruvbox Light',
    description: 'Retro groove color scheme — light variant',
    author: 'morhetz',
    isDark: false,
    variables: {
      '--bg-primary': '#fbf1c7',
      '--bg-secondary': '#f2e5bc',
      '--bg-sidebar': '#f2e5bc',
      '--bg-titlebar': '#f2e5bc',
      '--text-primary': '#3c3836',
      '--text-secondary': '#504945',
      '--text-muted': '#a89984',
      '--border-color': '#d5c4a1',
      '--accent-color': '#076678',
      '--accent-hover': '#427b58',
      '--selection-bg': '#d5c4a1',
      '--scrollbar-thumb': '#a89984'
    }
  },
  {
    id: 'material-ocean',
    name: 'Material Ocean',
    description: 'Material Design inspired ocean dark theme',
    author: 'Mattia Astorino',
    isDark: true,
    variables: {
      '--bg-primary': '#0f111a',
      '--bg-secondary': '#090b10',
      '--bg-sidebar': '#090b10',
      '--bg-titlebar': '#090b10',
      '--text-primary': '#8f93a2',
      '--text-secondary': '#717cb4',
      '--text-muted': '#464b5d',
      '--border-color': '#1f2233',
      '--accent-color': '#82aaff',
      '--accent-hover': '#89ddff',
      '--selection-bg': '#1f2233',
      '--scrollbar-thumb': '#464b5d'
    }
  },
  {
    id: 'ayu-dark',
    name: 'Ayu Dark',
    description: 'Simple dark theme with bright colors',
    author: 'teabyii',
    isDark: true,
    variables: {
      '--bg-primary': '#0d1017',
      '--bg-secondary': '#0a0e14',
      '--bg-sidebar': '#0a0e14',
      '--bg-titlebar': '#0a0e14',
      '--text-primary': '#bfbdb6',
      '--text-secondary': '#8a9199',
      '--text-muted': '#3d4550',
      '--border-color': '#131721',
      '--accent-color': '#39bae6',
      '--accent-hover': '#59c2ff',
      '--selection-bg': '#1a2030',
      '--scrollbar-thumb': '#3d4550'
    }
  },
  {
    id: 'ayu-light',
    name: 'Ayu Light',
    description: 'Simple light theme with bright colors',
    author: 'teabyii',
    isDark: false,
    variables: {
      '--bg-primary': '#fafafa',
      '--bg-secondary': '#f3f4f5',
      '--bg-sidebar': '#f3f4f5',
      '--bg-titlebar': '#f3f4f5',
      '--text-primary': '#575f66',
      '--text-secondary': '#787b80',
      '--text-muted': '#adb5bd',
      '--border-color': '#e7eaed',
      '--accent-color': '#55b4d4',
      '--accent-hover': '#399ee6',
      '--selection-bg': '#eef0f4',
      '--scrollbar-thumb': '#d4d8de'
    }
  },
  {
    id: 'palenight',
    name: 'Palenight',
    description: 'An elegant, dark color scheme inspired by Material Palenight',
    author: 'whizkydee',
    isDark: true,
    variables: {
      '--bg-primary': '#292d3e',
      '--bg-secondary': '#222636',
      '--bg-sidebar': '#222636',
      '--bg-titlebar': '#222636',
      '--text-primary': '#a6accd',
      '--text-secondary': '#676e95',
      '--text-muted': '#464b67',
      '--border-color': '#44475a',
      '--accent-color': '#82aaff',
      '--accent-hover': '#c3e88d',
      '--selection-bg': '#44475a',
      '--scrollbar-thumb': '#464b67'
    }
  },
  {
    id: 'monokai',
    name: 'Monokai',
    description: 'Classic dark theme by Wimer Hazenberg',
    author: 'Wimer Hazenberg',
    isDark: true,
    variables: {
      '--bg-primary': '#272822',
      '--bg-secondary': '#1e1f1c',
      '--bg-sidebar': '#1e1f1c',
      '--bg-titlebar': '#1e1f1c',
      '--text-primary': '#f8f8f2',
      '--text-secondary': '#75715e',
      '--text-muted': '#49483e',
      '--border-color': '#3e3d32',
      '--accent-color': '#a6e22e',
      '--accent-hover': '#66d9e8',
      '--selection-bg': '#3e3d32',
      '--scrollbar-thumb': '#49483e'
    }
  },
  {
    id: 'everforest-dark',
    name: 'Everforest Dark',
    description: 'Comfortable green-based dark theme',
    author: 'sainnhe',
    isDark: true,
    variables: {
      '--bg-primary': '#2d353b',
      '--bg-secondary': '#272e33',
      '--bg-sidebar': '#272e33',
      '--bg-titlebar': '#272e33',
      '--text-primary': '#d3c6aa',
      '--text-secondary': '#9da9a0',
      '--text-muted': '#5c6a72',
      '--border-color': '#475258',
      '--accent-color': '#a7c080',
      '--accent-hover': '#7fbbb3',
      '--selection-bg': '#475258',
      '--scrollbar-thumb': '#5c6a72'
    }
  },
  {
    id: 'rose-pine',
    name: 'Rosé Pine',
    description: 'All natural pine, faux fur and a bit of soho vibes',
    author: 'Rosé Pine',
    isDark: true,
    variables: {
      '--bg-primary': '#191724',
      '--bg-secondary': '#1f1d2e',
      '--bg-sidebar': '#1f1d2e',
      '--bg-titlebar': '#1f1d2e',
      '--text-primary': '#e0def4',
      '--text-secondary': '#908caa',
      '--text-muted': '#6e6a86',
      '--border-color': '#403d52',
      '--accent-color': '#c4a7e7',
      '--accent-hover': '#9ccfd8',
      '--selection-bg': '#403d52',
      '--scrollbar-thumb': '#6e6a86'
    }
  }
]

export const ALL_CURATED = [...BUILTIN_THEMES, ...CURATED_THEMES]
