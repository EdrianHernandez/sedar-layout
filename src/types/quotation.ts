export type QuotationStatus = 'Draft' | 'For Approval' | 'Approved' | 'Sent' | 'Viewed' | 'Changes Requested' | 'Accepted' | 'Rejected' | 'Expired' | 'Withdrawn' | 'For Internal Approval' | 'Ready to Send' | 'Customer Approved' | 'Superseded'
export type InternalApprovalStatus = 'Not Submitted' | 'Pending Finance Approval' | 'Pending Manager Approval' | 'Approved' | 'Revision Required' | 'Rejected'
export type QuotationCustomerResponse = 'Customer Approved' | 'Rejected' | 'Requested Revision' | 'Pending Decision'
export type EffectiveQuotationStatus = QuotationStatus | 'Expired'
export type QuotationValidityClassification = 'Valid' | 'Expiring Soon' | 'Expired' | 'Not Applicable'
export interface QuotationLineItem { id: string; itemCode?: string; name: string; description: string; quantity: number; unit: string; unitRate: number; duration?: number; durationUnit?: string; discountAmount: number; taxRate: number; totalAmount: number; source: 'Marketing' | 'Operations' | 'Finance'; editableByMarketing: boolean }

export interface QuotationResponse {
  type: QuotationCustomerResponse
  contactId: string
  responseDate: string
  customerNotes?: string
  internalNotes?: string
  rejectionReason?: string
  responseMethod?: 'Email' | 'Phone' | 'Meeting' | 'Customer Portal'
  followUpDate?: string
  supportingDocumentName?: string
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
  lineItems?: QuotationLineItem[]
  subtotal: number
  vatRate: number
  vatAmount: number
  totalAmount: number
  currency: 'PHP' | 'USD'
  discountAmount?: number
  taxAmount?: number
  additionalCharges?: number
  validityDays: number
  validUntil?: string
  issuedAt?: string
  termsAndConditions?: string
  internalNotes?: string
  termsReference?: string
  revisionReason?: string
  preparedBy: string
  assignedRepresentativeId?: string
  status: QuotationStatus
  internalApprovalStatus?: InternalApprovalStatus
  validFrom?: string
  acceptedAt?: string
  customerResponse?: string
  paymentTerms?: string
  billingSchedule?: string
  depositRequirement?: string
  cancellationPolicy?: string
  rateAdjustmentCondition?: string
  additionalCommercialNotes?: string
  tags?: string[]
  approvedAt?: string
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
