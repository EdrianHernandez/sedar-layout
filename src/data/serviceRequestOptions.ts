import type { ServicePriority, ServiceRequestStatus } from '../types/serviceRequest'

export const SERVICE_REQUEST_STATUSES: ServiceRequestStatus[] = ['Draft', 'Under Review', 'Awaiting Operations', 'Quotation Prepared', 'Awaiting Customer Approval', 'Approved', 'Scheduled', 'Completed', 'Cancelled']
export const SERVICE_PRIORITIES: ServicePriority[] = ['Normal', 'High', 'Urgent', 'Emergency']
export const SERVICE_TYPES = ['Harbor Towage', 'Docking Assistance', 'Undocking Assistance', 'Tug Escort', 'Barge Towing', 'Emergency Towing', 'Standby Tug Service', 'Inter-island Towage', 'Marine Support Service', 'Other']
export const SERVICE_REQUEST_CANCELLATION_REASONS = ['Customer withdrew request', 'Schedule changed', 'Duplicate request', 'Service no longer required', 'Operational limitation', 'Other'] as const
