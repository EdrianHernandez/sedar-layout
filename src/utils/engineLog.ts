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
