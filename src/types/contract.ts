export type ContractStatus = 'Draft' | 'For Internal Review' | 'Ready for Signature' | 'Awaiting Signatures' | 'Active' | 'Terminated' | 'Expired' | 'Superseded'
export type SignatureStatus = 'Not Started' | 'SEDAR Signed' | 'Customer Signed' | 'Fully Executed' | 'Declined'
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
}

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
  currency: 'PHP'
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

export type ContractSignatureInput = Omit<ContractSignature, 'id'> & { id?: string }
export type ContractTerminationRequestInput = Omit<ContractTerminationRequest, 'id' | 'requestedAt' | 'status'> & { id?: string; requestedAt?: string; status?: ContractTerminationRequest['status'] }
