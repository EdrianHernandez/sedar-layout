import type { ServiceRequest } from '../types/serviceRequest'

// Fictional prototype request metadata. This does not represent real SEDAR operations.
export const initialServiceRequests: ServiceRequest[] = [
  {
    id: 'REQ-PROTOTYPE-018', referenceNumber: 'SR-2026-018', customerId: 'CUS-001', contactId: 'CUS-001-PRIMARY', requestSource: 'Customer Inquiry',
    vessel: { name: 'MV Southern Star', type: 'Cargo Ship' }, service: { type: 'Harbor Towage', tugboatsRequired: 2, description: 'Harbor towage request for safe berthing assistance.' },
    schedule: { requestedDate: '2026-08-12', requestedTime: '10:00', portOrOperatingArea: 'Batangas Port', flexibility: 'Flexible by 1 Hour' }, operations: {}, priority: 'Normal', assignedMarketingRepresentative: 'Andrea Santos', internalTags: ['prototype'], status: 'Under Review', createdAt: '2026-08-03T09:20:00.000Z', updatedAt: '2026-08-03T09:20:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-017', referenceNumber: 'SR-2026-017', customerId: 'CUS-001', contactId: 'CUS-001-PRIMARY', requestSource: 'Email',
    vessel: { name: 'MV Pacific Trader', type: 'Container Ship' }, service: { type: 'Docking Assistance', tugboatsRequired: 2, preferredTugClass: 'ASD Tug', description: 'Docking support for port arrival.' },
    schedule: { requestedDate: '', requestedTime: '', portOrOperatingArea: 'Manila South Harbor', flexibility: 'To Be Confirmed' }, operations: {}, priority: 'Normal', assignedMarketingRepresentative: 'Miguel Reyes', internalTags: ['prototype'], status: 'Draft', createdAt: '2026-08-02T08:10:00.000Z', updatedAt: '2026-08-02T08:10:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-016', referenceNumber: 'SR-2026-016', customerId: 'CUS-001', contactId: 'CUS-001-PRIMARY', requestSource: 'Phone Call',
    vessel: { name: 'MT Isla Verde', type: 'Tanker' }, service: { type: 'Tug Escort', tugboatsRequired: 2, description: 'Escort assistance through the harbor channel.' },
    schedule: { requestedDate: '2026-08-10', requestedTime: '06:30', portOrOperatingArea: 'Subic Bay', berthOrTerminal: 'Oil Terminal 2', flexibility: 'Fixed Schedule' }, operations: {}, priority: 'High', assignedMarketingRepresentative: 'Andrea Santos', requestedOperationsReviewer: 'Ramon Cruz', internalTags: ['prototype'], status: 'Awaiting Operations', createdAt: '2026-08-01T11:15:00.000Z', updatedAt: '2026-08-04T02:30:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-015', referenceNumber: 'SR-2026-015', customerId: 'CUS-001', contactId: 'CUS-001-PRIMARY', requestSource: 'Existing Contract',
    vessel: { name: 'MV Harbor Queen', type: 'Passenger Vessel' }, service: { type: 'Undocking Assistance', tugboatsRequired: 1, contractReference: 'CTR-2026-004', description: 'Undocking support before scheduled departure.' },
    schedule: { requestedDate: '2026-08-09', requestedTime: '15:00', portOrOperatingArea: 'Pier 15, Manila', berthOrTerminal: 'Berth 3', flexibility: 'Flexible by 1 Hour' }, operations: {}, priority: 'Normal', assignedMarketingRepresentative: 'Miguel Reyes', internalTags: ['prototype'], status: 'Quotation Prepared', createdAt: '2026-07-31T07:40:00.000Z', updatedAt: '2026-08-03T06:20:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-014', referenceNumber: 'SR-2026-014', customerId: 'CUS-001', contactId: 'CUS-001-PRIMARY', requestSource: 'Customer Inquiry',
    vessel: { name: 'MV Eastern Horizon', type: 'Bulk Carrier' }, service: { type: 'Barge Towing', tugboatsRequired: 2, description: 'Tow a loaded barge to the receiving terminal.' },
    schedule: { requestedDate: '2026-08-14', requestedTime: '08:00', portOrOperatingArea: 'Cavite Anchorage', origin: 'Cavite', destination: 'Batangas', flexibility: 'Flexible Within the Day' }, operations: {}, priority: 'High', assignedMarketingRepresentative: 'Andrea Santos', internalTags: ['prototype'], status: 'Awaiting Customer Approval', createdAt: '2026-07-29T04:50:00.000Z', updatedAt: '2026-08-02T09:10:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-013', referenceNumber: 'SR-2026-013', customerId: 'CUS-001', contactId: 'CUS-001-PRIMARY', requestSource: 'Email',
    vessel: { name: 'MV Cebu Pioneer', type: 'Cargo Ship' }, service: { type: 'Inter-island Towage', tugboatsRequired: 2, description: 'Approved inter-island towage operation.' },
    schedule: { requestedDate: '2026-08-15', requestedTime: '05:30', portOrOperatingArea: 'Cebu Baseport', origin: 'Cebu', destination: 'Iloilo', flexibility: 'Fixed Schedule' }, operations: {}, priority: 'Urgent', assignedMarketingRepresentative: 'Miguel Reyes', internalTags: ['prototype'], status: 'Approved', createdAt: '2026-07-27T03:30:00.000Z', updatedAt: '2026-08-01T05:45:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-012', referenceNumber: 'SR-2026-012', customerId: 'CUS-001', contactId: 'CUS-001-PRIMARY', requestSource: 'Phone Call',
    vessel: { name: 'MV Coral Bay', type: 'Container Ship' }, service: { type: 'Standby Tug Service', tugboatsRequired: 1, preferredTugClass: '40T Bollard Pull', description: 'Standby tug during cargo transfer.' },
    schedule: { requestedDate: '2026-08-08', requestedTime: '13:00', portOrOperatingArea: 'Davao Sasa Wharf', berthOrTerminal: 'Berth 5', flexibility: 'Fixed Schedule' }, operations: {}, priority: 'Normal', assignedMarketingRepresentative: 'Andrea Santos', internalTags: ['prototype'], status: 'Scheduled', createdAt: '2026-07-25T06:10:00.000Z', updatedAt: '2026-08-02T01:20:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-011', referenceNumber: 'SR-2026-011', customerId: 'CUS-001', contactId: 'CUS-001-PRIMARY', requestSource: 'Referral',
    vessel: { name: 'MV North Star', type: 'Offshore Vessel' }, service: { type: 'Marine Support Service', tugboatsRequired: 1, description: 'Completed offshore marine support operation.' },
    schedule: { requestedDate: '2026-07-22', requestedTime: '09:00', portOrOperatingArea: 'Bataan Offshore Area', flexibility: 'Fixed Schedule' }, operations: {}, priority: 'Normal', assignedMarketingRepresentative: 'Miguel Reyes', internalTags: ['prototype'], status: 'Completed', createdAt: '2026-07-18T02:10:00.000Z', updatedAt: '2026-07-23T08:00:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-010', referenceNumber: 'SR-2026-010', customerId: 'CUS-001', contactId: 'CUS-001-PRIMARY', requestSource: 'Customer Inquiry',
    vessel: { name: 'MV Ocean Crest', type: 'Tanker' }, service: { type: 'Emergency Towing', tugboatsRequired: 3, description: 'Emergency towing request withdrawn after vessel recovery.' },
    schedule: { requestedDate: '2026-07-20', requestedTime: '23:30', portOrOperatingArea: 'Verde Island Passage', flexibility: 'Fixed Schedule' }, operations: {}, priority: 'Emergency', assignedMarketingRepresentative: 'Andrea Santos', internalTags: ['prototype'], status: 'Cancelled', cancellationReason: 'Customer withdrew request', cancelledAt: '2026-07-20T18:10:00.000Z', createdAt: '2026-07-20T14:05:00.000Z', updatedAt: '2026-07-20T18:10:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-009', referenceNumber: 'SR-2026-009', customerId: 'CUS-001', contactId: 'CUS-001-PRIMARY', requestSource: 'Email',
    vessel: { name: 'MV Luzon Voyager', type: 'Cargo Ship' }, service: { type: 'Harbor Towage', tugboatsRequired: 2, description: 'Reviewed harbor towage request available for quotation.' },
    schedule: { requestedDate: '2026-08-18', requestedTime: '11:00', portOrOperatingArea: 'Batangas Port', berthOrTerminal: 'Berth 6', flexibility: 'Flexible by 1 Hour' }, operations: {}, priority: 'Normal', assignedMarketingRepresentative: 'Andrea Santos', internalTags: ['prototype'], status: 'Approved', createdAt: '2026-08-04T03:00:00.000Z', updatedAt: '2026-08-04T04:00:00.000Z',
  },
]
