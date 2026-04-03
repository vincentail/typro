export interface LogEntry {
  time: string
  level: 'log' | 'info' | 'warn' | 'error'
  msg: string
}

const MAX = 3000
const buffer: LogEntry[] = []

function push(level: LogEntry['level'], args: unknown[]) {
  const msg = args
    .map((a) => {
      if (a instanceof Error) return `${a.message}\n${a.stack ?? ''}`
      if (typeof a === 'object') { try { return JSON.stringify(a) } catch { /**/ } }
      return String(a)
    })
    .join(' ')
  buffer.push({ time: new Date().toISOString(), level, msg })
  if (buffer.length > MAX) buffer.shift()
}

export function initLogger(): void {
  ;(['log', 'info', 'warn', 'error'] as const).forEach((level) => {
    const orig = (console[level] as (...a: unknown[]) => void).bind(console)
    ;(console as unknown as Record<string, (...a: unknown[]) => void>)[level] = (...args) => {
      push(level, args)
      orig(...args)
    }
  })

  window.addEventListener('error', (e) => {
    push('error', [`[UncaughtError] ${e.message}`, e.error?.stack ?? ''])
  })
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason
    push('error', [`[UnhandledRejection] ${String(r)}`, r?.stack ?? ''])
  })
}

export function getRendererLogText(): string {
  const lines = [
    '=== RENDERER LOG ===',
    `Exported: ${new Date().toISOString()}`,
    `Platform: ${navigator.platform}`,
    `User-Agent: ${navigator.userAgent}`,
    ''
  ]
  for (const e of buffer) {
    lines.push(`[${e.time}] [${e.level.toUpperCase().padEnd(5)}] ${e.msg}`)
  }
  return lines.join('\n')
}
