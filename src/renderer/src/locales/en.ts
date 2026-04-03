export const en = {
  // TitleBar
  untitled: 'Untitled',
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
  editorLabel: 'Editor',
  previewLabel: 'Preview',

  // AutoSave
  autoSave: 'Auto Save',
  autoSaveInterval: 'Interval',
  autoSaveOn: 'On',
  autoSaveOff: 'Off',

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

  // File tree
  openFolder: 'Open Folder',
  closeFolder: 'Close Folder',
  noFolderOpen: 'No folder open.',
  openFolderHint: 'Open a folder to browse files.',
  newFile: 'New File',
  newFolder: 'New Folder',
  openFile: 'Open',
  rename: 'Rename',
  deleteItem: 'Delete',
  confirmDelete: 'Delete this item? This cannot be undone.',
  filenamePlaceholder: 'filename.md',
  foldernamePlaceholder: 'folder name',
  refreshFolder: 'Refresh',

  // RecentFiles
  noRecentFiles: 'No recent files.',
  openHint: 'Open a file with Cmd+O.',
  recentFiles: 'Recent Files',

  // TableOfContents
  noHeadings: 'No headings found.',
  addHeadings: 'Use # to create headings.',

  // Dialogs
  discardChanges: 'Discard unsaved changes?',

  // Wallpaper
  wallpaper: 'Wallpaper',
  chooseImage: 'Choose Image',
  removeWallpaper: 'Remove',
  bgOpacity: 'Opacity',
  noWallpaper: 'No wallpaper set',

  // Background colors
  bgColors: 'Background Colors',
  bgPrimary: 'Content',
  bgSecondary: 'Toolbar',
  bgSidebar: 'Sidebar',
  bgTitlebar: 'Titlebar',
  resetBgColors: 'Reset',

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

  // Plugins
  plugins: 'Plugins',
  pluginInstall: 'Install Plugin…',
  pluginInstalling: 'Installing…',
  pluginUninstall: 'Uninstall',
  pluginEnable: 'Enable',
  pluginDisable: 'Disable',
  pluginEnabled: 'Enabled',
  pluginDisabled: 'Disabled',
  pluginNoPlugins: 'No plugins installed',
  pluginInstallHint: 'Click "Install Plugin" to load a .js plugin file.',
  pluginReloadHint: 'Reload to apply changes',
  pluginReload: 'Reload',
  pluginConfirmUninstall: 'Uninstall plugin "{name}"?',
  pluginSampleTooltip: 'Show example plugin',
  pluginSampleLabel: 'Example plugin (save as .js)',
} as const

export type T = typeof en
