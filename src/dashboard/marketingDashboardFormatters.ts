const MANILA_TIME_ZONE = 'Asia/Manila'

export function getManilaDateKey(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: MANILA_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function formatDashboardDate(value: Date): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: MANILA_TIME_ZONE, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(value)
}

export function formatDashboardTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: MANILA_TIME_ZONE, hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export function formatShortDate(value?: string): string {
  if (!value) return 'No due date'
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00+08:00`) : new Date(value)
  return new Intl.DateTimeFormat('en-US', { timeZone: MANILA_TIME_ZONE, month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export function formatRelativeDate(value: string, now: Date): string {
  const difference = Date.parse(value) - now.getTime()
  const hours = Math.round(Math.abs(difference) / 3_600_000)
  const days = Math.round(Math.abs(difference) / 86_400_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return difference < 0 ? `${hours} hours ago` : `Due in ${hours} hours`
  if (days === 1) return difference < 0 ? '1 day overdue' : 'Due tomorrow'
  return difference < 0 ? `${days} days overdue` : `Due in ${days} days`
}

export function getDashboardGreeting(now: Date): string {
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: MANILA_TIME_ZONE, hour: '2-digit', hour12: false }).format(now))
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

export { MANILA_TIME_ZONE }
