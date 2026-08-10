import { initialQuotations } from '../data/quotationMockData'
import type { Quotation, QuotationInput, QuotationResponse } from '../types/quotation'
import { customerActivityRepository } from './customerActivityRepository'
import { PROTOTYPE_ACTIVITY_ACTOR } from '../types/customerActivity'
import { serviceRequestRepository } from './serviceRequestRepository'
import { getInternalApprovalStatus, getQuotationDisplayStatus, isQuotationEligibleRequest } from '../utils/quotationWorkflow'
import { contractRequestRepository } from './contractRequestRepository'
import type { ContractRequest } from '../types/contractRequest'

const STORAGE_KEY = 'sedar-marketing-quotations'

const isQuotation = (value: unknown): value is Quotation => {
  if (!value || typeof value !== 'object') return false
  const quotation = value as Partial<Quotation>
  return typeof quotation.id === 'string' && typeof quotation.quotationNumber === 'string' && typeof quotation.customerId === 'string' && typeof quotation.serviceRequestId === 'string' && Array.isArray(quotation.lineItemSummaries) && quotation.lineItemSummaries.every((item) => typeof item === 'string')
}

const uuid = (): string => globalThis.crypto?.randomUUID?.() ?? `QUO-${Date.now()}-${Math.random().toString(36).slice(2)}`
const storageAvailable = (): boolean => typeof localStorage !== 'undefined'
const nextQuotationNumber = (quotations: Quotation[]): string => {
  const year = new Date().getFullYear()
  const highest = quotations.reduce((maximum, quotation) => {
    const match = quotation.quotationNumber.match(/^QT-\d{4}-(\d+)$/)
    return Math.max(maximum, match ? Number(match[1]) : 0)
  }, 0)
  return `QT-${year}-${String(highest + 1).padStart(3, '0')}`
}

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
    customerActivityRepository.appendOnce({ customerId: quotation.customerId, module: 'Quotations', action: quotation.revisionNumber > 0 ? 'Updated' : 'Created', description: quotation.revisionNumber > 0 ? 'Quotation revision created.' : 'Quotation draft created.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Quotation', id: quotation.id, referenceNumber: quotation.quotationNumber }, visibility: 'Internal', metadata: { revisionNumber: quotation.revisionNumber, serviceRequestId: quotation.serviceRequestId }, sourceEventKey: `quotation:${quotation.id}:created`, systemGenerated: true, eventSource: 'quotationRepository' })
    return quotation
  },

  createFromServiceRequest(serviceRequestId: string): Quotation | undefined {
    const request = serviceRequestRepository.findById(serviceRequestId)
    const quotations = this.getAll()
    if (!request || !isQuotationEligibleRequest(request, quotations)) return undefined
    const now = new Date()
    const validUntil = new Date(now); validUntil.setUTCDate(validUntil.getUTCDate() + 30)
    return this.create({ quotationNumber: nextQuotationNumber(quotations), serviceRequestId: request.id, customerId: request.customerId, contactId: request.contactId, vesselName: request.vessel.name, serviceType: request.service.type, purchaseOrderReference: request.service.purchaseOrderReference, subject: `${request.service.type} for ${request.vessel.name}`, lineItemSummaries: [`${request.service.tugboatsRequired} tugboat${request.service.tugboatsRequired === 1 ? '' : 's'} · ${request.service.estimatedDuration ?? 'Duration to be finalized'}`], subtotal: 0, discountAmount: 0, vatRate: .12, vatAmount: 0, taxAmount: 0, totalAmount: 0, currency: 'PHP', validityDays: 30, validFrom: now.toISOString(), validUntil: validUntil.toISOString(), termsAndConditions: 'Rates are subject to final Finance verification and vessel availability.', preparedBy: request.assignedMarketingRepresentative || PROTOTYPE_ACTIVITY_ACTOR.name, assignedRepresentativeId: request.assignedMarketingRepresentative || undefined, internalApprovalStatus: 'Not Submitted' })
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
      const action = ['For Internal Approval', 'For Approval'].includes(updated.status) ? 'Submitted' : ['Customer Approved', 'Accepted'].includes(updated.status) ? 'Approved' : updated.status === 'Rejected' ? 'Rejected' : 'Status Changed'
      customerActivityRepository.appendOnce({ ...base, action, description: `Quotation status changed to ${updated.status}.`, changes: [{ field: 'status', previousValue: current.status, newValue: updated.status }], sourceEventKey: `quotation:${id}:status:${updated.status}:${updated.updatedAt}` })
    } else if (changes.response && current.response !== updated.response) customerActivityRepository.appendOnce({ ...base, action: 'Updated', description: 'Customer response to quotation recorded.', sourceEventKey: `quotation:${id}:response:${updated.respondedAt ?? updated.updatedAt}` })
    return updated
  },

  updateDraft(id: string, changes: Partial<Quotation>): Quotation | undefined {
    const quotation = this.getById(id)
    if (!quotation || getQuotationDisplayStatus(quotation) !== 'Draft') return undefined
    const protectedFields: (keyof Quotation)[] = ['id', 'quotationNumber', 'originalQuotationId', 'revisionNumber', 'serviceRequestId', 'customerId', 'status', 'internalApprovalStatus', 'createdAt']
    const safe = { ...changes }; protectedFields.forEach((field) => delete safe[field])
    return this.update(id, safe)
  },

  submitForInternalApproval(id: string): Quotation | undefined {
    const quotation = this.getById(id)
    if (!quotation || getQuotationDisplayStatus(quotation) !== 'Draft' || quotation.totalAmount <= 0 || !quotation.validUntil || !quotation.termsAndConditions || !quotation.lineItemSummaries.length) return undefined
    const now = new Date().toISOString()
    return this.update(id, { status: 'For Approval', internalApprovalStatus: 'Pending Finance Approval', submittedForInternalApprovalAt: now })
  },

  approve(id: string): Quotation | undefined {
    const quotation = this.getById(id)
    if (!quotation || getQuotationDisplayStatus(quotation) !== 'For Approval') return undefined
    return this.update(id, { status: 'Approved', internalApprovalStatus: 'Approved' })
  },

  markAsSent(id: string, contactId?: string): Quotation | undefined {
    const quotation = this.getById(id)
    if (!quotation || getQuotationDisplayStatus(quotation) !== 'Approved') return undefined
    const now = new Date()
    const validUntil = new Date(now)
    validUntil.setUTCDate(validUntil.getUTCDate() + quotation.validityDays)
    return this.update(id, { status: 'Sent', contactId: contactId ?? quotation.contactId, issuedAt: now.toISOString(), sentAt: now.toISOString(), validUntil: validUntil.toISOString() })
  },

  recordCustomerResponse(id: string, response: QuotationResponse): Quotation | undefined {
    const quotation = this.getById(id)
    if (!quotation || !['Sent', 'Viewed'].includes(getQuotationDisplayStatus(quotation))) return undefined
    if (response.type === 'Requested Revision') {
      return this.update(id, { status: 'Changes Requested', response, customerResponse: response.customerNotes ?? response.internalNotes, respondedAt: new Date().toISOString() })
    }
    if (response.type === 'Pending Decision') return this.update(id, { response, customerResponse: response.customerNotes, respondedAt: new Date().toISOString() })
    return this.update(id, { status: response.type === 'Customer Approved' ? 'Accepted' : 'Rejected', acceptedAt: response.type === 'Customer Approved' ? new Date().toISOString() : undefined, response, customerResponse: response.customerNotes ?? response.rejectionReason, respondedAt: new Date().toISOString() })
  },

  createRevision(id: string, reason?: string): Quotation | undefined {
    const source = this.getById(id)
    if (!source || !['Changes Requested', 'Rejected', 'Expired', 'Sent', 'Viewed'].includes(getQuotationDisplayStatus(source))) return undefined
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
      internalApprovalStatus: 'Not Submitted',
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
    customerActivityRepository.appendOnce({ customerId: source.customerId, module: 'Quotations', action: 'Status Changed', description: `Superseded by revision ${revisionNumber}.`, actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Quotation', id: source.id, referenceNumber: source.quotationNumber }, visibility: 'Internal', metadata: { revisionId, revisionNumber }, sourceEventKey: `quotation:${source.id}:superseded-by:${revisionId}`, systemGenerated: true, eventSource: 'quotationRepository' })
    return revision
  },

  extendValidity(id: string, newDate: string): Quotation | undefined {
    const quotation = this.getById(id)
    if (!quotation || getQuotationDisplayStatus(quotation) !== 'Expired' || Number.isNaN(new Date(newDate).getTime())) return undefined
    return this.update(id, { status: 'Sent', validUntil: new Date(`${newDate}T23:59:59.999Z`).toISOString() })
  },

  duplicate(id: string): Quotation | undefined {
    const source = this.getById(id)
    if (!source) return undefined
    const { id: _id, originalQuotationId: _original, revisionNumber: _revision, createdAt: _created, updatedAt: _updated, response: _response, submittedForInternalApprovalAt: _submitted, sentAt: _sent, viewedAt: _viewed, respondedAt: _responded, acceptedAt: _accepted, supersedesQuotationId: _supersedes, supersededByQuotationId: _supersededBy, ...copy } = source
    void _id; void _original; void _revision; void _created; void _updated; void _response; void _submitted; void _sent; void _viewed; void _responded; void _accepted; void _supersedes; void _supersededBy
    return this.create({ ...copy, quotationNumber: nextQuotationNumber(this.getAll()), status: 'Draft', internalApprovalStatus: 'Not Submitted', issuedAt: undefined, validUntil: undefined })
  },

  withdrawApprovalRequest(id: string): Quotation | undefined {
    const quotation = this.getById(id)
    if (!quotation || getQuotationDisplayStatus(quotation) !== 'For Approval') return undefined
    return this.update(id, { status: 'Draft', internalApprovalStatus: 'Not Submitted', submittedForInternalApprovalAt: undefined })
  },

  deleteDraft(id: string): boolean {
    const quotation = this.getById(id)
    if (!quotation || getQuotationDisplayStatus(quotation) !== 'Draft') return false
    persist(this.getAll().filter((item) => item.id !== id))
    return true
  },

  requestContractPreparation(id: string): ContractRequest | undefined {
    const quotation = this.getById(id)
    if (!quotation || getQuotationDisplayStatus(quotation) !== 'Accepted' || getInternalApprovalStatus(quotation) !== 'Approved') return undefined
    const request = contractRequestRepository.create({ quotationId: quotation.id, serviceRequestId: quotation.serviceRequestId, customerId: quotation.customerId, requestedBy: PROTOTYPE_ACTIVITY_ACTOR.name })
    customerActivityRepository.appendOnce({ customerId: quotation.customerId, module: 'Contract Requests', action: 'Created', description: 'Contract preparation requested from an accepted quotation.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Quotation', id: quotation.id, referenceNumber: quotation.quotationNumber }, visibility: 'Internal', metadata: { serviceRequestId: quotation.serviceRequestId, contractRequestId: request.id, contractRequestReference: request.referenceNumber }, sourceEventKey: `quotation:${quotation.id}:contract-preparation-requested`, systemGenerated: true, eventSource: 'quotationRepository' })
    return request
  },
}

export { STORAGE_KEY as QUOTATION_STORAGE_KEY }
