export type ContractStatus = 'Requested' | 'Drafting' | 'Internal Review' | 'Approved for Signature' | 'Sent for Signature' | 'Partially Signed' | 'Fully Executed' | 'Active' | 'Suspended' | 'Terminated' | 'Expired' | 'Draft' | 'For Internal Review' | 'Ready for Signature' | 'Awaiting Signatures' | 'Superseded'
export type SignatureStatus = 'Not Ready for Signature' | 'Awaiting SEDAR Signature' | 'Awaiting Customer Signature' | 'Partially Signed' | 'Fully Signed' | 'Not Started' | 'SEDAR Signed' | 'Customer Signed' | 'Fully Executed' | 'Declined'
export type ContractReviewStatus = 'Not Started' | 'Not Required' | 'Pending' | 'Approved' | 'Revision Required' | 'Rejected'
export type SignatureParty = 'SEDAR' | 'Customer'
export type SignatureVerificationStatus = 'Pending Verification' | 'Verified' | 'Rejected'
export type ContractValidityClassification = 'Upcoming' | 'Active' | 'Expiring Soon' | 'Expired'
export type ContractTerminationReason = 'Customer Request' | 'Breach of Terms' | 'Operational Limitation' | 'Mutual Agreement' | 'Service No Longer Required' | 'Other'

export interface ContractSignature {
  id: string
  party: SignatureParty
  signatoryId: string
  signatoryName: string
  organization: string
  position: string
  signatureRole: string
  signedAt: string
  recordedBy: string
  supportingDocumentName?: string
  verificationStatus: SignatureVerificationStatus
  internalNotes?: string
  contractVersion?: number
  receivedAt?: string
  documentId?: string
}
export interface ContractCorrectionRequest { id: string; section: string; requestedChange: string; reason: string; priority: 'Normal' | 'High' | 'Urgent'; supportingDocumentName?: string; requestedBy: string; requestedAt: string; status: 'Requested' | 'Responded' | 'Closed'; response?: string }

export interface ContractTerminationRequest {
  id: string
  reason: ContractTerminationReason
  explanation?: string
  requestedTerminationDate: string
  internalNotes?: string
  requestedBy: string
  requestedAt: string
  status: 'Pending Review' | 'Approved' | 'Rejected'
}

export interface Contract {
  id: string
  contractNumber: string
  version?: number
  contractRequestNumber?: string
  customerId: string
  contactId: string
  quotationId: string
  serviceRequestId: string
  serviceType: string
  vesselName: string
  title: string
  description?: string
  startDate: string
  endDate: string
  effectiveDate: string
  expirationDate: string
  contractValue: number
  currency: 'PHP' | 'USD'
  contractType?: string
  serviceCoverage?: string
  operationsReviewStatus?: ContractReviewStatus
  financeReviewStatus?: ContractReviewStatus
  legalReviewStatus?: ContractReviewStatus
  managementApprovalStatus?: ContractReviewStatus
  assignedRepresentativeId?: string
  requestedEffectiveDate?: string
  requestedExpirationDate?: string
  customerSignatoryName?: string
  customerSignatoryPosition?: string
  customerEmail?: string
  billingAddress?: string
  specialCustomerRequirements?: string
  requiredCompletionDate?: string
  marketingNotes?: string
  supportingDocumentNames?: string[]
  requestedAt?: string
  lastReminderAt?: string
  amendmentRequestedAt?: string
  renewalRequestedAt?: string
  renewalNoticeDate?: string
  approvedForSignatureAt?: string
  activatedAt?: string
  legalReviewer?: string
  financeReviewer?: string
  operationsReviewer?: string
  authorizedSedarSignatory?: string
  correctionRequests?: ContractCorrectionRequest[]
  termsAndConditions?: string
  internalNotes?: string
  preparedBy: string
  managedBy: string
  status: ContractStatus
  signatureStatus: SignatureStatus
  signatures: ContractSignature[]
  selectedCustomerContactId?: string
  signatories?: string[]
  sentForSignatureAt?: string
  fullyExecutedAt?: string
  submittedForInternalReviewAt?: string
  terminationRequest?: ContractTerminationRequest
  terminatedAt?: string
  terminationEffectiveDate?: string
  supersedesContractId?: string
  supersededByContractId?: string
  createdAt: string
  updatedAt: string
}

export type ContractInput = Omit<Contract, 'id' | 'status' | 'signatureStatus' | 'signatures' | 'submittedForInternalReviewAt' | 'sentForSignatureAt' | 'terminationRequest' | 'terminatedAt' | 'terminationEffectiveDate' | 'createdAt' | 'updatedAt'> & {
  status?: ContractStatus
  signatureStatus?: SignatureStatus
  signatures?: ContractSignature[]
}

export interface SendForSignatureInput {
  customerContactId: string
  sedarSignatoryName: string
  customerSignatoryName: string
}
export interface ContractRequestDetails { contractType: string; requestedEffectiveDate: string; requestedExpirationDate: string; customerSignatoryName: string; customerSignatoryPosition: string; customerEmail: string; billingAddress: string; serviceCoverage: string; specialCustomerRequirements?: string; requiredCompletionDate: string; marketingNotes?: string; supportingDocumentNames?: string[] }

export type ContractSignatureInput = Omit<ContractSignature, 'id'> & { id?: string }
export type ContractTerminationRequestInput = Omit<ContractTerminationRequest, 'id' | 'requestedAt' | 'status'> & { id?: string; requestedAt?: string; status?: ContractTerminationRequest['status'] }
