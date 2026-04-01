import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ThemeDefinition, BUILTIN_THEMES, CURATED_THEMES, ALL_CURATED } from '../lib/themes/registry'

interface ThemeState {
  activeThemeId: string
  // Custom themes the user has installed (builtin ones are not stored here)
  customThemes: ThemeDefinition[]
  // IDs of curated (non-builtin) themes the user has installed
  installedCuratedIds: string[]

  setActiveTheme: (id: string) => void
  installCurated: (id: string) => void
  uninstallTheme: (id: string) => void
  addCustomTheme: (theme: ThemeDefinition) => void

  // Derived helpers (not persisted)
  getAllInstalled: () => ThemeDefinition[]
  getActiveTheme: () => ThemeDefinition | undefined
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      activeThemeId: 'light',
      customThemes: [],
      installedCuratedIds: [],

      setActiveTheme: (id) => set({ activeThemeId: id }),

      installCurated: (id) =>
        set((s) => ({
          installedCuratedIds: s.installedCuratedIds.includes(id)
            ? s.installedCuratedIds
            : [...s.installedCuratedIds, id]
        })),

      uninstallTheme: (id) =>
        set((s) => ({
          installedCuratedIds: s.installedCuratedIds.filter((x) => x !== id),
          customThemes: s.customThemes.filter((t) => t.id !== id),
          activeThemeId: s.activeThemeId === id ? 'light' : s.activeThemeId
        })),

      addCustomTheme: (theme) =>
        set((s) => ({
          customThemes: [
            ...s.customThemes.filter((t) => t.id !== theme.id),
            theme
          ]
        })),

      getAllInstalled: () => {
        const s = get()
        const builtins = BUILTIN_THEMES
        const curatedInstalled = CURATED_THEMES.filter((t) =>
          s.installedCuratedIds.includes(t.id)
        )
        return [...builtins, ...curatedInstalled, ...s.customThemes]
      },

      getActiveTheme: () => {
        const s = get()
        return (
          ALL_CURATED.find((t) => t.id === s.activeThemeId) ||
          s.customThemes.find((t) => t.id === s.activeThemeId)
        )
      }
    }),
    {
      name: 'typro-themes',
      partialize: (s) => ({
        activeThemeId: s.activeThemeId,
        customThemes: s.customThemes,
        installedCuratedIds: s.installedCuratedIds
      })
    }
  )
)
