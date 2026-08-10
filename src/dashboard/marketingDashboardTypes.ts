import type { Appointment } from '../types/appointment'
import type { Contract } from '../types/contract'
import type { Customer } from '../types/customer'
import type { CustomerActivity } from '../types/customerActivity'
import type { Quotation } from '../types/quotation'
import type { ServiceRequest } from '../types/serviceRequest'

export type DashboardPriority = 'Critical' | 'High' | 'Medium' | 'Normal'
export type DashboardRecordType = 'Service Request' | 'Quotation' | 'Contract' | 'Appointment' | 'Customer'
export type WorkQueueTab = 'My Tasks' | 'Service Requests' | 'Quotations' | 'Contracts' | 'Follow-ups'

export interface MarketingDashboardSource {
  customers: readonly Customer[]
  serviceRequests: readonly ServiceRequest[]
  quotations: readonly Quotation[]
  contracts: readonly Contract[]
  appointments: readonly Appointment[]
  activities: readonly CustomerActivity[]
}

export interface DashboardMetric {
  id: string
  label: string
  count: number
  detail: string
  href: string
  icon: 'requests' | 'review' | 'quotation' | 'contract' | 'appointment'
}

export interface DashboardTask {
  id: string
  type: DashboardRecordType
  reference: string
  customerId: string
  customer: string
  status: string
  nextAction: string
  dueAt?: string
  priority: DashboardPriority
  assignedRepresentative: string
  reason: string
  updatedAt: string
  href: string
  overdue: boolean
}

export interface DashboardFollowUp extends DashboardTask {
  sourceType: 'Customer' | 'Service Request' | 'Quotation' | 'Appointment'
}

export interface DashboardPipelineStage {
  id: string
  label: string
  count: number
  conversion?: number
  href: string
}

export interface DashboardActivity {
  id: string
  description: string
  customer: string
  actor: string
  occurredAt: string
  module: string
  reference?: string
  href?: string
}

export interface DashboardData {
  metrics: DashboardMetric[]
  attention: DashboardTask[]
  workQueue: DashboardTask[]
  appointments: Appointment[]
  followUps: DashboardFollowUp[]
  pipeline: DashboardPipelineStage[]
  activities: DashboardActivity[]
  isPersonalized: boolean
  integrityWarnings: string[]
}
