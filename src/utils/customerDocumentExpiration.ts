export const getDocumentExpiryEndOfDay = (expiryDate: string): Date | undefined => {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expiryDate)
  const expiry = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 23, 59, 59, 999)
    : new Date(expiryDate)
  if (Number.isNaN(expiry.getTime())) return undefined
  if (!dateOnly) expiry.setHours(23, 59, 59, 999)
  return expiry
}

export const isDocumentExpired = (expiryDate: string | undefined, now: Date = new Date()): boolean => {
  if (!expiryDate) return false
  const endOfDay = getDocumentExpiryEndOfDay(expiryDate)
  return Boolean(endOfDay && now.getTime() > endOfDay.getTime())
}
