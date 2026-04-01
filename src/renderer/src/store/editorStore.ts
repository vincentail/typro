import { create } from 'zustand'

interface WordCount {
  words: number
  chars: number
  lines: number
}

interface CursorPos {
  line: number
  col: number
}

const WELCOME_CONTENT = `# Welcome to Typro

A Typora-like markdown editor that runs on Mac, Linux, and Windows.

## Features

- **Live split-view** — Edit markdown on the left, see the rendered result on the right
- **Syntax highlighting** — Code blocks highlighted with Shiki
- **Math support** — Inline $E = mc^2$ and block math with KaTeX
- **Table of Contents** — Navigate headings in the sidebar
- **Multiple themes** — Light, Dark, Solarized, and Dracula
- **Focus mode** — Distraction-free writing (F8)
- **Export** — Export to HTML or PDF via File menu

## Keyboard Shortcuts

| Action | Mac | Windows/Linux |
| --- | --- | --- |
| New file | ⌘N | Ctrl+N |
| Open file | ⌘O | Ctrl+O |
| Save | ⌘S | Ctrl+S |
| Bold | ⌘B | Ctrl+B |
| Italic | ⌘I | Ctrl+I |
| Insert link | ⌘K | Ctrl+K |
| Find | ⌘F | Ctrl+F |
| Toggle sidebar | ⌘⇧L | Ctrl+Shift+L |
| Focus mode | F8 | F8 |

## Math

Inline math: $\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$

Block math:

$$
\\frac{d}{dx}\\left( \\int_{0}^{x} f(u)\\,du\\right)=f(x)
$$

## Code Example

\`\`\`typescript
function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

console.log(fibonacci(10)) // 55
\`\`\`

## Task List

- [x] Create a beautiful markdown editor
- [x] Add syntax highlighting
- [x] Support math equations
- [ ] Write more documentation
- [ ] Add more themes

## Blockquote

> "The best tool is the one that gets out of your way."

---

Start writing! Open a file with **⌘O** or just clear this and start typing.
`

export const useEditorStore = create<{
  content: string
  filePath: string | null
  isDirty: boolean
  wordCount: WordCount
  cursorPos: CursorPos
  recentVersion: number
  setContent: (content: string) => void
  setFilePath: (filePath: string | null) => void
  setDirty: (dirty: boolean) => void
  setWordCount: (wc: WordCount) => void
  setCursorPos: (pos: CursorPos) => void
  openFile: (filePath: string, content: string) => void
  newFile: () => void
  bumpRecentVersion: () => void
}>((set) => ({
  content: WELCOME_CONTENT,
  filePath: null,
  isDirty: false,
  wordCount: { words: 0, chars: 0, lines: 0 },
  cursorPos: { line: 1, col: 1 },
  recentVersion: 0,
  setContent: (content) => set({ content, isDirty: true }),
  setFilePath: (filePath) => set({ filePath }),
  setDirty: (isDirty) => set({ isDirty }),
  setWordCount: (wordCount) => set({ wordCount }),
  setCursorPos: (cursorPos) => set({ cursorPos }),
  openFile: (filePath, content) => set({ filePath, content, isDirty: false }),
  newFile: () => set({ filePath: null, content: '# Untitled\n\n', isDirty: false }),
  bumpRecentVersion: () => set((s) => ({ recentVersion: s.recentVersion + 1 }))
}))
