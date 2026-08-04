export const DOCUMENT_TYPES = ['Contract', 'Quotation', 'Invoice', 'Purchase Order', 'Service Report', 'Certificate', 'Insurance', 'Correspondence', 'Marketing Material', 'Other'] as const
export type DocumentType = typeof DOCUMENT_TYPES[number]

export const DEPARTMENTS = ['Marketing', 'Operations', 'Finance', 'Document Control', 'Management'] as const
export type Department = typeof DEPARTMENTS[number]

export const DOCUMENT_VISIBILITIES = ['Internal', 'Customer Visible'] as const
export type Visibility = typeof DOCUMENT_VISIBILITIES[number]

export const DOCUMENT_SOURCES = ['Uploaded', 'Official Record'] as const
export type DocumentSource = typeof DOCUMENT_SOURCES[number]

export const DOCUMENT_STATUSES = ['Active', 'Expired', 'Archived'] as const
export type DocumentStatus = typeof DOCUMENT_STATUSES[number]

export const LINKED_RECORD_TYPES = ['Service Request', 'Quotation', 'Contract', 'Invoice', 'Appointment'] as const
export type LinkedRecordType = typeof LINKED_RECORD_TYPES[number]

export interface LinkedRecord {
  type: LinkedRecordType
  id: string
  reference: string
}

export interface DocumentVersion {
  id: string
  version: number
  fileName: string
  mimeType: string
  sizeBytes: number
  uploadedAt: string
  uploadedBy: string
  notes?: string
}

export interface CustomerDocument {
  id: string
  customerId: string
  title: string
  description?: string
  documentType: DocumentType
  department: Department
  visibility: Visibility
  source: DocumentSource
  status: DocumentStatus
  expiryDate?: string
  linkedRecords: LinkedRecord[]
  versions: DocumentVersion[]
  currentVersion: number
  createdAt: string
  createdBy: string
  updatedAt: string
  archivedAt?: string
  archivedBy?: string
}

export type CustomerDocumentInput = Omit<CustomerDocument, 'id' | 'status' | 'versions' | 'currentVersion' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'archivedBy'> & {
  status?: Exclude<DocumentStatus, 'Archived'>
  initialVersion: DocumentVersionInput
}

export type DocumentVersionInput = Omit<DocumentVersion, 'id' | 'version' | 'uploadedAt'>
export type CustomerDocumentMetadataInput = Pick<CustomerDocument, 'title' | 'description' | 'documentType' | 'department' | 'visibility' | 'expiryDate' | 'linkedRecords'>

export const DOCUMENT_REQUEST_STATUSES = ['Pending', 'Fulfilled', 'Cancelled'] as const
export type DocumentRequestStatus = typeof DOCUMENT_REQUEST_STATUSES[number]

interface DocumentRequestBase {
  id: string
  customerId: string
  title: string
  documentType: DocumentType
  description?: string
  requestedBy: string
  requestedAt: string
  dueDate?: string
  department: Department
}

export interface PendingDocumentRequest extends DocumentRequestBase {
  status: 'Pending'
}

export interface FulfilledDocumentRequest extends DocumentRequestBase {
  status: 'Fulfilled'
  documentId: string
  fulfilledAt: string
  fulfilledBy: string
}

export interface CancelledDocumentRequest extends DocumentRequestBase {
  status: 'Cancelled'
  cancelledAt: string
  cancelledBy: string
  cancellationReason: string
}

export type DocumentRequest = PendingDocumentRequest | FulfilledDocumentRequest | CancelledDocumentRequest
export type DocumentRequestInput = Omit<PendingDocumentRequest, 'id' | 'status' | 'requestedAt'>
export interface FulfillDocumentRequestInput { documentId: string; fulfilledBy: string }
export interface CancelDocumentRequestInput { cancelledBy: string; cancellationReason: string }

export const ACCEPTED_DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'] as const
export const MAX_DOCUMENT_FILE_SIZE_BYTES = 25 * 1024 * 1024

export type PrototypeDocumentUser = {
  name: string
  department: 'Marketing'
  role: 'Marketing Manager'
}

export const PROTOTYPE_DOCUMENT_USER: PrototypeDocumentUser = {
  name: 'Andrea Santos',
  department: 'Marketing',
  role: 'Marketing Manager',
}
