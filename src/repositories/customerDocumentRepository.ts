import { initialCustomerDocuments } from '../data/customerDocumentMockData'
import { DEPARTMENTS, DOCUMENT_SOURCES, DOCUMENT_STATUSES, DOCUMENT_TYPES, DOCUMENT_VISIBILITIES, type CustomerDocument, type CustomerDocumentInput, type CustomerDocumentMetadataInput, type DocumentVersion, type DocumentVersionInput, type Visibility } from '../types/customerDocument'
import { isDocumentExpired } from '../utils/customerDocumentExpiration'
import { validateDocumentFileMetadata } from '../utils/customerDocumentFileValidation'
import { customerActivityRepository } from './customerActivityRepository'
import { PROTOTYPE_ACTIVITY_ACTOR } from '../types/customerActivity'

const STORAGE_KEY = 'sedar-marketing-customer-documents'
const id = (prefix: string): string => globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
const included = <T extends readonly string[]>(values: T, value: unknown): value is T[number] => typeof value === 'string' && values.includes(value as T[number])

const isVersion = (value: unknown): value is DocumentVersion => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<DocumentVersion>
  return typeof item.id === 'string' && typeof item.version === 'number' && Number.isInteger(item.version) && item.version > 0 && typeof item.fileName === 'string' && typeof item.mimeType === 'string' && typeof item.sizeBytes === 'number' && Number.isFinite(item.sizeBytes) && typeof item.uploadedAt === 'string' && typeof item.uploadedBy === 'string'
}

const isDocument = (value: unknown): value is CustomerDocument => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<CustomerDocument>
  return typeof item.id === 'string' && typeof item.customerId === 'string' && typeof item.title === 'string' && included(DOCUMENT_TYPES, item.documentType) && included(DEPARTMENTS, item.department) && included(DOCUMENT_VISIBILITIES, item.visibility) && included(DOCUMENT_SOURCES, item.source) && included(DOCUMENT_STATUSES, item.status) && Array.isArray(item.linkedRecords) && Array.isArray(item.versions) && item.versions.length > 0 && item.versions.every(isVersion) && typeof item.currentVersion === 'number' && item.versions.some((version) => version.version === item.currentVersion) && typeof item.createdAt === 'string' && typeof item.createdBy === 'string' && typeof item.updatedAt === 'string'
}

const load = (): CustomerDocument[] => {
  if (typeof localStorage === 'undefined') return [...initialCustomerDocuments]
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed) || !parsed.every(isDocument)) return [...initialCustomerDocuments]
    const storedIds = new Set(parsed.map((item) => item.id))
    return [...parsed, ...initialCustomerDocuments.filter((item) => !storedIds.has(item.id))]
  } catch {
    return [...initialCustomerDocuments]
  }
}

