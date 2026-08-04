export type AppointmentType =
  | 'Client Meeting'
  | 'Service Consultation'
  | 'Site Inspection'
  | 'Vessel Assessment'
  | 'Quotation Discussion'
  | 'Contract Discussion'
  | 'Follow-up Call'
  | 'Other'

export type AppointmentStatus = 'Pending Confirmation' | 'Scheduled' | 'Confirmed' | 'Rescheduled' | 'Completed' | 'Cancelled' | 'No Show'

export type MeetingMethod = 'In Person' | 'Phone Call' | 'Video Meeting'

export type AppointmentRelatedRecordType = 'Service Request' | 'Quotation' | 'Contract Request' | 'Contract'
export type AppointmentReminder = 'No Reminder' | '15 Minutes Before' | '30 Minutes Before' | '1 Hour Before' | '1 Day Before'

export interface AppointmentRelatedRecord {
  type: AppointmentRelatedRecordType
  id: string
  referenceNumber: string
  title: string
}

export interface AppointmentStatusEvent {
  id: string
  fromStatus?: AppointmentStatus
  toStatus: AppointmentStatus
  occurredAt: string
  changedBy?: string
  reason?: string
  notes?: string
  previousStartAt?: string
  previousEndAt?: string
}

export interface Appointment {
  id: string
  customerId: string
  contactId: string
  title: string
  description?: string
  type: AppointmentType
  status: AppointmentStatus
  meetingMethod: MeetingMethod
  startAt: string
  endAt: string
  timeZone: string
  location?: string
  addressOrMeetingPoint?: string
  roomOrArea?: string
  phoneNumber?: string
  alternativePhone?: string
  videoPlatform?: string
  meetingLink?: string
  assignedRepresentativeId: string
  assignedRepresentativeName?: string
  relatedRecord?: AppointmentRelatedRecord
  agenda: string
  customerVisibleNotes?: string
  internalNotes?: string
  reminder: AppointmentReminder
  statusHistory: AppointmentStatusEvent[]
  followUp: { required: boolean; dueDate?: string; completed: boolean }
  confirmedAt?: string
  rescheduledAt?: string
  completedAt?: string
  cancelledAt?: string
  noShowAt?: string
  completion?: { outcome: string; customerResponse?: string; nextAction?: string; completedBy?: string; customerVisibleNotes?: string; internalNotes?: string }
  noShow?: { party: 'Customer' | 'SEDAR Representative' | 'Both'; notes: string; followUpAction?: string }
  cancellation?: { reason: string; explanation?: string; cancelledAt: string; cancelledBy: string }
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type AppointmentInput = Omit<
  Appointment,
  'id' | 'status' | 'statusHistory' | 'createdAt' | 'updatedAt' | 'confirmedAt' | 'rescheduledAt' | 'completedAt' | 'cancelledAt' | 'noShowAt'
> & {
  status?: Extract<AppointmentStatus, 'Pending Confirmation' | 'Scheduled' | 'Confirmed'>
}

export interface ConfirmAppointmentInput {
  changedBy?: string
  notes?: string
}

export interface RescheduleAppointmentInput {
  startAt: string
  endAt: string
  reason: string
  changedBy?: string
  notes?: string
}

export interface CompleteAppointmentInput {
  outcome: string
  customerResponse?: string
  nextAction?: string
  followUpRequired: boolean
  followUpDate?: string
  customerVisibleNotes?: string
  internalNotes?: string
  changedBy?: string
  notes?: string
}

export interface MarkNoShowAppointmentInput {
  party: 'Customer' | 'SEDAR Representative' | 'Both'
  followUpAction?: string
  changedBy?: string
  notes?: string
}

export interface CancelAppointmentInput {
  reason: string
  explanation?: string
  notes?: string
  changedBy?: string
}
