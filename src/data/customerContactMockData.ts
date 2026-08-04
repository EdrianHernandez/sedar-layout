import { initialCustomers } from './customerMockData'
import type { CustomerContact } from '../types/customerContact'

const prototypeDate = '2026-08-01T08:00:00.000Z'

// Fictional prototype data for UI development only.
const primaryContacts: CustomerContact[] = initialCustomers.map((customer) => {
  const [firstName, ...lastParts] = customer.primaryContact.name.split(' ')
  return {
    id: `${customer.id}-PRIMARY`, customerId: customer.id, firstName, lastName: lastParts.join(' '), position: customer.primaryContact.position,
    department: 'Operations', contactTypes: ['Operations'], email: customer.primaryContact.email, primaryPhone: customer.primaryContact.phone,
    preferredContactMethod: 'Email', availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], preferredContactStartTime: '08:00', preferredContactEndTime: '17:00', timeZone: 'Asia/Manila',
    isPrimary: true, status: 'Active', authorizations: { canApproveQuotations: true, canSignContracts: false, canCoordinateOperations: true }, internalNotes: 'Primary coordination contact for service operations.', lastContactedAt: customer.lastInteraction, createdAt: prototypeDate, updatedAt: prototypeDate, addedBy: 'SEDAR Marketing',
  }
})

export const initialCustomerContacts: CustomerContact[] = [
  ...primaryContacts,
  { id: 'CUS-001-CON-002', customerId: 'CUS-001', firstName: 'Teresa', lastName: 'Lazaro', position: 'Finance Officer', department: 'Finance', contactTypes: ['Billing', 'Authorized Signatory'], email: 'teresa.lazaro@example.test', primaryPhone: '+63 917 555 0111', secondaryPhone: '+63 43 555 0111', preferredContactMethod: 'Email', availableDays: ['Monday', 'Wednesday', 'Friday'], preferredContactStartTime: '09:00', preferredContactEndTime: '16:00', timeZone: 'Asia/Manila', isPrimary: false, status: 'Active', authorizations: { canApproveQuotations: true, canSignContracts: true, canCoordinateOperations: false }, internalNotes: 'Coordinates purchase orders and billing documents.', lastContactedAt: '2026-07-29', createdAt: '2025-01-12T08:00:00.000Z', updatedAt: prototypeDate, addedBy: 'Andrea Santos' },
  { id: 'CUS-001-CON-003', customerId: 'CUS-001', firstName: 'Joel', lastName: 'Manalo', position: 'Port Operations Coordinator', department: 'Port Operations', contactTypes: ['Operations', 'Emergency'], email: 'joel.manalo@example.test', primaryPhone: '+63 917 555 0112', preferredContactMethod: 'Phone', availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], preferredContactStartTime: '06:00', preferredContactEndTime: '18:00', timeZone: 'Asia/Manila', isPrimary: false, status: 'Active', authorizations: { canApproveQuotations: false, canSignContracts: false, canCoordinateOperations: true }, internalNotes: 'Use for berth movement and short-notice operational coordination.', lastContactedAt: '2026-08-01', createdAt: '2025-04-18T08:00:00.000Z', updatedAt: prototypeDate, addedBy: 'Andrea Santos' },
  { id: 'CUS-001-CON-004', customerId: 'CUS-001', firstName: 'Elena', lastName: 'Ramos', position: 'Former Procurement Coordinator', department: 'Procurement', contactTypes: ['Commercial'], email: 'elena.ramos@example.test', primaryPhone: '+63 917 555 0113', preferredContactMethod: 'Email', availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], preferredContactStartTime: '09:00', preferredContactEndTime: '17:00', timeZone: 'Asia/Manila', isPrimary: false, status: 'Inactive', authorizations: { canApproveQuotations: false, canSignContracts: false, canCoordinateOperations: false }, internalNotes: 'Retained for historical procurement correspondence.', lastContactedAt: '2026-06-18', createdAt: '2025-03-10T08:00:00.000Z', updatedAt: prototypeDate, addedBy: 'Andrea Santos' },
]
