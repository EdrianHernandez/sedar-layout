import type { ServiceRequest } from '../types/serviceRequest'

// Fictional prototype data for UI development only.
export const initialServiceRequests: ServiceRequest[] = [
  {
    id: 'REQ-PROTOTYPE-021', referenceNumber: 'SR-2026-021', customerId: 'CUS-006', contactId: 'CUS-006-PRIMARY', requestSource: 'Customer Inquiry',
    vessel: { name: 'MV Verde Passage', type: 'Passenger Vessel', flag: 'Philippines' }, service: { type: 'Harbor Towage', tugboatsRequired: 1, description: 'Initial harbor towage inquiry for a planned Batangas port call.' },
    schedule: { requestedDate: '2026-08-22', requestedTime: '09:30', portOrOperatingArea: 'Batangas Port', berthOrTerminal: 'Passenger Terminal', flexibility: 'Flexible by 3 Hours' }, operations: {}, priority: 'Normal', assignedMarketingRepresentative: 'Bianca Flores', internalTags: ['prototype', 'prospect'], status: 'Draft', operationsReview: { status: 'Not Submitted' }, createdAt: '2026-08-08T07:45:00.000Z', updatedAt: '2026-08-08T07:45:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-020', referenceNumber: 'SR-2026-020', customerId: 'CUS-004', contactId: 'CUS-004-PRIMARY', requestSource: 'Existing Contract',
    vessel: { name: 'MV Harbor Sentinel', imoNumber: '9764201', type: 'Offshore Vessel' }, service: { type: 'Standby Tug Service', tugboatsRequired: 1, preferredTugClass: '40T Bollard Pull', contractReference: 'CTR-2026-011', description: 'Standby tug coverage during maintenance activity at the port facility.' },
    schedule: { requestedDate: '2026-08-19', requestedTime: '07:00', portOrOperatingArea: 'Manila North Harbor', berthOrTerminal: 'Maintenance Berth 2', flexibility: 'Fixed Schedule' }, operations: { natureOfAssistance: 'Standby and emergency response coverage.' }, priority: 'High', assignedMarketingRepresentative: 'Bianca Flores', requestedOperationsReviewer: 'Ramon Cruz', internalTags: ['prototype', 'standby'], status: 'Under Review', operationsReview: { status: 'Not Submitted' }, createdAt: '2026-08-07T04:10:00.000Z', updatedAt: '2026-08-08T02:25:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-019', referenceNumber: 'SR-2026-019', customerId: 'CUS-007', contactId: 'CUS-007-PRIMARY', requestSource: 'Phone Call',
    vessel: { name: 'MV Industrial Dawn', imoNumber: '9876543', type: 'Bulk Carrier', draft: 8.4 }, service: { type: 'Emergency Towing', tugboatsRequired: 3, preferredTugClass: 'ASD Tug', purchaseOrderReference: 'PO-CIC-26081', description: 'Urgent towage assistance following loss of propulsion near the anchorage.' },
    schedule: { requestedDate: '2026-08-09', requestedTime: '16:30', portOrOperatingArea: 'Batangas Anchorage', berthOrTerminal: 'Outer Anchorage', flexibility: 'Fixed Schedule' }, operations: { knownHazards: 'Restricted maneuverability and commercial traffic.' }, priority: 'Emergency', assignedMarketingRepresentative: 'Andrea Santos', requestedOperationsReviewer: 'Ramon Cruz', internalTags: ['prototype', 'emergency'], status: 'Awaiting Operations', operationsReview: { status: 'Awaiting Review', submittedAt: '2026-08-09T03:00:00.000Z', submittedBy: 'Andrea Santos' }, createdAt: '2026-08-09T02:20:00.000Z', updatedAt: '2026-08-09T03:00:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-018', referenceNumber: 'SR-2026-018', customerId: 'CUS-001', contactId: 'CUS-001-PRIMARY', requestSource: 'Customer Inquiry',
    vessel: { name: 'MV Southern Star', type: 'Cargo Ship' }, service: { type: 'Harbor Towage', tugboatsRequired: 2, description: 'Harbor towage request for safe berthing assistance.' },
    schedule: { requestedDate: '2026-08-12', requestedTime: '10:00', portOrOperatingArea: 'Batangas Port', flexibility: 'Flexible by 1 Hour' }, operations: {}, priority: 'Normal', assignedMarketingRepresentative: 'Andrea Santos', internalTags: ['prototype'], status: 'Under Review', operationsReview: { status: 'Not Submitted' }, createdAt: '2026-08-03T09:20:00.000Z', updatedAt: '2026-08-03T09:20:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-017', referenceNumber: 'SR-2026-017', customerId: 'CUS-002', contactId: 'CUS-002-PRIMARY', requestSource: 'Email',
    vessel: { name: 'MV Pacific Trader', type: 'Container Ship' }, service: { type: 'Docking Assistance', tugboatsRequired: 2, preferredTugClass: 'ASD Tug', description: 'Docking support for port arrival.' },
    schedule: { requestedDate: '', requestedTime: '', portOrOperatingArea: 'Manila South Harbor', flexibility: 'To Be Confirmed' }, operations: {}, priority: 'Normal', assignedMarketingRepresentative: '', internalTags: ['prototype'], status: 'Draft', operationsReview: { status: 'Not Submitted' }, createdAt: '2026-08-02T08:10:00.000Z', updatedAt: '2026-08-02T08:10:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-016', referenceNumber: 'SR-2026-016', customerId: 'CUS-001', contactId: 'CUS-001-PRIMARY', requestSource: 'Phone Call',
    vessel: { name: 'MT Isla Verde', type: 'Tanker' }, service: { type: 'Tug Escort', tugboatsRequired: 2, description: 'Escort assistance through the harbor channel.' },
    schedule: { requestedDate: '2026-08-10', requestedTime: '06:30', portOrOperatingArea: 'Subic Bay', berthOrTerminal: 'Oil Terminal 2', flexibility: 'Fixed Schedule' }, operations: {}, priority: 'High', assignedMarketingRepresentative: 'Andrea Santos', requestedOperationsReviewer: 'Ramon Cruz', internalTags: ['prototype'], status: 'Awaiting Operations', operationsReview: { status: 'More Information Required', submittedAt: '2026-08-02T08:00:00.000Z', submittedBy: 'Andrea Santos', informationRequest: 'Please confirm the vessel draft and provide the latest port clearance.', reviewedAt: '2026-08-04T02:30:00.000Z', reviewedBy: 'Ramon Cruz' }, waitingForCustomerInformation: true, createdAt: '2026-08-01T11:15:00.000Z', updatedAt: '2026-08-04T02:30:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-015', referenceNumber: 'SR-2026-015', customerId: 'CUS-003', contactId: 'CUS-003-PRIMARY', requestSource: 'Existing Contract',
    vessel: { name: 'MV Harbor Queen', type: 'Passenger Vessel' }, service: { type: 'Undocking Assistance', tugboatsRequired: 1, contractReference: 'CTR-2026-004', description: 'Undocking support before scheduled departure.' },
    schedule: { requestedDate: '2026-08-09', requestedTime: '15:00', portOrOperatingArea: 'Pier 15, Manila', berthOrTerminal: 'Berth 3', flexibility: 'Flexible by 1 Hour' }, operations: {}, priority: 'Normal', assignedMarketingRepresentative: 'Miguel Reyes', internalTags: ['prototype'], status: 'Quotation Prepared', operationsReview: { status: 'Feasible', reviewedAt: '2026-08-02T04:00:00.000Z', reviewedBy: 'Ramon Cruz' }, createdAt: '2026-07-31T07:40:00.000Z', updatedAt: '2026-08-03T06:20:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-014', referenceNumber: 'SR-2026-014', customerId: 'CUS-001', contactId: 'CUS-001-PRIMARY', requestSource: 'Customer Inquiry',
    vessel: { name: 'MV Eastern Horizon', type: 'Bulk Carrier' }, service: { type: 'Barge Towing', tugboatsRequired: 2, description: 'Tow a loaded barge to the receiving terminal.' },
    schedule: { requestedDate: '2026-08-14', requestedTime: '08:00', portOrOperatingArea: 'Cavite Anchorage', origin: 'Cavite', destination: 'Batangas', flexibility: 'Flexible Within the Day' }, operations: {}, priority: 'High', assignedMarketingRepresentative: 'Andrea Santos', internalTags: ['prototype'], status: 'Awaiting Customer Approval', operationsReview: { status: 'Feasible with Conditions', conditions: 'Daylight operation only; weather window subject to final Operations confirmation.', reviewedAt: '2026-08-01T09:00:00.000Z', reviewedBy: 'Ramon Cruz' }, createdAt: '2026-07-29T04:50:00.000Z', updatedAt: '2026-08-02T09:10:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-013', referenceNumber: 'SR-2026-013', customerId: 'CUS-005', contactId: 'CUS-005-PRIMARY', requestSource: 'Email',
    vessel: { name: 'MV Cebu Pioneer', type: 'Cargo Ship' }, service: { type: 'Inter-island Towage', tugboatsRequired: 2, description: 'Approved inter-island towage operation.' },
    schedule: { requestedDate: '2026-08-15', requestedTime: '05:30', portOrOperatingArea: 'Cebu Baseport', origin: 'Cebu', destination: 'Iloilo', flexibility: 'Fixed Schedule' }, operations: {}, priority: 'Urgent', assignedMarketingRepresentative: 'Miguel Reyes', internalTags: ['prototype'], status: 'Approved', operationsReview: { status: 'Feasible', reviewedAt: '2026-07-30T06:00:00.000Z', reviewedBy: 'Ramon Cruz' }, createdAt: '2026-07-27T03:30:00.000Z', updatedAt: '2026-08-01T05:45:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-012', referenceNumber: 'SR-2026-012', customerId: 'CUS-008', contactId: 'CUS-008-PRIMARY', requestSource: 'Phone Call',
    vessel: { name: 'MV Coral Bay', type: 'Container Ship' }, service: { type: 'Standby Tug Service', tugboatsRequired: 1, preferredTugClass: '40T Bollard Pull', description: 'Standby tug during cargo transfer.' },
    schedule: { requestedDate: '2026-08-08', requestedTime: '13:00', portOrOperatingArea: 'Davao Sasa Wharf', berthOrTerminal: 'Berth 5', flexibility: 'Fixed Schedule' }, operations: {}, priority: 'Normal', assignedMarketingRepresentative: 'Andrea Santos', internalTags: ['prototype'], status: 'Scheduled', operationsReview: { status: 'Feasible with Conditions', conditions: 'Maintain standby VHF channel 12.', reviewedAt: '2026-07-29T05:00:00.000Z', reviewedBy: 'Ramon Cruz' }, createdAt: '2026-07-25T06:10:00.000Z', updatedAt: '2026-08-02T01:20:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-011', referenceNumber: 'SR-2026-011', customerId: 'CUS-001', contactId: 'CUS-001-PRIMARY', requestSource: 'Referral',
    vessel: { name: 'MV North Star', type: 'Offshore Vessel' }, service: { type: 'Marine Support Service', tugboatsRequired: 1, description: 'Completed offshore marine support operation.' },
    schedule: { requestedDate: '2026-07-22', requestedTime: '09:00', portOrOperatingArea: 'Bataan Offshore Area', flexibility: 'Fixed Schedule' }, operations: {}, priority: 'Normal', assignedMarketingRepresentative: 'Miguel Reyes', internalTags: ['prototype'], status: 'Completed', createdAt: '2026-07-18T02:10:00.000Z', updatedAt: '2026-07-23T08:00:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-010', referenceNumber: 'SR-2026-010', customerId: 'CUS-001', contactId: 'CUS-001-PRIMARY', requestSource: 'Customer Inquiry',
    vessel: { name: 'MV Ocean Crest', type: 'Tanker' }, service: { type: 'Emergency Towing', tugboatsRequired: 3, description: 'Emergency towing request withdrawn after vessel recovery.' },
    schedule: { requestedDate: '2026-07-20', requestedTime: '23:30', portOrOperatingArea: 'Verde Island Passage', flexibility: 'Fixed Schedule' }, operations: {}, priority: 'Emergency', assignedMarketingRepresentative: 'Andrea Santos', internalTags: ['prototype'], status: 'Cancelled', operationsReview: { status: 'Not Feasible', reviewedAt: '2026-07-20T17:40:00.000Z', reviewedBy: 'Ramon Cruz', internalNotes: 'Prototype review outcome retained for history.' }, cancellationReason: 'Operational Limitation', cancelledAt: '2026-07-20T18:10:00.000Z', createdAt: '2026-07-20T14:05:00.000Z', updatedAt: '2026-07-20T18:10:00.000Z',
  },
  {
    id: 'REQ-PROTOTYPE-009', referenceNumber: 'SR-2026-009', customerId: 'CUS-001', contactId: 'CUS-001-PRIMARY', requestSource: 'Email',
    vessel: { name: 'MV Luzon Voyager', type: 'Cargo Ship' }, service: { type: 'Harbor Towage', tugboatsRequired: 2, description: 'Reviewed harbor towage request available for quotation.' },
    schedule: { requestedDate: '2026-08-18', requestedTime: '11:00', portOrOperatingArea: 'Batangas Port', berthOrTerminal: 'Berth 6', flexibility: 'Flexible by 1 Hour' }, operations: {}, priority: 'Normal', assignedMarketingRepresentative: 'Andrea Santos', internalTags: ['prototype'], status: 'Approved', createdAt: '2026-08-04T03:00:00.000Z', updatedAt: '2026-08-04T04:00:00.000Z',
  },
]
