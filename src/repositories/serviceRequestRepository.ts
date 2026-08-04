import { initialServiceRequests } from '../data/serviceRequestMockData'
import type { ServiceRequest } from '../types/serviceRequest'
import { generateServiceRequestReference } from '../utils/generateServiceRequestReference'
import { customerActivityRepository } from './customerActivityRepository'
import { PROTOTYPE_ACTIVITY_ACTOR } from '../types/customerActivity'

const STORAGE_KEY = 'sedar-marketing-service-requests'

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
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
      const safeFields: (keyof ServiceRequest)[] = ['priority', 'assignedMarketingRepresentative']
      const activityChanges = safeFields.filter((field) => request[field] !== updated[field]).map((field) => ({ field: String(field), previousValue: request[field], newValue: updated[field] }))
      if (activityChanges.length) customerActivityRepository.append({ ...base, action: 'Updated', description: 'Service request updated.', changes: activityChanges })
    }
    return updated
  },
  duplicate(id: string): ServiceRequest | undefined {
    const source = this.findById(id)
    if (!source) return undefined
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
      priority: 'Normal',
      assignedMarketingRepresentative: source.assignedMarketingRepresentative,
      internalTags: [],
      status: 'Draft',
      createdAt: now,
      updatedAt: now,
    }
    this.save(duplicated)
    return duplicated
  },
  cancel(id: string, reason: string, explanation?: string): ServiceRequest | undefined {
    return this.update(id, { status: 'Cancelled', cancellationReason: reason, cancellationExplanation: explanation, cancelledAt: new Date().toISOString() })
  },
}
