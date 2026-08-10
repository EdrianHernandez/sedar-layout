import type { Contract, ContractReviewStatus } from '../types/contract'
import type { Quotation } from '../types/quotation'
import { getEffectiveContractStatus } from './contractStatus'
import { getInternalApprovalStatus, getQuotationDisplayStatus } from './quotationWorkflow'

export type ContractDisplayStatus = 'Requested' | 'Drafting' | 'Internal Review' | 'Approved for Signature' | 'Sent for Signature' | 'Partially Signed' | 'Fully Executed' | 'Active' | 'Expiring Soon' | 'Expired' | 'Suspended' | 'Terminated'
export type MarketingContractAction = 'view' | 'quotation' | 'update' | 'withdraw' | 'records' | 'document' | 'respond' | 'activity' | 'download' | 'send' | 'remind' | 'signed-copy' | 'customer' | 'request' | 'amend' | 'renew' | 'appointment' | 'notify' | 'duplicate' | 'termination'

export function getContractDisplayStatus(contract: Contract, now = new Date()): ContractDisplayStatus {
  const status = getEffectiveContractStatus(contract, now)
  if (status === 'Draft') return 'Drafting'
  if (status === 'For Internal Review') return 'Internal Review'
  if (status === 'Ready for Signature') return 'Approved for Signature'
  if (status === 'Awaiting Signatures') return contract.signatureStatus === 'Not Started' ? 'Sent for Signature' : 'Partially Signed'
  if (status === 'Superseded') return 'Terminated'
  if (status === 'Active' && contract.expirationDate) { const days = Math.ceil((Date.parse(contract.expirationDate) - now.getTime()) / 86400000); if (days >= 0 && days <= 30) return 'Expiring Soon' }
  return status
}

export function getSignatureDisplayStatus(contract: Contract): 'Not Ready for Signature' | 'Awaiting SEDAR Signature' | 'Awaiting Customer Signature' | 'Partially Signed' | 'Fully Signed' {
  if (['Not Started', 'Not Ready for Signature'].includes(contract.signatureStatus)) return getContractDisplayStatus(contract) === 'Approved for Signature' ? 'Awaiting SEDAR Signature' : 'Not Ready for Signature'
  if (contract.signatureStatus === 'SEDAR Signed') return 'Awaiting Customer Signature'
  if (contract.signatureStatus === 'Customer Signed' || contract.signatureStatus === 'Partially Signed') return 'Partially Signed'
  if (contract.signatureStatus === 'Fully Executed' || contract.signatureStatus === 'Fully Signed') return 'Fully Signed'
  return 'Not Ready for Signature'
}

export function getAvailableMarketingContractActions(contract: Contract): MarketingContractAction[] {
  const status = getContractDisplayStatus(contract)
  const actions: Record<ContractDisplayStatus, MarketingContractAction[]> = {
    Requested: ['view', 'quotation', 'update', 'withdraw'], Drafting: ['view', 'records', 'document', 'withdraw'], 'Internal Review': ['view', 'respond', 'quotation', 'activity'], 'Approved for Signature': ['view', 'download', 'send', 'records'], 'Sent for Signature': ['view', 'remind', 'signed-copy', 'download', 'activity'], 'Partially Signed': ['view', 'remind', 'signed-copy', 'download'], 'Fully Executed': ['view', 'download', 'customer', 'request', 'amend', 'renew', 'appointment', 'activity'], Active: ['view', 'download', 'customer', 'request', 'amend', 'renew', 'appointment', 'activity'], 'Expiring Soon': ['view', 'renew', 'notify', 'activity'], Expired: ['view', 'renew', 'duplicate', 'download'], Suspended: ['view', 'download', 'activity'], Terminated: ['view', 'download', 'termination', 'activity'],
  }
  return actions[status]
}

export function getContractWorkflowState(contract: Contract) { const status = getContractDisplayStatus(contract); const order: ContractDisplayStatus[] = ['Requested', 'Drafting', 'Internal Review', 'Approved for Signature', 'Sent for Signature', 'Partially Signed', 'Fully Executed', 'Active', 'Expired']; return { status, index: Math.max(0, order.indexOf(status)), order } }
export const getContractLifecycleState = getContractWorkflowState
export const getRequiredContractReviews = (contract: Contract) => [{ department: 'Operations', status: reviewStatus(contract.operationsReviewStatus), required: true }, { department: 'Finance', status: reviewStatus(contract.financeReviewStatus), required: true }, { department: 'Legal', status: reviewStatus(contract.legalReviewStatus), required: true }, { department: 'Management', status: reviewStatus(contract.managementApprovalStatus), required: contract.contractValue >= 500000 || contract.contractType === 'Amendment' }]
export const getContractExpirationState = getContractExpirationAlert
export const isQuotationEligibleForContractRequest = (quotation: Quotation, contracts: Contract[]) => getQuotationDisplayStatus(quotation) === 'Accepted' && getInternalApprovalStatus(quotation) === 'Approved' && !contracts.some((contract) => contract.quotationId === quotation.id && !['Expired', 'Terminated', 'Superseded'].includes(contract.status))
export const reviewStatus = (value?: ContractReviewStatus): ContractReviewStatus => value ?? 'Not Started'
export function getContractExpirationAlert(contract: Contract, now = new Date()) { if (!contract.expirationDate) return { level: 'none' as const, label: 'No fixed expiration', days: null }; const days = Math.ceil((Date.parse(contract.expirationDate) - now.getTime()) / 86400000); if (days < 0) return { level: 'expired' as const, label: `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`, days }; if (days <= 7) return { level: 'critical' as const, label: `Expires in ${days} day${days === 1 ? '' : 's'}`, days }; if (days <= 30) return { level: 'warning' as const, label: `Expires in ${days} days`, days }; if (days <= 60) return { level: 'notice' as const, label: `Expires in ${days} days`, days }; return { level: 'normal' as const, label: `${days} days remaining`, days } }
