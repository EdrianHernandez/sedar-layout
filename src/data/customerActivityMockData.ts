import type { ActivityAction, ActivityActor, ActivityChange, ActivityModule, ActivityVisibility, CustomerActivity } from '../types/customerActivity'

// Fictional prototype audit data for UI development only.
const marketing: ActivityActor = { id: 'USR-ANDREA', name: 'Andrea Santos', type: 'SEDAR Employee', department: 'Marketing' }
const operations: ActivityActor = { id: 'USR-LUIS', name: 'Luis Mendoza', type: 'SEDAR Employee', department: 'Operations' }
const customer: ActivityActor = { id: 'CONTACT-DEMO', name: 'Alex Rivera', type: 'Customer' }
const system: ActivityActor = { id: 'SYSTEM', name: 'SEDAR System', type: 'System' }
const event = (id: string, occurredAt: string, module: ActivityModule, action: ActivityAction, description: string, reference?: string, changes?: ActivityChange[], actor = marketing, visibility: ActivityVisibility = 'Internal', extra: Partial<CustomerActivity> = {}): CustomerActivity => ({ id, customerId: 'CUS-001', occurredAt, module, action, description, actor, relatedRecord: reference ? { type: module, id: `${module.replaceAll(' ', '-').toUpperCase()}-${id}`, referenceNumber: reference } : undefined, visibility, changes, systemGenerated: actor.type === 'System', recordedAt: occurredAt, eventSource: 'Prototype seed', ...extra })

export const initialCustomerActivities: CustomerActivity[] = [
  event('ACT-001', '2026-08-04T02:35:00.000Z', 'Service Requests', 'Created', 'Andrea Santos created Service Request SR-2026-018.', 'SR-2026-018'),
  event('ACT-002', '2026-08-04T01:20:00.000Z', 'Service Requests', 'Status Changed', 'Service Request SR-2026-018 changed from Under Review to Awaiting Operations.', 'SR-2026-018', [{ field: 'status', previousValue: 'Under Review', newValue: 'Awaiting Operations' }]),
  event('ACT-003', '2026-08-03T07:10:00.000Z', 'Documents', 'Uploaded', 'Vessel certificate registered.', 'DOC-2026-006'),
  event('ACT-004', '2026-08-03T05:30:00.000Z', 'Documents', 'Updated', 'Document visibility changed to Customer Visible.', 'DOC-2026-006', [{ field: 'visibility', previousValue: 'Internal', newValue: 'Customer Visible' }]),
  event('ACT-005', '2026-08-02T08:00:00.000Z', 'Quotations', 'Submitted', 'Quotation QT-2026-014 submitted for internal approval.', 'QT-2026-014'),
  event('ACT-006', '2026-08-02T06:25:00.000Z', 'Quotations', 'Approved', 'Customer approval recorded for Quotation QT-2026-014.', 'QT-2026-014', undefined, customer, 'Customer-Originated'),
  event('ACT-007', '2026-08-01T09:15:00.000Z', 'Contracts', 'Status Changed', 'Contract CT-2026-009 became active.', 'CT-2026-009', [{ field: 'status', previousValue: 'Awaiting Signatures', newValue: 'Active' }]),
  event('ACT-008', '2026-08-01T04:40:00.000Z', 'Appointments', 'Follow-up Created', 'Customer follow-up created.', 'APT-2026-009'),
  event('ACT-009', '2026-07-31T08:30:00.000Z', 'Appointments', 'Updated', 'Service consultation rescheduled.', 'APT-2026-009', [{ field: 'startAt', previousValue: 'Jul 31, 2026 2:00 PM', newValue: 'Aug 1, 2026 10:00 AM' }], marketing, 'Internal', { reason: 'Customer requested a later schedule.' }),
  event('ACT-010', '2026-07-30T03:20:00.000Z', 'Contacts', 'Created', 'Contact Alex Rivera added.', 'CONTACT-001'),
  event('ACT-011', '2026-07-29T07:45:00.000Z', 'Contacts', 'Updated', 'Primary contact changed.', 'CONTACT-001', [{ field: 'primaryContact', previousValue: 'Jordan Lee', newValue: 'Alex Rivera' }]),
  event('ACT-012', '2026-07-28T06:10:00.000Z', 'Service Requests', 'Updated', 'Request priority changed from Normal to High.', 'SR-2026-018', [{ field: 'priority', previousValue: 'Normal', newValue: 'High' }], operations),
  event('ACT-013', '2026-07-27T05:00:00.000Z', 'Contract Requests', 'Submitted', 'Contract preparation requested from approved Quotation QT-2026-014.', 'CR-2026-014'),
  event('ACT-014', '2026-07-26T04:30:00.000Z', 'Finance Summary', 'Created', 'Invoice INV-2026-031 issued.', 'INV-2026-031', undefined, { id: 'FINANCE', name: 'Finance', type: 'SEDAR Department', department: 'Finance' }, 'Restricted'),
  event('ACT-015', '2026-07-25T02:15:00.000Z', 'Finance Summary', 'Status Changed', 'Invoice status changed to Paid.', 'INV-2026-031', [{ field: 'bankAccountNumber', previousValue: 'sensitive', newValue: 'sensitive', restricted: true }], system, 'Restricted'),
  event('ACT-016', '2026-07-20T09:00:00.000Z', 'Customer Account', 'Assigned', 'Assigned Marketing representative changed.', 'CUS-001', [{ field: 'assignedRepresentative', previousValue: 'Michael Cruz', newValue: 'Andrea Santos' }]),
  event('ACT-017', '2026-07-18T08:00:00.000Z', 'Customer Account', 'Status Changed', 'Relationship status changed from Developing to Established.', 'CUS-001', [{ field: 'status', previousValue: 'Developing', newValue: 'Established' }]),
  event('ACT-018', '2026-01-08T03:00:00.000Z', 'Customer Account', 'Created', 'Customer account created.', 'CUS-001'),
  { ...event('ACT-019', '2026-07-28T03:00:00.000Z', 'Customer Account', 'Created', 'Another fictional customer account created.', 'CUS-003'), customerId: 'CUS-003' },
]
