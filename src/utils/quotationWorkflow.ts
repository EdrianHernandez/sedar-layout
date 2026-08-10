import type { EffectiveQuotationStatus, InternalApprovalStatus, Quotation } from '../types/quotation'
import type { ServiceRequest } from '../types/serviceRequest'
import { getEffectiveQuotationStatus } from './quotationStatus'

export type QuotationDisplayStatus = 'Draft' | 'For Approval' | 'Approved' | 'Sent' | 'Viewed' | 'Changes Requested' | 'Accepted' | 'Rejected' | 'Expired' | 'Withdrawn'
export type QuotationAction = 'view' | 'edit' | 'submit' | 'duplicate' | 'delete' | 'withdraw' | 'send' | 'download' | 'print' | 'resend' | 'response' | 'feedback' | 'revision' | 'request' | 'contract' | 'appointment' | 'extend'

export const ACTIVE_QUOTATION_STATUSES = new Set<QuotationDisplayStatus>(['Draft', 'For Approval', 'Approved', 'Sent', 'Viewed', 'Changes Requested', 'Accepted'])

export function getQuotationDisplayStatus(quotation: Quotation): QuotationDisplayStatus {
  const status: EffectiveQuotationStatus = getEffectiveQuotationStatus(quotation)
  if (status === 'For Internal Approval') return 'For Approval'
  if (status === 'Ready to Send') return 'Approved'
  if (status === 'Customer Approved') return 'Accepted'
  if (status === 'Superseded') return 'Withdrawn'
  return status
}

export function getInternalApprovalStatus(quotation: Quotation): InternalApprovalStatus {
  if (quotation.internalApprovalStatus) return quotation.internalApprovalStatus
  const status = getQuotationDisplayStatus(quotation)
  if (status === 'For Approval') return 'Pending Finance Approval'
  if (['Approved', 'Sent', 'Viewed', 'Changes Requested', 'Accepted', 'Rejected', 'Expired'].includes(status)) return 'Approved'
  return 'Not Submitted'
}

export function getAvailableQuotationActions(quotation: Quotation): QuotationAction[] {
  const status = getQuotationDisplayStatus(quotation)
  const actions: Record<QuotationDisplayStatus, QuotationAction[]> = {
    Draft: ['view', 'edit', 'submit', 'duplicate', 'delete'],
    'For Approval': ['view', 'withdraw', 'duplicate'],
    Approved: ['view', 'send', 'download', 'print', 'duplicate'],
    Sent: ['view', 'resend', 'response', 'download', 'duplicate'],
    Viewed: ['view', 'resend', 'response', 'download', 'duplicate'],
    'Changes Requested': ['feedback', 'revision', 'duplicate'],
    Accepted: ['view', 'download', 'print', 'feedback', 'duplicate', 'request', 'contract', 'appointment'],
    Rejected: ['view', 'revision', 'duplicate'],
    Expired: ['view', 'extend', 'revision', 'duplicate'],
    Withdrawn: ['view', 'duplicate'],
  }
  return actions[status]
}

export function isQuotationEligibleRequest(request: ServiceRequest, quotations: Quotation[], allowRevision = false): boolean {
  if (!request.operationsReview || !['Feasible', 'Feasible with Conditions'].includes(request.operationsReview.status)) return false
  if (['Draft', 'Cancelled', 'Completed'].includes(request.status) || request.waitingForCustomerInformation) return false
  if (allowRevision) return true
  return !quotations.some((quotation) => quotation.serviceRequestId === request.id && ACTIVE_QUOTATION_STATUSES.has(getQuotationDisplayStatus(quotation)))
}
