import type { OperationsReviewStatus, ServiceRequest } from '../types/serviceRequest'

export type MarketingRequestAction =
  | 'edit'
  | 'assign'
  | 'submit'
  | 'respond'
  | 'view-submission'
  | 'create-quotation'
  | 'view-quotation'
  | 'schedule-follow-up'
  | 'schedule-appointment'
  | 'view-appointment'
  | 'duplicate'
  | 'cancel'

const reviewStatus = (request: ServiceRequest): OperationsReviewStatus => request.operationsReview?.status ?? 'Not Submitted'

export function getAvailableMarketingActions(request: ServiceRequest): MarketingRequestAction[] {
  const review = reviewStatus(request)
  if (request.status === 'Completed') return []
  if (request.status === 'Cancelled') return ['duplicate']
  if (request.status === 'Draft') return ['edit', 'assign', 'duplicate', 'cancel']
  if (review === 'More Information Required') return ['respond', 'edit', 'duplicate', 'cancel']
  if (review === 'Not Feasible') return ['view-submission', 'duplicate', 'cancel']
  if (request.status === 'Under Review') return ['edit', 'assign', 'submit', 'duplicate', 'cancel']
  if (request.status === 'Awaiting Operations') return ['view-submission', 'duplicate', 'cancel']
  if (review === 'Feasible' || review === 'Feasible with Conditions') {
    if (request.status === 'Quotation Prepared') return ['view-quotation', 'duplicate', 'cancel']
    if (request.status === 'Awaiting Customer Approval') return ['view-quotation', 'schedule-follow-up', 'duplicate', 'cancel']
    if (request.status === 'Approved') return ['schedule-appointment', 'duplicate', 'cancel']
    if (request.status === 'Scheduled') return ['view-appointment', 'duplicate', 'cancel']
    return ['create-quotation', 'duplicate', 'cancel']
  }
  if (request.status === 'Approved') return ['schedule-appointment', 'duplicate', 'cancel']
  if (request.status === 'Scheduled') return ['view-appointment', 'duplicate', 'cancel']
  return ['duplicate', 'cancel']
}

export function canPerformMarketingAction(request: ServiceRequest, action: MarketingRequestAction): boolean {
  return getAvailableMarketingActions(request).includes(action)
}
