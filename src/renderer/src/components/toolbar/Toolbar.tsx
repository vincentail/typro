import { useEffect, useRef, useState } from 'react'
import { EditorView } from '@codemirror/view'
import { useEditorStore } from '../../store/editorStore'
import { useUiStore } from '../../store/uiStore'
import {
  wrapSelection, setHeading, getHeadingLevel, toggleLinePrefix,
  insertBlock, insertLink, insertImage, insertTable,
  applyColor, applyHighlight, undo, redo
} from './toolbarActions'
import styles from './Toolbar.module.css'

interface Props {
  editorView: EditorView | null
}

const LINE_HEIGHTS = [1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.4]
const HEADING_LABELS = ['正文', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']
const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
  '#000000', '#6b7280', '#ffffff',
]
const PRESET_HIGHLIGHTS = [
  '#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca',
  '#e9d5ff', '#fed7aa', '#d1fae5', '#fce7f3',
]

export function Toolbar({ editorView }: Props) {
  const { toolbarVisible, editorFontSize, lineHeight, setEditorFontSize, setLineHeight, focusMode } = useUiStore()
  const cursorPos = useEditorStore((s) => s.cursorPos)

  const [headingLevel, setHeadingLevelState] = useState(0)
  const [colorPickerOpen, setColorPickerOpen] = useState<'text' | 'highlight' | null>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)
  const highlightInputRef = useRef<HTMLInputElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  // Track heading level at cursor
  useEffect(() => {
    if (!editorView) return
    try {
      const lvl = getHeadingLevel(editorView)
      setHeadingLevelState(lvl)
    } catch {
      setHeadingLevelState(0)
    }
  }, [cursorPos, editorView])

  // Close color picker on outside click
  useEffect(() => {
    if (!colorPickerOpen) return
    const handler = (e: MouseEvent) => {
      if (!colorPickerRef.current?.contains(e.target as Node)) {
        setColorPickerOpen(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [colorPickerOpen])

  if (focusMode) return null

  const run = (fn: (v: EditorView) => void) => {
    if (!editorView) return
    fn(editorView)
  }

  return (
    <div className={`${styles.wrapper} ${toolbarVisible ? styles.visible : ''}`}>
      <div className={styles.inner}>
        <div className={styles.toolbar}>

          {/* ── History ── */}
          <button className={styles.btn} title="撤销 (⌘Z)" onClick={() => run((v) => undo(v))}>
            <UndoIcon />
          </button>
          <button className={styles.btn} title="重做 (⌘⇧Z)" onClick={() => run((v) => redo(v))}>
            <RedoIcon />
          </button>

          <span className={styles.sep} />

          {/* ── Heading selector ── */}
          <select
            className={styles.select}
            value={headingLevel}
            title="段落/标题"
            onChange={(e) => run((v) => setHeading(v, Number(e.target.value)))}
          >
            {HEADING_LABELS.map((label, i) => (
              <option key={i} value={i}>{label}</option>
            ))}
          </select>

          <span className={styles.sep} />

          {/* ── Text formatting ── */}
          <button className={styles.btn} title="粗体 (⌘B)" onClick={() => run((v) => wrapSelection(v, '**', '**'))}>
            <b>B</b>
          </button>
          <button className={`${styles.btn} ${styles.italic}`} title="斜体 (⌘I)" onClick={() => run((v) => wrapSelection(v, '*', '*'))}>
            <i>I</i>
          </button>
          <button className={`${styles.btn} ${styles.strike}`} title="删除线 (⌘⇧S)" onClick={() => run((v) => wrapSelection(v, '~~', '~~'))}>
            S
          </button>
          <button className={`${styles.btn} ${styles.codeInline}`} title="行内代码 (⌘`)" onClick={() => run((v) => wrapSelection(v, '`', '`'))}>
            {'</>'}
          </button>
          <button className={styles.btn} title="上标" onClick={() => run((v) => wrapSelection(v, '<sup>', '</sup>'))}>
            x<sup>2</sup>
          </button>
          <button className={styles.btn} title="下标" onClick={() => run((v) => wrapSelection(v, '<sub>', '</sub>'))}>
            x<sub>2</sub>
          </button>

          <span className={styles.sep} />

          {/* ── Color ── */}
          <div className={styles.colorGroup} ref={colorPickerRef}>
            <button
              className={`${styles.btn} ${styles.colorBtn}`}
              title="文字颜色"
              onClick={() => setColorPickerOpen(colorPickerOpen === 'text' ? null : 'text')}
            >
              <ColorTextIcon />
            </button>
            <button
              className={`${styles.btn} ${styles.colorBtn}`}
              title="高亮背景色"
              onClick={() => setColorPickerOpen(colorPickerOpen === 'highlight' ? null : 'highlight')}
            >
              <ColorHighlightIcon />
            </button>
            {colorPickerOpen && (
              <div className={styles.colorPalette}>
                <div className={styles.paletteLabel}>
                  {colorPickerOpen === 'text' ? '文字颜色' : '高亮颜色'}
                </div>
                <div className={styles.colorSwatches}>
                  {(colorPickerOpen === 'text' ? PRESET_COLORS : PRESET_HIGHLIGHTS).map((c) => (
                    <button
                      key={c}
                      className={styles.swatch}
                      style={{ background: c, border: c === '#ffffff' ? '1px solid #d0d7de' : 'none' }}
                      title={c}
                      onClick={() => {
                        if (colorPickerOpen === 'text') run((v) => applyColor(v, c))
                        else run((v) => applyHighlight(v, c))
                        setColorPickerOpen(null)
                      }}
                    />
                  ))}
                  {/* Custom color via native picker */}
                  <label className={styles.swatchCustom} title="自定义颜色">
                    <span>+</span>
                    <input
                      type="color"
                      className={styles.nativeColorInput}
                      ref={colorPickerOpen === 'text' ? colorInputRef : highlightInputRef}
                      onChange={(e) => {
                        if (colorPickerOpen === 'text') run((v) => applyColor(v, e.target.value))
                        else run((v) => applyHighlight(v, e.target.value))
                      }}
                      onBlur={() => setColorPickerOpen(null)}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          <span className={styles.sep} />

          {/* ── Lists ── */}
          <button className={styles.btn} title="无序列表" onClick={() => run((v) => toggleLinePrefix(v, '- '))}>
            <BulletIcon />
          </button>
          <button className={styles.btn} title="有序列表" onClick={() => run((v) => toggleLinePrefix(v, '1. '))}>
            <OrderedIcon />
          </button>
          <button className={styles.btn} title="任务列表" onClick={() => run((v) => toggleLinePrefix(v, '- [ ] '))}>
            <TaskIcon />
          </button>

          <span className={styles.sep} />

          {/* ── Block elements ── */}
          <button className={styles.btn} title="引用块" onClick={() => run((v) => toggleLinePrefix(v, '> '))}>
            <QuoteIcon />
          </button>
          <button className={styles.btn} title="代码块" onClick={() => run((v) => insertBlock(v, '\n```\n\n```\n', 5))}>
            <CodeBlockIcon />
          </button>
          <button className={styles.btn} title="数学公式块 ($$)" onClick={() => run((v) => insertBlock(v, '\n$$\n\n$$\n', 4))}>
            ∑
          </button>

          <span className={styles.sep} />

          {/* ── Insert elements ── */}
          <button className={styles.btn} title="插入链接 (⌘K)" onClick={() => run(insertLink)}>
            <LinkIcon />
          </button>
          <button className={styles.btn} title="插入图片 (⌘⇧I)" onClick={() => run(insertImage)}>
            <ImageIcon />
          </button>
          <button className={styles.btn} title="插入表格 (⌘⌥T)" onClick={() => run((v) => insertTable(v))}>
            <TableIcon />
          </button>
          <button className={styles.btn} title="水平分割线" onClick={() => run((v) => insertBlock(v, '\n\n---\n\n'))}>
            <HrIcon />
          </button>

          {/* ── Right-side controls (spacing) ── */}
          <span className={styles.spacer} />

          {/* ── Line height ── */}
          <span className={styles.label}>行距</span>
          <select
            className={styles.select}
            value={lineHeight}
            title="行间距"
            onChange={(e) => setLineHeight(Number(e.target.value))}
          >
            {LINE_HEIGHTS.map((lh) => (
              <option key={lh} value={lh}>{lh.toFixed(1)}</option>
            ))}
          </select>

          <span className={styles.sep} />

          {/* ── Font size ── */}
          <span className={styles.label}>字号</span>
          <button className={styles.btn} title="减小字号" onClick={() => setEditorFontSize(editorFontSize - 1)}>−</button>
          <span className={styles.sizeDisplay}>{editorFontSize}px</span>
          <button className={styles.btn} title="增大字号" onClick={() => setEditorFontSize(editorFontSize + 1)}>+</button>

        </div>
      </div>
    </div>
  )
}

// ── SVG Icons ────────────────────────────────────────────────────────────────

function UndoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
    </svg>
  )
}

function RedoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/>
    </svg>
  )
}

function ColorTextIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <text x="3" y="17" fontSize="16" fontWeight="bold" fontFamily="serif">A</text>
      <rect x="3" y="19" width="14" height="3" fill="#ef4444" rx="1"/>
    </svg>
  )
}

function ColorHighlightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 3L5 21M15 3l4 18M5 12h14" strokeLinecap="round"/>
      <rect x="2" y="19" width="20" height="3" fill="#fef08a" stroke="none" rx="1"/>
    </svg>
  )
}

function BulletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="4" cy="7" r="2"/><rect x="9" y="6" width="12" height="2" rx="1"/>
      <circle cx="4" cy="13" r="2"/><rect x="9" y="12" width="12" height="2" rx="1"/>
      <circle cx="4" cy="19" r="2"/><rect x="9" y="18" width="12" height="2" rx="1"/>
    </svg>
  )
}

function OrderedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <text x="2" y="8" fontSize="7" fontWeight="bold">1.</text>
      <text x="2" y="15" fontSize="7" fontWeight="bold">2.</text>
      <text x="2" y="22" fontSize="7" fontWeight="bold">3.</text>
      <rect x="10" y="6" width="12" height="2" rx="1"/>
      <rect x="10" y="13" width="12" height="2" rx="1"/>
      <rect x="10" y="20" width="12" height="2" rx="1"/>
    </svg>
  )
}

function TaskIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="6" height="6" rx="1"/>
      <path d="M5 8l1.5 1.5L9 6" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="3" y="14" width="6" height="6" rx="1"/>
      <rect x="13" y="7" width="8" height="2" rx="1" fill="currentColor" stroke="none"/>
      <rect x="13" y="16" width="8" height="2" rx="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function QuoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
    </svg>
  )
}

function CodeBlockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )
}

function TableIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
    </svg>
  )
}

function HrIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6" strokeOpacity="0.3"/>
      <line x1="3" y1="18" x2="21" y2="18" strokeOpacity="0.3"/>
    </svg>
  )
}
