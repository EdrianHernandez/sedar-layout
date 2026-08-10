import type { OperationsReviewStatus, ServicePriority, ServiceRequestStatus } from '../types/serviceRequest'

export const SERVICE_REQUEST_STATUSES: ServiceRequestStatus[] = ['Draft', 'Under Review', 'Awaiting Operations', 'Quotation Prepared', 'Awaiting Customer Approval', 'Approved', 'Scheduled', 'Completed', 'Cancelled']
export const SERVICE_PRIORITIES: ServicePriority[] = ['Normal', 'High', 'Urgent', 'Emergency']
export const OPERATIONS_REVIEW_STATUSES: OperationsReviewStatus[] = ['Not Submitted', 'Awaiting Review', 'More Information Required', 'Feasible', 'Feasible with Conditions', 'Not Feasible']
export const SERVICE_TYPES = ['Harbor Towage', 'Docking Assistance', 'Undocking Assistance', 'Tug Escort', 'Barge Towing', 'Emergency Towing', 'Standby Tug Service', 'Inter-island Towage', 'Marine Support Service', 'Other']
export const SERVICE_REQUEST_CANCELLATION_REASONS = ['Customer Withdrew Request', 'Schedule Changed', 'Duplicate Request', 'Service No Longer Required', 'Operational Limitation', 'Other'] as const
