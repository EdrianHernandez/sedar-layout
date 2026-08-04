export type QuotationStatus = 'Draft' | 'For Internal Approval' | 'Ready to Send' | 'Sent' | 'Viewed' | 'Customer Approved' | 'Rejected' | 'Expired' | 'Superseded'
export type QuotationCustomerResponse = 'Customer Approved' | 'Rejected' | 'Requested Revision'
export type EffectiveQuotationStatus = QuotationStatus | 'Expired'
export type QuotationValidityClassification = 'Valid' | 'Expiring Soon' | 'Expired' | 'Not Applicable'

export interface QuotationResponse {
  type: QuotationCustomerResponse
  contactId: string
  responseDate: string
  customerNotes?: string
  internalNotes?: string
  rejectionReason?: string
}

export interface Quotation {
  id: string
  quotationNumber: string
  revisionNumber: number
  originalQuotationId: string
  supersedesQuotationId?: string
  supersededByQuotationId?: string
  serviceRequestId: string
  customerId: string
  contactId: string
  vesselName?: string
  serviceType?: string
  purchaseOrderReference?: string
  subject: string
  lineItemSummaries: string[]
  subtotal: number
  vatRate: number
  vatAmount: number
  totalAmount: number
  currency: 'PHP'
  validityDays: number
  validUntil?: string
  issuedAt?: string
  termsAndConditions?: string
  internalNotes?: string
  termsReference?: string
  revisionReason?: string
  preparedBy: string
  status: QuotationStatus
  response?: QuotationResponse
  submittedForInternalApprovalAt?: string
  sentAt?: string
  viewedAt?: string
  respondedAt?: string
  createdAt: string
  updatedAt: string
}

export type QuotationInput = Omit<Quotation, 'id' | 'revisionNumber' | 'originalQuotationId' | 'supersedesQuotationId' | 'supersededByQuotationId' | 'status' | 'response' | 'submittedForInternalApprovalAt' | 'sentAt' | 'viewedAt' | 'respondedAt' | 'createdAt' | 'updatedAt'> & {
  status?: QuotationStatus
}
