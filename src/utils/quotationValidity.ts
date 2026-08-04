import type { Quotation, QuotationValidityClassification } from '../types/quotation'
import { getEffectiveQuotationStatus } from './quotationStatus'

export interface QuotationValidity {
  classification: QuotationValidityClassification
  label: string
  daysRemaining: number | null
}

export function getQuotationValidity(quotation: Quotation, now: Date = new Date()): QuotationValidity {
  if (!quotation.validUntil || ['Draft', 'Customer Approved', 'Rejected', 'Superseded'].includes(quotation.status)) {
    return { classification: 'Not Applicable', label: 'Not applicable', daysRemaining: null }
  }

  const expiration = new Date(quotation.validUntil)
  if (Number.isNaN(expiration.getTime())) return { classification: 'Not Applicable', label: 'Not applicable', daysRemaining: null }

  const difference = expiration.getTime() - now.getTime()
  const daysRemaining = Math.max(0, Math.ceil(difference / 86_400_000))
  if (getEffectiveQuotationStatus(quotation, now) === 'Expired') {
    const daysAgo = Math.max(1, Math.floor(Math.abs(difference) / 86_400_000))
    return { classification: 'Expired', label: `Expired ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`, daysRemaining: 0 }
  }
  if (daysRemaining <= 7) return { classification: 'Expiring Soon', label: daysRemaining === 0 ? 'Expires today' : `Expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`, daysRemaining }
  return { classification: 'Valid', label: `Valid for ${daysRemaining} more days`, daysRemaining }
}

export const classifyQuotationValidity = getQuotationValidity
