/**
 * Returns the preview CSS as a plain string for embedding into PDF export.
 * Mirrors MarkdownPreview.module.css but uses :root vars instead of CSS modules.
 */
export function getPdfPreviewCss(): string {
  return `
*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  padding: 0;
  background: var(--bg-primary, #fff);
  color: var(--text-primary, #24292f);
  font-family: var(--preview-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  -webkit-font-smoothing: antialiased;
}

.preview {
  max-width: 860px;
  margin: 0 auto;
  padding: 32px 40px;
  font-size: 15px;
  line-height: 1.7;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: 1.25;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  color: var(--text-primary, #24292f);
}
h1 { font-size: 2em;    border-bottom: 1px solid var(--border-color, #d0d7de); padding-bottom: 0.3em; }
h2 { font-size: 1.5em;  border-bottom: 1px solid var(--border-color, #d0d7de); padding-bottom: 0.3em; }
h3 { font-size: 1.25em; }
h4 { font-size: 1em; }
h5 { font-size: 0.875em; }
h6 { font-size: 0.85em; color: var(--text-secondary, #57606a); }

p { margin-top: 0; margin-bottom: 1em; }

a { color: var(--accent-color, #0969da); text-decoration: none; }
a:hover { text-decoration: underline; }
a.header-anchor { display: none; }

code {
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Menlo, Consolas, monospace;
  font-size: 0.875em;
  background: var(--bg-secondary, #f8f9fa);
  padding: 0.2em 0.4em;
  border-radius: 4px;
}

pre {
  background: var(--bg-secondary, #f8f9fa);
  border: 1px solid var(--border-color, #d0d7de);
  border-radius: 8px;
  overflow: auto;
  margin: 1em 0;
  page-break-inside: avoid;
}
pre code {
  background: transparent;
  padding: 0;
  font-size: 13px;
  line-height: 1.6;
  border-radius: 0;
}

.shiki {
  background: transparent !important;
  padding: 16px 20px;
  border-radius: 8px;
  overflow: auto;
}
.shiki code {
  background: transparent;
  padding: 0;
  font-size: 13px;
  line-height: 1.6;
}

blockquote {
  margin: 1em 0;
  padding: 0 1em;
  border-left: 4px solid var(--border-color, #d0d7de);
  color: var(--text-secondary, #57606a);
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  font-size: 14px;
  page-break-inside: avoid;
}
th, td {
  padding: 8px 12px;
  border: 1px solid var(--border-color, #d0d7de);
  text-align: left;
}
th { background: var(--bg-secondary, #f8f9fa); font-weight: 600; }
tr:nth-child(even) td { background: var(--bg-secondary, #f8f9fa); }

ul, ol { margin: 0.5em 0 1em; padding-left: 2em; }
li { margin: 0.25em 0; }
li p { margin: 0; }

.task-list-item { list-style: none; margin-left: -1.5em; }
.task-list-item input[type='checkbox'] { margin-right: 0.5em; accent-color: var(--accent-color, #0969da); }

img { max-width: 100%; height: auto; border-radius: 4px; display: block; margin: 1em auto; }

hr { border: none; border-top: 2px solid var(--border-color, #d0d7de); margin: 2em 0; }

.math-block { margin: 1em 0; overflow-x: auto; text-align: center; }
.katex-display { margin: 0; }

.footnotes {
  font-size: 0.875em;
  color: var(--text-secondary, #57606a);
  border-top: 1px solid var(--border-color, #d0d7de);
  margin-top: 2em;
  padding-top: 1em;
}

@media print {
  body { background: white; }
  pre, blockquote, table { page-break-inside: avoid; }
  h1, h2, h3 { page-break-after: avoid; }
}
`
}
