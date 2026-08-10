import { initialServiceRequests } from '../data/serviceRequestMockData'
import type { OperationsReview, ServiceRequest } from '../types/serviceRequest'
import { generateServiceRequestReference } from '../utils/generateServiceRequestReference'
import { customerActivityRepository } from './customerActivityRepository'
import { PROTOTYPE_ACTIVITY_ACTOR } from '../types/customerActivity'

const STORAGE_KEY = 'sedar-marketing-service-requests'
const actorName = PROTOTYPE_ACTIVITY_ACTOR.name
const defaultReview = (): OperationsReview => ({ status: 'Not Submitted' })
const persist = (requests: ServiceRequest[]) => { if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(requests)) }
const audit = (request: ServiceRequest, action: 'Assigned' | 'Submitted' | 'Updated' | 'Cancelled', description: string, key: string, changes?: { field: string; previousValue?: unknown; newValue?: unknown }[]) => customerActivityRepository.appendOnce({ customerId: request.customerId, module: 'Service Requests', action, description, actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Service Request', id: request.id, referenceNumber: request.referenceNumber }, visibility: 'Internal', changes, sourceEventKey: key, systemGenerated: true, eventSource: 'serviceRequestRepository' })

const isServiceRequest = (value: unknown): value is ServiceRequest => {
  if (!value || typeof value !== 'object') return false
  const request = value as Partial<ServiceRequest>
  return typeof request.id === 'string' && typeof request.referenceNumber === 'string' && typeof request.customerId === 'string' && typeof request.status === 'string'
}

export const serviceRequestRepository = {
  getAll(): ServiceRequest[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return [...initialServiceRequests]
      const parsed: unknown = JSON.parse(stored)
      if (!Array.isArray(parsed) || !parsed.every(isServiceRequest)) return [...initialServiceRequests]
      const storedIds = new Set(parsed.map((request) => request.id))
      return [...parsed, ...initialServiceRequests.filter((request) => !storedIds.has(request.id))]
    } catch {
      return [...initialServiceRequests]
    }
  },
  findById(id: string): ServiceRequest | undefined {
    return this.getAll().find((request) => request.id === id)
  },
  getByCustomerId(customerId: string): ServiceRequest[] {
    return this.getAll().filter((request) => request.customerId === customerId)
  },
  save(request: ServiceRequest): void {
    const requests = this.getAll()
    const index = requests.findIndex((item) => item.id === request.id)
    const current = index >= 0 ? requests[index] : undefined
    if (index >= 0) requests[index] = request
    else requests.unshift(request)
    // Prototype metadata storage only. Replace this repository with the real decentralized backend.
    persist(requests)
    if (!current) customerActivityRepository.appendOnce({ customerId: request.customerId, module: 'Service Requests', action: 'Created', description: 'Service request created.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Service Request', id: request.id, referenceNumber: request.referenceNumber }, visibility: 'Internal', sourceEventKey: `service-request:${request.id}:created`, systemGenerated: true, eventSource: 'serviceRequestRepository' })
  },
  update(id: string, changes: Partial<ServiceRequest>): ServiceRequest | undefined {
    const request = this.findById(id)
    if (!request) return undefined
    const updated = { ...request, ...changes, id: request.id, updatedAt: new Date().toISOString() }
    this.save(updated)
    const base = { customerId: updated.customerId, module: 'Service Requests' as const, actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Service Request', id: updated.id, referenceNumber: updated.referenceNumber }, visibility: 'Internal' as const, systemGenerated: true, eventSource: 'serviceRequestRepository' }
    if (request.status !== updated.status) customerActivityRepository.appendOnce({ ...base, action: updated.status === 'Cancelled' ? 'Cancelled' : 'Status Changed', description: updated.status === 'Cancelled' ? 'Service request cancelled.' : `Service request status changed to ${updated.status}.`, changes: [{ field: 'status', previousValue: request.status, newValue: updated.status }], sourceEventKey: `service-request:${id}:status:${updated.status}:${updated.updatedAt}` })
    else {
      const safeFields: (keyof ServiceRequest)[] = ['priority']
      const activityChanges = safeFields.filter((field) => request[field] !== updated[field]).map((field) => ({ field: String(field), previousValue: request[field], newValue: updated[field] }))
      if (activityChanges.length) customerActivityRepository.append({ ...base, action: 'Updated', description: 'Service request updated.', changes: activityChanges })
    }
    return updated
  },
  duplicate(id: string): ServiceRequest | undefined {
    const source = this.findById(id)
    if (!source || source.status === 'Completed') return undefined
    const now = new Date().toISOString()
    const requests = this.getAll()
    const duplicated: ServiceRequest = {
      id: globalThis.crypto?.randomUUID?.() ?? `REQ-${Date.now()}`,
      referenceNumber: generateServiceRequestReference(requests),
      customerId: source.customerId,
      contactId: source.contactId,
      requestSource: source.requestSource,
      vessel: { ...source.vessel },
      service: { ...source.service },
      schedule: { ...source.schedule, requestedDate: '', requestedTime: '', estimatedCompletionDate: undefined, estimatedCompletionTime: undefined },
      operations: {},
      priority: source.priority,
      assignedMarketingRepresentative: source.assignedMarketingRepresentative,
      internalTags: [],
      status: 'Draft',
      operationsReview: defaultReview(),
      createdAt: now,
      updatedAt: now,
    }
    this.save(duplicated)
    audit(duplicated, 'Updated', 'Service request duplicated as draft.', `service-request:${duplicated.id}:duplicated`)
    return duplicated
  },
  assignRepresentative(id: string, representative: string, notes?: string): ServiceRequest | undefined {
    const current = this.findById(id)
    if (!current || ['Completed', 'Cancelled'].includes(current.status)) return undefined
    const updated = this.update(id, { assignedMarketingRepresentative: representative, internalNotes: notes ? [current.internalNotes, notes].filter(Boolean).join('\n') : current.internalNotes })
    if (updated) audit(updated, 'Assigned', 'Marketing representative updated.', `service-request:${id}:assigned:${updated.updatedAt}`, [{ field: 'assignedMarketingRepresentative', previousValue: current.assignedMarketingRepresentative || 'Unassigned', newValue: representative || 'Unassigned' }])
    return updated
  },
  submitToOperations(id: string, actor = actorName): ServiceRequest | undefined {
    const current = this.findById(id)
    if (!current || current.status !== 'Under Review' || (current.operationsReview?.status ?? 'Not Submitted') !== 'Not Submitted') return undefined
    const now = new Date().toISOString()
    const updated = this.update(id, { status: 'Awaiting Operations', operationsReview: { status: 'Awaiting Review', submittedAt: now, submittedBy: actor } })
    if (updated) audit(updated, 'Submitted', 'Service Request submitted to Tug Operations.', `service-request:${id}:operations-submitted:${now}`)
    return updated
  },
  respondToInformationRequest(id: string, response: { customerResponse: string; additionalDetails?: string; internalNote?: string }, actor = actorName): ServiceRequest | undefined {
    const current = this.findById(id)
    if (!current || current.operationsReview?.status !== 'More Information Required') return undefined
    const now = new Date().toISOString()
    const updated = this.update(id, { waitingForCustomerInformation: false, status: 'Awaiting Operations', operationsReview: { ...current.operationsReview, status: 'Awaiting Review', marketingResponse: response.customerResponse, marketingResponseDetails: response.additionalDetails, marketingResponseNote: response.internalNote, respondedAt: now, respondedBy: actor } })
    if (updated) audit(updated, 'Submitted', 'Additional information submitted to Tug Operations.', `service-request:${id}:information-response:${now}`)
    return updated
  },
  cancel(id: string, reason: string, explanation?: string, actor = actorName): ServiceRequest | undefined {
    const current = this.findById(id)
    if (!current || ['Completed', 'Cancelled'].includes(current.status)) return undefined
    const now = new Date().toISOString()
    const updated = this.update(id, { status: 'Cancelled', cancellationReason: reason, cancellationExplanation: explanation, cancelledAt: now, cancelledBy: actor })
    return updated
  },
  addInternalNote(id: string, note: string, actor = actorName): ServiceRequest | undefined {
    const current = this.findById(id)
    if (!current || !note.trim()) return undefined
    const now = new Date().toISOString()
    const updated = this.update(id, { internalNotes: [current.internalNotes, note.trim()].filter(Boolean).join('\n') })
    if (updated) customerActivityRepository.appendOnce({ customerId: updated.customerId, module: 'Service Requests', action: 'Note Added', description: 'Internal note added to service request.', actor: { ...PROTOTYPE_ACTIVITY_ACTOR, name: actor }, relatedRecord: { type: 'Service Request', id: updated.id, referenceNumber: updated.referenceNumber }, visibility: 'Internal', internalNote: note.trim(), sourceEventKey: `service-request:${id}:note:${now}`, systemGenerated: false, eventSource: 'serviceRequestRepository' })
    return updated
  },
}

export { STORAGE_KEY as SERVICE_REQUEST_STORAGE_KEY }
