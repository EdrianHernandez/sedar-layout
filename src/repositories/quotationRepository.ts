import { initialQuotations } from '../data/quotationMockData'
import type { Quotation, QuotationInput, QuotationResponse } from '../types/quotation'
import { customerActivityRepository } from './customerActivityRepository'
import { PROTOTYPE_ACTIVITY_ACTOR } from '../types/customerActivity'

const STORAGE_KEY = 'sedar-marketing-quotations'

const isQuotation = (value: unknown): value is Quotation => {
  if (!value || typeof value !== 'object') return false
  const quotation = value as Partial<Quotation>
  return typeof quotation.id === 'string' && typeof quotation.quotationNumber === 'string' && typeof quotation.customerId === 'string' && typeof quotation.serviceRequestId === 'string' && Array.isArray(quotation.lineItemSummaries) && quotation.lineItemSummaries.every((item) => typeof item === 'string')
}

const uuid = (): string => globalThis.crypto?.randomUUID?.() ?? `QUO-${Date.now()}-${Math.random().toString(36).slice(2)}`
const storageAvailable = (): boolean => typeof localStorage !== 'undefined'

const persist = (quotations: Quotation[]): void => {
  if (!storageAvailable()) return
  // Prototype browser storage only. Replace this repository with the production backend integration.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotations))
}

export const quotationRepository = {
  getAll(): Quotation[] {
    if (!storageAvailable()) return [...initialQuotations]
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return [...initialQuotations]
      const parsed: unknown = JSON.parse(stored)
      if (!Array.isArray(parsed) || !parsed.every(isQuotation)) return [...initialQuotations]
      const storedIds = new Set(parsed.map((quotation) => quotation.id))
      return [...parsed, ...initialQuotations.filter((quotation) => !storedIds.has(quotation.id))]
    } catch {
      return [...initialQuotations]
    }
  },

  getById(id: string): Quotation | undefined {
    return this.getAll().find((quotation) => quotation.id === id)
  },

  getByCustomerId(customerId: string): Quotation[] {
    return this.getAll().filter((quotation) => quotation.customerId === customerId)
  },

  getByServiceRequestId(serviceRequestId: string): Quotation[] {
    return this.getAll().filter((quotation) => quotation.serviceRequestId === serviceRequestId)
  },

  create(input: QuotationInput): Quotation {
    const now = new Date().toISOString()
    const id = uuid()
    const quotation: Quotation = { ...input, id, revisionNumber: 0, originalQuotationId: id, status: input.status ?? 'Draft', createdAt: now, updatedAt: now }
    persist([quotation, ...this.getAll()])
    customerActivityRepository.appendOnce({ customerId: quotation.customerId, module: 'Quotations', action: quotation.revisionNumber > 0 ? 'Updated' : 'Created', description: quotation.revisionNumber > 0 ? 'Quotation revision created.' : 'Quotation created.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Quotation', id: quotation.id, referenceNumber: quotation.quotationNumber }, visibility: 'Internal', metadata: { revisionNumber: quotation.revisionNumber }, sourceEventKey: `quotation:${quotation.id}:created`, systemGenerated: true, eventSource: 'quotationRepository' })
    return quotation
  },

  update(id: string, changes: Partial<Quotation>): Quotation | undefined {
    const quotations = this.getAll()
    const index = quotations.findIndex((quotation) => quotation.id === id)
    if (index < 0) return undefined
    const current = quotations[index]
    const updated: Quotation = { ...current, ...changes, id: current.id, originalQuotationId: current.originalQuotationId, createdAt: current.createdAt, updatedAt: new Date().toISOString() }
    quotations[index] = updated
    persist(quotations)
    const base = { customerId: updated.customerId, module: 'Quotations' as const, actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Quotation', id: updated.id, referenceNumber: updated.quotationNumber }, visibility: 'Internal' as const, systemGenerated: true, eventSource: 'quotationRepository' }
    if (current.status !== updated.status) {
      const action = updated.status === 'For Internal Approval' ? 'Submitted' : updated.status === 'Customer Approved' ? 'Approved' : updated.status === 'Rejected' ? 'Rejected' : 'Status Changed'
      customerActivityRepository.appendOnce({ ...base, action, description: `Quotation status changed to ${updated.status}.`, changes: [{ field: 'status', previousValue: current.status, newValue: updated.status }], sourceEventKey: `quotation:${id}:status:${updated.status}:${updated.updatedAt}` })
    } else if (changes.response && current.response !== updated.response) customerActivityRepository.appendOnce({ ...base, action: 'Updated', description: 'Customer response to quotation recorded.', sourceEventKey: `quotation:${id}:response:${updated.respondedAt ?? updated.updatedAt}` })
    return updated
  },

  submitForInternalApproval(id: string): Quotation | undefined {
    const now = new Date().toISOString()
    return this.update(id, { status: 'For Internal Approval', submittedForInternalApprovalAt: now })
  },

  markAsSent(id: string, contactId?: string): Quotation | undefined {
    const quotation = this.getById(id)
    if (!quotation) return undefined
    const now = new Date()
    const validUntil = new Date(now)
    validUntil.setUTCDate(validUntil.getUTCDate() + quotation.validityDays)
    return this.update(id, { status: 'Sent', contactId: contactId ?? quotation.contactId, issuedAt: now.toISOString(), sentAt: now.toISOString(), validUntil: validUntil.toISOString() })
  },

  recordCustomerResponse(id: string, response: QuotationResponse): Quotation | undefined {
    if (!this.getById(id)) return undefined
    if (response.type === 'Requested Revision') {
      this.update(id, { response, respondedAt: new Date().toISOString() })
      return this.createRevision(id, response.internalNotes ?? response.customerNotes)
    }
    return this.update(id, { status: response.type, response, respondedAt: new Date().toISOString() })
  },

  createRevision(id: string, reason?: string): Quotation | undefined {
    const source = this.getById(id)
    if (!source) return undefined
    const quotations = this.getAll()
    const familyId = source.originalQuotationId
    const revisionNumber = Math.max(...quotations.filter((quotation) => quotation.originalQuotationId === familyId).map((quotation) => quotation.revisionNumber), 0) + 1
    const now = new Date().toISOString()
    const revisionId = uuid()
    const baseNumber = source.quotationNumber.replace(/-R\d+$/, '')
    const revision: Quotation = {
      ...source,
      id: revisionId,
      quotationNumber: baseNumber,
      revisionNumber,
      originalQuotationId: familyId,
      supersedesQuotationId: source.id,
      supersededByQuotationId: undefined,
      status: 'Draft',
      response: undefined,
      revisionReason: reason,
      submittedForInternalApprovalAt: undefined,
      sentAt: undefined,
      viewedAt: undefined,
      respondedAt: undefined,
      validUntil: undefined,
      createdAt: now,
      updatedAt: now,
    }
    const sourceIndex = quotations.findIndex((quotation) => quotation.id === source.id)
    quotations[sourceIndex] = { ...source, status: 'Superseded', supersededByQuotationId: revisionId, updatedAt: now }
    persist([revision, ...quotations])
    customerActivityRepository.appendOnce({ customerId: revision.customerId, module: 'Quotations', action: 'Updated', description: 'Quotation revision created.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Quotation', id: revision.id, referenceNumber: revision.quotationNumber }, visibility: 'Internal', metadata: { revisionNumber }, sourceEventKey: `quotation:${revision.id}:revision-created`, systemGenerated: true, eventSource: 'quotationRepository' })
    return revision
  },
}

export { STORAGE_KEY as QUOTATION_STORAGE_KEY }
