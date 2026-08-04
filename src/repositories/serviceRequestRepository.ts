import { initialServiceRequests } from '../data/serviceRequestMockData'
import type { ServiceRequest } from '../types/serviceRequest'

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
      return Array.isArray(parsed) && parsed.every(isServiceRequest) ? parsed : [...initialServiceRequests]
    } catch {
      return [...initialServiceRequests]
    }
  },
  findById(id: string): ServiceRequest | undefined {
    return this.getAll().find((request) => request.id === id)
  },
  save(request: ServiceRequest): void {
    const requests = this.getAll()
    const index = requests.findIndex((item) => item.id === request.id)
    if (index >= 0) requests[index] = request
    else requests.unshift(request)
    // Prototype metadata storage only. Replace this repository with the real decentralized backend.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
  },
}
