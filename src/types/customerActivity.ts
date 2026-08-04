export const ACTIVITY_MODULES = ['Customer Account', 'Contacts', 'Service Requests', 'Quotations', 'Contract Requests', 'Contracts', 'Appointments', 'Documents', 'Finance Summary', 'System'] as const
export type ActivityModule = typeof ACTIVITY_MODULES[number]

export const ACTIVITY_ACTIONS = ['Created', 'Updated', 'Assigned', 'Status Changed', 'Note Added', 'Contacted', 'Submitted', 'Approved', 'Rejected', 'Cancelled', 'Uploaded', 'Downloaded', 'Archived', 'Follow-up Created', 'Follow-up Completed'] as const
export type ActivityAction = typeof ACTIVITY_ACTIONS[number]

export const ACTIVITY_VISIBILITIES = ['Internal', 'Customer-Originated', 'Restricted'] as const
export type ActivityVisibility = typeof ACTIVITY_VISIBILITIES[number]
export const ACTIVITY_ACTOR_TYPES = ['SEDAR Employee', 'SEDAR Department', 'Customer', 'System'] as const
export type ActivityActorType = typeof ACTIVITY_ACTOR_TYPES[number]
export type ActivityMetadataValue = string | number | boolean | null

export interface ActivityChange { field: string; previousValue?: ActivityMetadataValue; newValue?: ActivityMetadataValue; restricted?: boolean }
export interface ActivityActor { id?: string; name: string; type: ActivityActorType; department?: string }
export interface ActivityRelatedRecord { type: string; id: string; referenceNumber: string }
export interface CustomerActivity {
  id: string; customerId: string; occurredAt: string; module: ActivityModule; action: ActivityAction; description: string
  actor: ActivityActor; relatedRecord?: ActivityRelatedRecord; visibility: ActivityVisibility; changes?: ActivityChange[]
  reason?: string; internalNote?: string; metadata?: Record<string, ActivityMetadataValue>; relatedActivityIds?: string[]
  sourceEventKey?: string; systemGenerated: boolean; recordedAt: string; eventSource: string
}
export type ActivityChangeInput = Omit<ActivityChange, 'previousValue' | 'newValue'> & { previousValue?: unknown; newValue?: unknown }
export type CustomerActivityInput = Omit<CustomerActivity, 'id' | 'occurredAt' | 'recordedAt' | 'changes' | 'metadata'> & { occurredAt?: string; recordedAt?: string; changes?: ActivityChangeInput[]; metadata?: Record<string, unknown> }
export type CustomerActivityOnceInput = CustomerActivityInput & { sourceEventKey: string }
export interface ActivityFilter { module?: ActivityModule; action?: ActivityAction; actor?: 'Marketing Employees' | 'Other SEDAR Departments' | 'Customer-Originated' | 'System'; visibility?: ActivityVisibility; from?: string; to?: string; search?: string }
export interface ActivityGroup { date: string; activities: CustomerActivity[] }

export const PROTOTYPE_ACTIVITY_ACTOR: ActivityActor = { id: 'USR-ANDREA', name: 'Andrea Santos', type: 'SEDAR Employee', department: 'Marketing' }
