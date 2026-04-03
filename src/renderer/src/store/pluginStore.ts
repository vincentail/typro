import { create } from 'zustand'

// Bumped after plugins finish loading so MarkdownPreview re-renders
interface PluginState {
  revision: number
  bump: () => void
}

export const usePluginStore = create<PluginState>((set) => ({
  revision: 0,
  bump: () => set((s) => ({ revision: s.revision + 1 }))
}))
