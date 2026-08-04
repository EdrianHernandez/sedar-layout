export type ContactType = 'Commercial' | 'Operations' | 'Billing' | 'Emergency' | 'Authorized Signatory' | 'Other'
export type ContactStatus = 'Active' | 'Inactive'
export type PreferredContactMethod = 'Email' | 'Phone' | 'SMS'

export interface CustomerContact {
  id: string
  customerId: string
  firstName: string
  middleName?: string
  lastName: string
  position: string
  department?: string
  contactTypes: ContactType[]
  email: string
  primaryPhone: string
  secondaryPhone?: string
  preferredContactMethod: PreferredContactMethod
  availableDays?: string[]
  preferredContactStartTime?: string
  preferredContactEndTime?: string
  timeZone: string
  isPrimary: boolean
  status: ContactStatus
  authorizations: { canApproveQuotations: boolean; canSignContracts: boolean; canCoordinateOperations: boolean }
  internalNotes?: string
  lastContactedAt?: string
  createdAt: string
  updatedAt: string
  addedBy: string
}

export type CustomerContactInput = Omit<CustomerContact, 'id' | 'customerId' | 'createdAt' | 'updatedAt' | 'addedBy'>
