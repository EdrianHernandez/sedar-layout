import type { CustomerActivity, CustomerAppointment, CustomerInternalNote, CustomerTransaction } from '../types/customer'

// All related records below are fictional prototype data and do not describe real SEDAR activity.
export const customerTransactions: CustomerTransaction[] = [
  { id: 'TRX-001', customerId: 'CUS-001', date: '2026-08-03', type: 'Service Request', reference: 'SR-2026-018', description: 'Harbor towage request', status: 'Under Review' },
  { id: 'TRX-002', customerId: 'CUS-001', date: '2026-07-26', type: 'Quotation', reference: 'QT-2026-014', description: 'Docking-assistance quotation', amount: 125000, status: 'Approved' },
  { id: 'TRX-003', customerId: 'CUS-001', date: '2026-07-30', type: 'Contract', reference: 'CT-2026-009', description: 'Docking-assistance contract', amount: 125000, status: 'Active' },
  { id: 'TRX-004', customerId: 'CUS-001', date: '2026-08-01', type: 'Invoice', reference: 'INV-2026-031', description: 'Docking-assistance service', amount: 125000, status: 'Issued' },
  { id: 'TRX-005', customerId: 'CUS-001', date: '2026-08-02', type: 'Payment', reference: 'PAY-2026-022', description: 'Payment received', amount: 125000, status: 'Paid' },
  { id: 'TRX-006', customerId: 'CUS-001', date: '2026-06-18', type: 'Completed Service', reference: 'SVC-2026-041', description: 'Berthing support service', amount: 84000, status: 'Completed' },
  { id: 'TRX-007', customerId: 'CUS-001', date: '2026-06-12', type: 'Service Request', reference: 'SR-2026-011', description: 'Berthing support request', status: 'Completed' },
  { id: 'TRX-008', customerId: 'CUS-001', date: '2026-05-29', type: 'Quotation', reference: 'QT-2026-008', description: 'Emergency standby quotation', amount: 96000, status: 'Expired' },
  { id: 'TRX-009', customerId: 'CUS-003', date: '2026-07-28', type: 'Service Request', reference: 'SR-2026-016', description: 'Vessel shifting request', status: 'Under Review' },
  { id: 'TRX-010', customerId: 'CUS-005', date: '2026-08-01', type: 'Contract', reference: 'CT-2026-012', description: 'Annual harbor assistance contract', amount: 480000, status: 'Active' },
]

export const customerAppointments: Record<string, CustomerAppointment[]> = {
  'CUS-001': [{ id: 'APT-001', type: 'Service planning meeting', date: '2026-08-12', time: '10:00 AM', contactPerson: 'Mara Villanueva', location: 'Batangas operations office', assignedRepresentative: 'Andrea Santos', status: 'Confirmed' }],
}

export const customerActivities: Record<string, CustomerActivity[]> = {
  'CUS-001': [
    { id: 'ACT-001', description: 'Service request submitted', reference: 'SR-2026-018', employee: 'Andrea Santos', occurredAt: '2026-08-03T09:20:00', kind: 'request' },
    { id: 'ACT-002', description: 'Payment recorded', reference: 'PAY-2026-022', employee: 'Miguel Reyes', occurredAt: '2026-08-02T15:45:00', kind: 'contract' },
    { id: 'ACT-003', description: 'Quotation approved by the customer', reference: 'QT-2026-014', employee: 'Andrea Santos', occurredAt: '2026-07-29T11:10:00', kind: 'quotation' },
    { id: 'ACT-004', description: 'Contract activated', reference: 'CT-2026-009', employee: 'Andrea Santos', occurredAt: '2026-07-30T14:00:00', kind: 'contract' },
    { id: 'ACT-005', description: 'Follow-up appointment scheduled', reference: 'APT-001', employee: 'Bianca Flores', occurredAt: '2026-07-28T16:30:00', kind: 'appointment' },
  ],
}

export const customerInternalNotes: Record<string, CustomerInternalNote[]> = {
  'CUS-001': [
    { id: 'NOTE-001', author: 'Andrea Santos', date: '2026-08-02', content: 'Customer prefers morning coordination calls for time-sensitive harbor movements.' },
    { id: 'NOTE-002', author: 'Miguel Reyes', date: '2026-07-24', content: 'Confirm final vessel particulars before preparing the next service quotation.' },
    { id: 'NOTE-003', author: 'Bianca Flores', date: '2026-07-15', content: 'Operations team requested a consolidated monthly service summary.' },
  ],
}
