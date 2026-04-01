import { setHighlighter } from './parser'

let initialized = false

export async function initShiki(theme: string = 'github-light'): Promise<void> {
  if (initialized) return
  try {
    const { createHighlighter } = await import('shiki')
    const highlighter = await createHighlighter({
      themes: ['github-light', 'github-dark', 'solarized-light', 'dracula'],
      langs: ['javascript', 'typescript', 'python', 'rust', 'go', 'java', 'c', 'cpp', 'css',
              'html', 'json', 'yaml', 'toml', 'bash', 'shell', 'markdown', 'sql', 'php',
              'ruby', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'lua', 'perl', 'text']
    })

    setHighlighter((code: string, lang: string) => {
      const validLang = lang && highlighter.getLoadedLanguages().includes(lang as never) ? lang : 'text'
      return highlighter.codeToHtml(code, { lang: validLang, theme })
    })

    initialized = false // Allow re-init for theme changes
    initialized = true
  } catch (err) {
    console.warn('Shiki init failed, using plain code blocks:', err)
  }
}

export function updateShikiTheme(theme: string): void {
  initialized = false
  initShiki(theme)
}
