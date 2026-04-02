import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from '../locales'

export type ViewMode = 'source' | 'split' | 'preview'
// Now accepts any string — builtin IDs ('light', 'dark', …) or custom IDs
export type ThemeName = string

interface UiState {
  viewMode: ViewMode
  theme: ThemeName
  sidebarOpen: boolean
  focusMode: boolean
  toolbarVisible: boolean
  editorFontSize: number
  previewFontSize: number
  lineHeight: number
  autoSave: boolean
  autoSaveInterval: number
  language: Lang
  openDirPath: string
  wallpaperPath: string
  bgOpacity: number
  customBgColors: Partial<Record<'--bg-primary' | '--bg-secondary' | '--bg-sidebar' | '--bg-titlebar', string>>
  setViewMode: (mode: ViewMode) => void
  setTheme: (theme: ThemeName) => void
  toggleSidebar: () => void
  setSidebar: (open: boolean) => void
  toggleFocusMode: () => void
  toggleToolbar: () => void
  setEditorFontSize: (size: number) => void
  setPreviewFontSize: (size: number) => void
  setLineHeight: (lh: number) => void
  setAutoSave: (v: boolean) => void
  setAutoSaveInterval: (v: number) => void
  setLanguage: (lang: Lang) => void
  setOpenDirPath: (path: string) => void
  setWallpaperPath: (path: string) => void
  setBgOpacity: (opacity: number) => void
  setCustomBgColor: (key: '--bg-primary' | '--bg-secondary' | '--bg-sidebar' | '--bg-titlebar', value: string) => void
  resetCustomBgColors: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      viewMode: 'split',
      theme: 'light',
      sidebarOpen: true,
      focusMode: false,
      toolbarVisible: true,
      editorFontSize: 14,
      previewFontSize: 15,
      lineHeight: 1.7,
      autoSave: false,
      autoSaveInterval: 30,
      language: 'zh',
      openDirPath: '',
      wallpaperPath: '',
      bgOpacity: 0.85,
      customBgColors: {},
      setViewMode: (viewMode) => set({ viewMode }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebar: (sidebarOpen) => set({ sidebarOpen }),
      toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
      toggleToolbar: () => set((s) => ({ toolbarVisible: !s.toolbarVisible })),
      setEditorFontSize: (editorFontSize) => set({ editorFontSize: Math.min(28, Math.max(10, editorFontSize)) }),
      setPreviewFontSize: (previewFontSize) => set({ previewFontSize: Math.min(32, Math.max(10, previewFontSize)) }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      setAutoSave: (autoSave) => set({ autoSave }),
      setAutoSaveInterval: (autoSaveInterval) => set({ autoSaveInterval }),
      setLanguage: (language) => set({ language }),
      setOpenDirPath: (openDirPath) => set({ openDirPath }),
      setWallpaperPath: (wallpaperPath) => set({ wallpaperPath }),
      setBgOpacity: (bgOpacity) => set({ bgOpacity: Math.min(1, Math.max(0, bgOpacity)) }),
      setCustomBgColor: (key, value) => set((s) => ({ customBgColors: { ...s.customBgColors, [key]: value } })),
      resetCustomBgColors: () => set({ customBgColors: {} }),
    }),
    {
      name: 'typro-ui',
      partialize: (s) => ({ language: s.language, openDirPath: s.openDirPath, wallpaperPath: s.wallpaperPath, bgOpacity: s.bgOpacity, customBgColors: s.customBgColors, previewFontSize: s.previewFontSize, autoSave: s.autoSave, autoSaveInterval: s.autoSaveInterval })
    }
  )
)
