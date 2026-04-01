import { create } from 'zustand'

export type ViewMode = 'source' | 'split' | 'preview'
export type ThemeName = 'light' | 'dark' | 'solarized-light' | 'solarized-dark' | 'dracula'

interface UiState {
  viewMode: ViewMode
  theme: ThemeName
  sidebarOpen: boolean
  focusMode: boolean
  toolbarVisible: boolean
  editorFontSize: number
  lineHeight: number
  setViewMode: (mode: ViewMode) => void
  setTheme: (theme: ThemeName) => void
  toggleSidebar: () => void
  setSidebar: (open: boolean) => void
  toggleFocusMode: () => void
  toggleToolbar: () => void
  setEditorFontSize: (size: number) => void
  setLineHeight: (lh: number) => void
}

export const useUiStore = create<UiState>((set) => ({
  viewMode: 'split',
  theme: 'light',
  sidebarOpen: true,
  focusMode: false,
  toolbarVisible: true,
  editorFontSize: 14,
  lineHeight: 1.7,
  setViewMode: (viewMode) => set({ viewMode }),
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  toggleToolbar: () => set((s) => ({ toolbarVisible: !s.toolbarVisible })),
  setEditorFontSize: (editorFontSize) => set({ editorFontSize: Math.min(28, Math.max(10, editorFontSize)) }),
  setLineHeight: (lineHeight) => set({ lineHeight })
}))
