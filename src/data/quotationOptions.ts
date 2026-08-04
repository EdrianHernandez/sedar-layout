import type { QuotationCustomerResponse, QuotationStatus } from '../types/quotation'

export const QUOTATION_STATUSES: readonly QuotationStatus[] = ['Draft', 'For Internal Approval', 'Ready to Send', 'Sent', 'Viewed', 'Customer Approved', 'Rejected', 'Expired', 'Superseded']
export const QUOTATION_CUSTOMER_RESPONSES: readonly QuotationCustomerResponse[] = ['Customer Approved', 'Rejected', 'Requested Revision']
export const QUOTATION_VALIDITY_DAY_OPTIONS = [7, 14, 30, 45, 60] as const