const persist = (documents: CustomerDocument[]): void => {
  // Metadata only: file contents, blobs, base64 data, and object URLs are never accepted or stored.
  if (typeof localStorage === 'undefined') return
  const metadataOnly = documents.map((document) => ({
    id: document.id, customerId: document.customerId, title: document.title, description: document.description,
    documentType: document.documentType, department: document.department, visibility: document.visibility,
    source: document.source, status: document.status, expiryDate: document.expiryDate,
    linkedRecords: document.linkedRecords.map(({ type, id: recordId, reference }) => ({ type, id: recordId, reference })),
    versions: document.versions.map(({ id: versionId, version, fileName, mimeType, sizeBytes, uploadedAt, uploadedBy, notes }) => ({ id: versionId, version, fileName, mimeType, sizeBytes, uploadedAt, uploadedBy, notes })),
    currentVersion: document.currentVersion, createdAt: document.createdAt, createdBy: document.createdBy,
    updatedAt: document.updatedAt, archivedAt: document.archivedAt, archivedBy: document.archivedBy,
  }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(metadataOnly))
}

const versionFrom = (input: DocumentVersionInput, version: number, now: string): DocumentVersion => {
  const validation = validateDocumentFileMetadata({ name: input.fileName, size: input.sizeBytes, type: input.mimeType })
  if (!validation.valid) throw new Error(validation.errors.join(' '))
  return { id: id('DOC-VERSION'), version, fileName: input.fileName, mimeType: input.mimeType, sizeBytes: input.sizeBytes, uploadedAt: now, uploadedBy: input.uploadedBy, notes: input.notes }
}

const effectiveStatus = (document: CustomerDocument): CustomerDocument => document.status === 'Active' && isDocumentExpired(document.expiryDate) ? { ...document, status: 'Expired' } : document

export const customerDocumentRepository = {
  getAll(): CustomerDocument[] { return load().map(effectiveStatus) },
  getByCustomerId(customerId: string): CustomerDocument[] { return this.getAll().filter((document) => document.customerId === customerId) },
  getById(customerId: string, documentId: string): CustomerDocument | undefined { return this.getByCustomerId(customerId).find((document) => document.id === documentId) },
  create(input: CustomerDocumentInput): CustomerDocument {
    const now = new Date().toISOString()
    const firstVersion = versionFrom(input.initialVersion, 1, now)
    const document: CustomerDocument = { id: id('DOC'), customerId: input.customerId, title: input.title, description: input.description, documentType: input.documentType, department: input.department, visibility: input.visibility, source: input.source, status: input.status ?? (isDocumentExpired(input.expiryDate) ? 'Expired' : 'Active'), expiryDate: input.expiryDate, linkedRecords: input.linkedRecords, versions: [firstVersion], currentVersion: 1, createdAt: now, createdBy: input.createdBy, updatedAt: now }
    persist([document, ...load()])
    customerActivityRepository.appendOnce({ customerId: document.customerId, module: 'Documents', action: 'Uploaded', description: 'Customer document created.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Document', id: document.id, referenceNumber: document.id }, visibility: 'Internal', metadata: { documentType: document.documentType, version: document.currentVersion }, sourceEventKey: `document:${document.id}:created`, systemGenerated: true, eventSource: 'customerDocumentRepository' })
    return document
  },
  updateMetadata(customerId: string, documentId: string, changes: Partial<CustomerDocumentMetadataInput>): CustomerDocument | undefined {
    const documents = load()
    const index = documents.findIndex((item) => item.customerId === customerId && item.id === documentId)
    if (index < 0) return undefined
    const current = documents[index]
    const updated: CustomerDocument = { ...current, ...changes, id: current.id, customerId: current.customerId, source: current.source, versions: current.versions, currentVersion: current.currentVersion, createdAt: current.createdAt, updatedAt: new Date().toISOString() }
    documents[index] = updated
    persist(documents)
    const safeFields: (keyof CustomerDocumentMetadataInput)[] = ['title', 'documentType', 'department', 'visibility', 'expiryDate']
    const activityChanges = safeFields.filter((field) => current[field] !== updated[field]).map((field) => ({ field: String(field), previousValue: current[field], newValue: updated[field] }))
    if (activityChanges.length) customerActivityRepository.append({ customerId, module: 'Documents', action: 'Updated', description: 'Document metadata updated.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Document', id: documentId, referenceNumber: documentId }, visibility: 'Internal', changes: activityChanges, systemGenerated: true, eventSource: 'customerDocumentRepository' })
    return effectiveStatus(updated)
  },
  addVersion(customerId: string, documentId: string, input: DocumentVersionInput): CustomerDocument | undefined {
    const documents = load()
    const index = documents.findIndex((item) => item.customerId === customerId && item.id === documentId)
    if (index < 0 || documents[index].status === 'Archived') return undefined
    const current = documents[index]
    const nextNumber = Math.max(current.currentVersion, ...current.versions.map((version) => version.version)) + 1
    const now = new Date().toISOString()
    const updated: CustomerDocument = { ...current, versions: [...current.versions, versionFrom(input, nextNumber, now)], currentVersion: nextNumber, updatedAt: now }
    documents[index] = updated
    persist(documents)
    customerActivityRepository.appendOnce({ customerId, module: 'Documents', action: 'Uploaded', description: 'New document version uploaded.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Document', id: documentId, referenceNumber: documentId }, visibility: 'Internal', metadata: { version: nextNumber }, sourceEventKey: `document:${documentId}:version:${nextNumber}`, systemGenerated: true, eventSource: 'customerDocumentRepository' })
    return updated
  },
  updateVisibility(customerId: string, documentId: string, visibility: Visibility): CustomerDocument | undefined {
    return this.updateMetadata(customerId, documentId, { visibility })
  },
  archive(customerId: string, documentId: string, archivedBy: string): CustomerDocument | undefined {
    const documents = load()
    const index = documents.findIndex((item) => item.customerId === customerId && item.id === documentId)
    if (index < 0 || documents[index].status === 'Archived') return undefined
    const now = new Date().toISOString()
    const updated: CustomerDocument = { ...documents[index], status: 'Archived', archivedAt: now, archivedBy, updatedAt: now }
    documents[index] = updated
    persist(documents)
    customerActivityRepository.appendOnce({ customerId, module: 'Documents', action: 'Archived', description: 'Customer document archived.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Document', id: documentId, referenceNumber: documentId }, visibility: 'Internal', sourceEventKey: `document:${documentId}:archived`, systemGenerated: true, eventSource: 'customerDocumentRepository' })
    return updated
  },
  delete(customerId: string, documentId: string): boolean {
    const documents = load()
    const target = documents.find((item) => item.customerId === customerId && item.id === documentId)
    if (!target || target.status !== 'Archived') return false
    persist(documents.filter((item) => item.id !== documentId))
    return true
  },
}

export { STORAGE_KEY as CUSTOMER_DOCUMENT_STORAGE_KEY }
