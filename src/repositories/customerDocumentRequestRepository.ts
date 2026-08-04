import { initialCustomerDocumentRequests } from '../data/customerDocumentMockData'
import { DEPARTMENTS, DOCUMENT_REQUEST_STATUSES, DOCUMENT_TYPES, type CancelDocumentRequestInput, type DocumentRequest, type DocumentRequestInput, type FulfillDocumentRequestInput } from '../types/customerDocument'

const STORAGE_KEY = 'sedar-marketing-customer-document-requests'
const id = (): string => globalThis.crypto?.randomUUID?.() ?? `DOC-REQ-${Date.now()}-${Math.random().toString(36).slice(2)}`
const isRequest = (value: unknown): value is DocumentRequest => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<DocumentRequest>
  return typeof item.id === 'string' && typeof item.customerId === 'string' && typeof item.title === 'string' && DOCUMENT_TYPES.includes(item.documentType as DocumentRequest['documentType']) && DEPARTMENTS.includes(item.department as DocumentRequest['department']) && typeof item.requestedBy === 'string' && typeof item.requestedAt === 'string' && DOCUMENT_REQUEST_STATUSES.includes(item.status as DocumentRequest['status'])
}
const load = (): DocumentRequest[] => {
  if (typeof localStorage === 'undefined') return [...initialCustomerDocumentRequests]
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed) || !parsed.every(isRequest)) return [...initialCustomerDocumentRequests]
    const ids = new Set(parsed.map((item) => item.id))
    return [...parsed, ...initialCustomerDocumentRequests.filter((item) => !ids.has(item.id))]
  } catch { return [...initialCustomerDocumentRequests] }
}
const persist = (requests: DocumentRequest[]): void => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

export const customerDocumentRequestRepository = {
  getAll(): DocumentRequest[] { return load() },
  getByCustomerId(customerId: string): DocumentRequest[] { return load().filter((request) => request.customerId === customerId) },
  getById(customerId: string, requestId: string): DocumentRequest | undefined { return this.getByCustomerId(customerId).find((request) => request.id === requestId) },
  create(input: DocumentRequestInput): DocumentRequest {
    const request: DocumentRequest = { ...input, id: id(), status: 'Pending', requestedAt: new Date().toISOString() }
    persist([request, ...load()])
    return request
  },
  fulfill(customerId: string, requestId: string, input: FulfillDocumentRequestInput): DocumentRequest | undefined {
    const requests = load()
    const index = requests.findIndex((item) => item.customerId === customerId && item.id === requestId)
    if (index < 0 || requests[index].status !== 'Pending') return undefined
    const current = requests[index]
    const fulfilled: DocumentRequest = { ...current, status: 'Fulfilled', documentId: input.documentId, fulfilledAt: new Date().toISOString(), fulfilledBy: input.fulfilledBy }
    requests[index] = fulfilled
    persist(requests)
    return fulfilled
  },
  cancel(customerId: string, requestId: string, input: CancelDocumentRequestInput): DocumentRequest | undefined {
    const requests = load()
    const index = requests.findIndex((item) => item.customerId === customerId && item.id === requestId)
    if (index < 0 || requests[index].status !== 'Pending' || !input.cancellationReason.trim()) return undefined
    const current = requests[index]
    const cancelled: DocumentRequest = { ...current, status: 'Cancelled', cancelledAt: new Date().toISOString(), cancelledBy: input.cancelledBy, cancellationReason: input.cancellationReason.trim() }
    requests[index] = cancelled
    persist(requests)
    return cancelled
  },
  delete(customerId: string, requestId: string): boolean {
    const requests = load()
    if (!requests.some((item) => item.customerId === customerId && item.id === requestId)) return false
    persist(requests.filter((item) => item.id !== requestId))
    return true
  },
}

export { STORAGE_KEY as CUSTOMER_DOCUMENT_REQUEST_STORAGE_KEY }
