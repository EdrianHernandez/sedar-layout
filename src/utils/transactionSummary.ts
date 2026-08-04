import type { CustomerTransaction, CustomerTransactionSummary } from '../types/customerTransaction'
import { isOpenCustomerItem } from './transactionStatus'

export const getApprovedQuotationValue = (transactions: readonly CustomerTransaction[]): number => {
  const latestByFamily = new Map<string, CustomerTransaction>()
  for (const transaction of transactions) {
    if (transaction.type !== 'Quotation' || !transaction.quotation || transaction.status !== 'Approved' || transaction.quotation.superseded) continue
    const current = latestByFamily.get(transaction.quotation.familyId)
    if (!current || (current.quotation?.revisionNumber ?? -1) < transaction.quotation.revisionNumber) latestByFamily.set(transaction.quotation.familyId, transaction)
  }
  return [...latestByFamily.values()].reduce((total, transaction) => total + (transaction.amount ?? 0), 0)
}

export const getTransactionSummary = (transactions: readonly CustomerTransaction[]): CustomerTransactionSummary => ({
  totalCount: transactions.length,
  completedSourceCount: new Set(transactions.filter((item) => item.status === 'Completed').map((item) => `${item.source.kind}:${item.source.id}`)).size,
  approvedQuotationValue: getApprovedQuotationValue(transactions),
  openItemCount: new Set(transactions.filter(isOpenCustomerItem).map((item) => `${item.source.kind}:${item.source.id}`)).size,
  currency: 'PHP',
})
