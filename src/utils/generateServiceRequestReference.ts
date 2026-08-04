import type { ServiceRequest } from '../types/serviceRequest'

export function generateServiceRequestReference(existing: ServiceRequest[], year = new Date().getFullYear()): string {
  const prefix = `SR-${year}-`
  const highest = existing.reduce((current, request) => {
    if (!request.referenceNumber.startsWith(prefix)) return current
    const sequence = Number(request.referenceNumber.slice(prefix.length))
    return Number.isFinite(sequence) ? Math.max(current, sequence) : current
  }, 0)
  return `${prefix}${String(highest + 1).padStart(3, '0')}`
}
