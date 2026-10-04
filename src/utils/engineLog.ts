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

// Exact duration between two HH:MM watch times, in decimal hours.
// Returns null when either time is missing/unparseable; negative spans roll over midnight (overnight watch).
export function computeWatchDurationHours(start: string, stop: string): number | null {
  if (!start || !stop) return null
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = stop.split(':').map(Number)
  if (![sh, sm, eh, em].every((part) => Number.isFinite(part))) return null
  let minutes = eh * 60 + em - (sh * 60 + sm)
  if (minutes < 0) minutes += 24 * 60
  return Math.round((minutes / 60) * 100) / 100
}

// Current local wall-clock time as an HH:MM watch value (e.g. "14:32").
export function currentClockTime(date: Date = new Date()): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
