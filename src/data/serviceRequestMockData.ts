import type { ServiceRequest } from '../types/serviceRequest'

// Fictional prototype request metadata. This does not represent real SEDAR operations.
export const initialServiceRequests: ServiceRequest[] = [{
  id: 'REQ-PROTOTYPE-018', referenceNumber: 'SR-2026-018', customerId: 'CUS-001', contactId: 'CUS-001-PRIMARY', requestSource: 'Customer Inquiry',
  vessel: { name: 'MV Southern Star', type: 'Cargo Ship' },
  service: { type: 'Harbor Towage', tugboatsRequired: 2, description: 'Harbor towage request for safe berthing assistance.' },
  schedule: { requestedDate: '2026-08-12', requestedTime: '10:00', portOrOperatingArea: 'Batangas Port', flexibility: 'Flexible by 1 Hour' },
  operations: {}, priority: 'Normal', assignedMarketingRepresentative: 'Andrea Santos', internalTags: ['prototype'], status: 'Under Review', createdAt: '2026-08-03T09:20:00.000Z', updatedAt: '2026-08-03T09:20:00.000Z',
}]
