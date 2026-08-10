export type TransactionType = 'Service Request' | 'Quotation' | 'Contract Request' | 'Contract' | 'Completed Service' | 'Invoice' | 'Payment' | 'Credit Note'

export type TransactionVisibility = 'Customer Visible' | 'Internal'
export type TransactionStatusGroup = 'Draft' | 'Under Review' | 'Awaiting Approval' | 'Awaiting Customer' | 'Approved' | 'Active' | 'Scheduled' | 'Completed' | 'Issued' | 'Pending' | 'Partially Paid' | 'Paid' | 'Rejected' | 'Expired' | 'Cancelled' | 'Terminated' | 'Superseded'
export type TransactionSourceDepartment = 'Marketing' | 'Operations' | 'Document Control' | 'Finance'
export type TransactionSourceKind = 'service-request' | 'quotation' | 'contract-request' | 'contract' | 'finance-summary'

export interface RelatedTransactionRecord {
  sourceKind: TransactionSourceKind
  sourceId: string
}

export interface CustomerTransaction {
  id: string
  customerId: string
  contactId?: string
  occurredAt: string
  type: TransactionType
  reference: string
  description: string
  status: TransactionStatusGroup
  sourceStatus: string
  amount?: number
  currency?: 'PHP' | 'USD'
  visibility: TransactionVisibility
  vesselName?: string
  serviceType?: string
  location?: string
  purchaseOrderReference?: string
  documentId?: string
  recordedBy?: string
  updatedAt?: string
  source: {
    department: TransactionSourceDepartment
    kind: TransactionSourceKind
    id: string
    route: string
  }
  customerContext: {
    customerId: string
    contactId?: string
  }
  relatedRecords: readonly RelatedTransactionRecord[]
  quotation?: {
    familyId: string
    revisionNumber: number
    superseded: boolean
  }
}

export interface CustomerTransactionSummary {
  totalCount: number
  completedSourceCount: number
  approvedQuotationValue: number
  openItemCount: number
  currency: 'PHP'
}
