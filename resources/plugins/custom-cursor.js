/**
 * Custom Cursor Plugin for Typro
 *
 * Replaces the default thin-bar editor cursor with a styled block cursor.
 * Three styles are available — uncomment the one you want.
 *
 * Install: Sidebar → Plugins → Install Plugin → select this file
 */

module.exports = {
  id: 'custom-cursor',
  name: 'Custom Cursor',
  version: '1.0.0',
  description: 'Block / underline / neon cursor styles for the editor',

  setup(api) {
    // ── Pick one style below ─────────────────────────────────────────────────

    // Style 1: Neon block cursor (default — glowing block that blinks softly)
    api.injectCSS(NEON_BLOCK)

    // Style 2: Underline cursor — uncomment to use
    // api.injectCSS(UNDERLINE)

    // Style 3: Thin bar with accent color — uncomment to use
    // api.injectCSS(ACCENT_BAR)
  }
}

/* ── Style definitions ──────────────────────────────────────────────────────── */

// Style 1 · Neon block
// A filled rectangle the width of a character, glowing in the accent colour.
const NEON_BLOCK = `
  @keyframes typro-cursor-blink {
    0%, 100% { opacity: 0.9; }
    50%       { opacity: 0.25; }
  }

  .cm-cursor, .cm-dropCursor {
    border-left: none !important;
    width: 0.58em !important;
    background: var(--accent-color, #528bff) !important;
    border-radius: 2px !important;
    opacity: 0.9;
    box-shadow: 0 0 8px 2px color-mix(in srgb, var(--accent-color, #528bff) 60%, transparent);
    animation: typro-cursor-blink 1.1s ease-in-out infinite !important;
  }
`

// Style 2 · Underline
// A flat bar at the bottom of the line, like a classic terminal underline.
const UNDERLINE = `
  @keyframes typro-cursor-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }

  .cm-cursor, .cm-dropCursor {
    border-left: none !important;
    border-bottom: 2px solid var(--accent-color, #528bff) !important;
    width: 0.65em !important;
    background: transparent !important;
    margin-top: 1em !important;
    animation: typro-cursor-blink 1s step-end infinite !important;
  }
`

// Style 3 · Accent bar
// The default bar cursor but thicker (2 px) and in the theme accent colour,
// with a gentle fade blink instead of the abrupt OS blink.
const ACCENT_BAR = `
  @keyframes typro-cursor-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.15; }
  }

  .cm-cursor, .cm-dropCursor {
    border-left-width: 2px !important;
    border-left-color: var(--accent-color, #528bff) !important;
    border-radius: 1px;
    animation: typro-cursor-blink 1s ease-in-out infinite !important;
  }
`
