export const en = {
  // TitleBar
  toggleSidebar: 'Toggle Sidebar (⌘⇧L)',
  toggleToolbar: 'Toggle Toolbar (⌘⇧T)',
  sourceMode: 'Source Mode',
  splitView: 'Split View',
  previewMode: 'Preview Mode',
  themeManager: 'Theme Manager',
  language: 'Language',

  // Toolbar
  undo: 'Undo (⌘Z)',
  redo: 'Redo (⌘⇧Z)',
  paragraphHeading: 'Paragraph/Heading',
  paragraphLabel: 'Body',
  bold: 'Bold (⌘B)',
  italic: 'Italic (⌘I)',
  strikethrough: 'Strikethrough (⌘⇧S)',
  inlineCode: 'Inline Code (⌘`)',
  superscript: 'Superscript',
  subscript: 'Subscript',
  textColor: 'Text Color',
  highlightColor: 'Highlight Color',
  paletteTextColor: 'Text Color',
  paletteHighlightColor: 'Highlight Color',
  customColor: 'Custom Color',
  bulletList: 'Bullet List',
  orderedList: 'Ordered List',
  taskList: 'Task List',
  blockquote: 'Blockquote',
  codeBlock: 'Code Block',
  mathBlock: 'Math Block ($$)',
  insertLink: 'Insert Link (⌘K)',
  insertImage: 'Insert Image (⌘⇧I)',
  insertTable: 'Insert Table (⌘⌥T)',
  horizontalRule: 'Horizontal Rule',
  lineHeight: 'Line Height',
  lineHeightTooltip: 'Line Spacing',
  fontSize: 'Font Size',
  decreaseFontSize: 'Decrease Font Size',
  increaseFontSize: 'Increase Font Size',

  // StatusBar
  fileType: 'File type',
  cursorPosition: 'Cursor position',
  wordCountLabel: 'Word count',
  charCountLabel: 'Character count',
  lineCountLabel: 'Line count',
  words: 'words',
  chars: 'chars',
  lines: 'lines',

  // Sidebar
  contents: 'Contents',
  files: 'Files',

  // RecentFiles
  noRecentFiles: 'No recent files.',
  openHint: 'Open a file with Cmd+O.',
  recentFiles: 'Recent Files',

  // TableOfContents
  noHeadings: 'No headings found.',
  addHeadings: 'Use # to create headings.',

  // Dialogs
  discardChanges: 'Discard unsaved changes?',

  // ThemeManager
  dark: 'Dark',
  light: 'Light',
  activeLabel: '✓ Active',
  apply: 'Apply',
  remove: 'Remove',
  install: 'Install',
  themeManagerTitle: 'Theme Manager',
  installed: 'Installed',
  browse: 'Browse',
  importTab: 'Import',
  searchPlaceholder: 'Search themes…',
  noThemeMatch: 'No themes match your search.',
  allInstalled: 'All available themes are installed.',
  importHint: 'Paste a theme JSON or load a .json file. The JSON must include all required CSS variables.',
  loadFromFile: 'Load from file…',
  importTheme: 'Import Theme',
  requiredFields: 'Required fields',
} as const

export type T = typeof en
