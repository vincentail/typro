// UTF-8 safe base64 helpers used to smuggle raw Markdown source through HTML
// data-* attributes for elements the WYSIWYG preview renders as opaque
// widgets (code fences, math, mermaid) so edits can round-trip exactly.

export function encodeRaw(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return btoa(binary)
}

export function decodeRaw(encoded: string): string {
  try {
    const binary = atob(encoded)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return ''
  }
}
