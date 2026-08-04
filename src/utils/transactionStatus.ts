import type { TransactionStatusGroup, TransactionType } from '../types/customerTransaction'

const directStatuses: Readonly<Record<string, TransactionStatusGroup>> = {
  Draft: 'Draft',
  'Under Review': 'Under Review',
  'Awaiting Operations': 'Awaiting Approval',
  'Quotation Prepared': 'Awaiting Approval',
  'For Internal Approval': 'Awaiting Approval',
  'Ready to Send': 'Awaiting Approval',
  Sent: 'Awaiting Customer',
  Viewed: 'Awaiting Customer',
  'Awaiting Customer Approval': 'Awaiting Customer',
  'For Internal Review': 'Under Review',
  'Ready for Signature': 'Awaiting Approval',
  'Awaiting Signatures': 'Awaiting Approval',
  Approved: 'Approved',
  'Customer Approved': 'Approved',
  Scheduled: 'Scheduled',
  Active: 'Active',
  Completed: 'Completed',
  Issued: 'Issued',
  Pending: 'Pending',
  'Partially Paid': 'Partially Paid',
  Paid: 'Paid',
  Credited: 'Completed',
  Cancelled: 'Cancelled',
  Terminated: 'Terminated',
  Expired: 'Expired',
  Rejected: 'Rejected',
  Declined: 'Rejected',
  Superseded: 'Superseded',
}

export const normalizeTransactionStatus = (status: string): TransactionStatusGroup => directStatuses[status] ?? 'Pending'

// Open items are unique source records awaiting review, approval, customer response, signature, or final settlement.
const OPEN_STATUS_GROUPS: readonly TransactionStatusGroup[] = ['Under Review', 'Awaiting Approval', 'Awaiting Customer', 'Issued', 'Pending', 'Partially Paid']

export const isOpenCustomerItem = (transaction: { type: TransactionType; status: TransactionStatusGroup }): boolean =>
  OPEN_STATUS_GROUPS.includes(transaction.status) && transaction.type !== 'Payment' && transaction.type !== 'Credit Note'
