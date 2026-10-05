import type { EngineLog } from '../types/engineLog'

export function computeRunningHours(log: EngineLog, now: Date = new Date()): number | null {
  // Only an OPERATED engine accumulates running hours: standby / no-operation rows compute
  // strictly 0.0 wherever this is consumed (monitoring card TOTAL, review rows, home card).
  if (log.status !== 'operated') return 0
  if (!log.timeStart) return null
  const start = new Date(log.timeStart)
  if (Number.isNaN(start.getTime())) return null
  const end = log.timeStop ? new Date(log.timeStop) : now
  if (Number.isNaN(end.getTime())) return null
  let diffMs = end.getTime() - start.getTime()
  // Overnight runs (stop before start) roll over midnight, matching computeWatchDurationHours.
  // An ongoing row whose start is still in the future counts as 0 rather than ~24h.
  if (diffMs < 0) diffMs = log.timeStop ? diffMs + 86_400_000 : 0
  if (diffMs <= 0) return 0
  return Math.round((diffMs / 3_600_000) * 10) / 10
}

// Fuel drawn by this engine during the watch: standby / no-operation rows force 0 (their ROB
// stop equals ROB start — no fuel was drawn for this engine), while operated rows clamp at 0
// so an inverted window can never show negative consumption.
export function fuelConsumedBy(log: EngineLog): number {
  if (log.status !== 'operated') return 0
  return Math.max(0, log.fuelRobStart - log.fuelRobStop)
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

// Today's ISO timestamp at a strict "HH:MM" watch value (e.g. "13:09" → today 13:09 local);
// partial or impossible values return null so an invalid keystroke never reaches the log.
export function localIsoAt(hhmm: string): string | null {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

// Local HH:MM for a stored ISO timestamp (e.g. "14:00"); missing/invalid → fallback.
export function formatTimeOnly(iso: string | null, fallback = '—'): string {
  if (!iso) return fallback
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}
