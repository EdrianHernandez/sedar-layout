import type { ContractStatus, ContractTerminationReason, SignatureStatus, SignatureVerificationStatus } from '../types/contract'

export const CONTRACT_STATUSES: readonly ContractStatus[] = ['Draft', 'For Internal Review', 'Ready for Signature', 'Awaiting Signatures', 'Active', 'Terminated', 'Expired', 'Superseded']
export const SIGNATURE_STATUSES: readonly SignatureStatus[] = ['Not Started', 'SEDAR Signed', 'Customer Signed', 'Fully Executed', 'Declined']
export const SIGNATURE_VERIFICATION_STATUSES: readonly SignatureVerificationStatus[] = ['Pending Verification', 'Verified', 'Rejected']
export const CONTRACT_TERMINATION_REASONS: readonly ContractTerminationReason[] = ['Customer Request', 'Breach of Terms', 'Operational Limitation', 'Mutual Agreement', 'Service No Longer Required', 'Other']

export const CONTRACT_SIGNATURE_STATUSES = SIGNATURE_STATUSES
export const SIGNATURE_VERIFICATION_OPTIONS = SIGNATURE_VERIFICATION_STATUSES
export const TERMINATION_REASONS = CONTRACT_TERMINATION_REASONS
