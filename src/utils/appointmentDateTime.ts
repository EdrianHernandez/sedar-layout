export const PROTOTYPE_TODAY = '2026-08-04'

export const getAppointmentDurationMinutes = (startAt: string, endAt: string): number =>
  Math.max(0, Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60_000))

export const formatAppointmentDate = (value: string, locale = 'en-PH'): string =>
  new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Manila' }).format(new Date(value))

export const formatAppointmentTime = (value: string, locale = 'en-PH'): string =>
  new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' }).format(new Date(value))

export const formatAppointmentDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (!hours) return `${remainder} min`
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`
}

export const isAppointmentOnDate = (startAt: string, date: string): boolean => {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Manila' }).formatToParts(new Date(startAt))
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}` === date
}
