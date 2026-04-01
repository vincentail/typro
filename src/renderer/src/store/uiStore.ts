import { create } from 'zustand'

export type ViewMode = 'source' | 'split' | 'preview'
export type ThemeName = 'light' | 'dark' | 'solarized-light' | 'solarized-dark' | 'dracula'

interface UiState {
  viewMode: ViewMode
  theme: ThemeName
  sidebarOpen: boolean
  focusMode: boolean
  setViewMode: (mode: ViewMode) => void
  setTheme: (theme: ThemeName) => void
  toggleSidebar: () => void
  setSidebar: (open: boolean) => void
  toggleFocusMode: () => void
}

export const useUiStore = create<UiState>((set) => ({
  viewMode: 'split',
  theme: 'light',
  sidebarOpen: true,
  focusMode: false,
  setViewMode: (viewMode) => set({ viewMode }),
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode }))
}))
