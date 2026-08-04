import type { EffectiveQuotationStatus, Quotation } from '../types/quotation'

const EXPIRABLE_STATUSES = new Set<Quotation['status']>(['Sent', 'Viewed'])

export function getEffectiveQuotationStatus(quotation: Quotation, now: Date = new Date()): EffectiveQuotationStatus {
  if (!quotation.validUntil || !EXPIRABLE_STATUSES.has(quotation.status)) return quotation.status
  const expiration = new Date(quotation.validUntil)
  return !Number.isNaN(expiration.getTime()) && expiration.getTime() < now.getTime() ? 'Expired' : quotation.status
}

export const getEffectiveStatus = getEffectiveQuotationStatus
