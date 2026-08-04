import type { TransactionVisibility } from '../types/customerTransaction'

export interface FinanceTransactionSummary {
  id: string
  customerId: string
  occurredAt: string
  type: 'Invoice' | 'Payment' | 'Credit Note'
  reference: string
  description: string
  status: string
  amount: number
  currency: 'PHP'
  visibility: TransactionVisibility
  relatedFinanceSummaryIds: readonly string[]
}

// Fictional read-only Finance summaries for UI prototyping. They exclude bank, payment-method, tax, account, and other sensitive Finance fields.
export const financeTransactionSummaries: readonly FinanceTransactionSummary[] = [
  { id: 'FIN-SUM-INV-031', customerId: 'CUS-001', occurredAt: '2026-08-01T08:00:00.000Z', type: 'Invoice', reference: 'INV-2026-031', description: 'Invoice issued for completed marine service', status: 'Issued', amount: 125000, currency: 'PHP', visibility: 'Customer Visible', relatedFinanceSummaryIds: ['FIN-SUM-PAY-022', 'FIN-SUM-CN-004'] },
  { id: 'FIN-SUM-INV-029', customerId: 'CUS-001', occurredAt: '2026-07-24T08:00:00.000Z', type: 'Invoice', reference: 'INV-2026-029', description: 'Invoice with a remaining customer balance', status: 'Partially Paid', amount: 84000, currency: 'PHP', visibility: 'Customer Visible', relatedFinanceSummaryIds: ['FIN-SUM-PAY-022'] },
  { id: 'FIN-SUM-PAY-022', customerId: 'CUS-001', occurredAt: '2026-08-02T08:00:00.000Z', type: 'Payment', reference: 'PAY-2026-022', description: 'Payment received and applied', status: 'Paid', amount: 75000, currency: 'PHP', visibility: 'Customer Visible', relatedFinanceSummaryIds: ['FIN-SUM-INV-031', 'FIN-SUM-INV-029'] },
  { id: 'FIN-SUM-CN-004', customerId: 'CUS-001', occurredAt: '2026-08-03T08:00:00.000Z', type: 'Credit Note', reference: 'CN-2026-004', description: 'Credit adjustment issued', status: 'Credited', amount: -5000, currency: 'PHP', visibility: 'Customer Visible', relatedFinanceSummaryIds: ['FIN-SUM-INV-031'] },
]
