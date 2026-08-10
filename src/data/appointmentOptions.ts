import type { AppointmentStatus, AppointmentType, MeetingMethod } from '../types/appointment'

export const APPOINTMENT_TYPES = ['Initial Consultation', 'Service Request Discussion', 'Quotation Presentation', 'Contract Discussion', 'Customer Follow-up', 'Port or Site Visit', 'Document Submission', 'Renewal Discussion', 'Online Meeting', 'Other', 'Client Meeting', 'Service Consultation', 'Site Inspection', 'Vessel Assessment', 'Quotation Discussion', 'Follow-up Call'] as const satisfies readonly AppointmentType[]
export const APPOINTMENT_STATUSES = ['Draft', 'Pending Confirmation', 'Scheduled', 'Confirmed', 'Rescheduled', 'In Progress', 'Completed', 'Cancelled', 'No Show'] as const satisfies readonly AppointmentStatus[]
export const MEETING_METHODS = ['SEDAR Office', 'Customer Office', 'Port or Terminal', 'Onboard Vessel', 'Phone Call', 'Online Meeting', 'Other', 'In Person', 'Video Meeting'] as const satisfies readonly MeetingMethod[]
export const MEETING_PLATFORMS = ['Microsoft Teams', 'Google Meet', 'Zoom', 'Other'] as const
export const REMINDERS = ['No Reminder', '15 Minutes Before', '30 Minutes Before', '1 Hour Before', '1 Day Before'] as const
export const CANCELLATION_REASONS = ['Customer Request', 'Schedule Conflict', 'Meeting No Longer Required', 'Operational Emergency', 'Duplicate Appointment', 'Other'] as const
export const RESCHEDULE_REASONS = ['Customer requested', 'Representative unavailable', 'Scheduling conflict', 'Operational priority', 'Other'] as const
export const NO_SHOW_REASONS = ['Customer did not attend', 'Unable to reach customer', 'Other'] as const

export const APPOINTMENT_TYPE_OPTIONS = APPOINTMENT_TYPES
export const APPOINTMENT_STATUS_OPTIONS = APPOINTMENT_STATUSES
export const MEETING_METHOD_OPTIONS = MEETING_METHODS
export const MEETING_PLATFORM_OPTIONS = MEETING_PLATFORMS
export const REMINDER_OPTIONS = REMINDERS
