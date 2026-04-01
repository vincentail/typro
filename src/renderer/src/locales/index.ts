import { useUiStore } from '../store/uiStore'
import { en } from './en'
import { zh } from './zh'

export type Lang = 'zh' | 'en'

export function useT() {
  const lang = useUiStore((s) => s.language)
  return lang === 'zh' ? zh : en
}
