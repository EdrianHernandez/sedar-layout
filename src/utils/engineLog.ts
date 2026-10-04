import type { EngineLog } from '../types/engineLog'

export function computeRunningHours(log: EngineLog, now: Date = new Date()): number | null {
  if (!log.timeStart) return null
  const start = new Date(log.timeStart)
  if (Number.isNaN(start.getTime())) return null
  const end = log.timeStop ? new Date(log.timeStop) : now
  if (Number.isNaN(end.getTime())) return null
  const diffMs = end.getTime() - start.getTime()
  if (diffMs <= 0) return 0
  return Math.round((diffMs / 3_600_000) * 10) / 10
}

export function formatClock(iso: string | null): string {
  if (!iso) return '--:--:--'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '--:--:--'
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

export function formatRunningHours(value: number | null): string {
  if (value === null) return '0.0'
  return value.toFixed(1)
}

// Exact duration between two watch times, in decimal hours.
// Strict maritime 24-hour format: both values must be exactly "HH:MM" with HH ≤ 23 and
// MM ≤ 59 — mid-entry partials ("20", "20:2") or impossible values ("99:99") return null
// so the meter and total fall back safely. Negative spans roll over midnight (overnight).
export function computeWatchDurationHours(start: string, stop: string): number | null {
  const parse = (value: string): [number, number] | null => {
    if (!/^\d{2}:\d{2}$/.test(value)) return null
    const [hours, minutes] = value.split(':').map(Number)
    return hours <= 23 && minutes <= 59 ? [hours, minutes] : null
  }
  const from = parse(start)
  const to = parse(stop)
  if (!from || !to) return null
  let minutes = to[0] * 60 + to[1] - (from[0] * 60 + from[1])
  if (minutes < 0) minutes += 24 * 60
  return Math.round((minutes / 60) * 100) / 100
}

// Current local wall-clock time as an HH:MM watch value (e.g. "14:32").
export function currentClockTime(date: Date = new Date()): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// Local HH:MM for a stored ISO timestamp (e.g. "14:00"); missing/invalid → fallback.
export function formatTimeOnly(iso: string | null, fallback = '—'): string {
  if (!iso) return fallback
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}
