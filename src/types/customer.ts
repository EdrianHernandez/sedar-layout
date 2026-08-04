export type CustomerStatus = 'Prospect' | 'Active' | 'Inactive' | 'Restricted'

export type CustomerType =
  | 'Shipping Company'
  | 'Vessel Owner'
  | 'Port Operator'
  | 'Maritime Agency'
  | 'Industrial Client'
  | 'Government Agency'

export type RelationshipStatus = 'New' | 'Developing' | 'Established' | 'At Risk'

export interface CustomerProfileDetails {
  taxIdentificationNumber?: string
  businessAddress: string
  cityProvince: string
  country: string
  companyEmail: string
  companyPhone: string
  website?: string
  dateAdded: string
  leadSource: string
  customerSince: string
  nextFollowUpDate?: string
  relationshipStatus: RelationshipStatus
}

export interface Customer {
  id: string
  companyName: string
  companyInitials: string
  primaryContact: {
    name: string
    position: string
    email: string
    phone: string
  }
  customerType: CustomerType
  activeRequests: number
  activeContracts: number
  lastInteraction: string
  status: CustomerStatus
  assignedRepresentative: string
  needsFollowUp: boolean
  profileDetails?: CustomerProfileDetails
}

export interface CustomerAppointment {
  id: string
  type: string
  date: string
  time: string
  contactPerson: string
  location: string
  assignedRepresentative: string
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled'
}

export interface CustomerActivity {
  id: string
  description: string
  reference?: string
  employee: string
  occurredAt: string
  kind: 'request' | 'quotation' | 'contract' | 'appointment' | 'note'
}

export interface CustomerInternalNote {
  id: string
  author: string
  date: string
  content: string
}

export type CustomerTransactionType = 'Service Request' | 'Quotation' | 'Contract' | 'Completed Service' | 'Invoice' | 'Payment'
export type CustomerTransactionStatus = 'Draft' | 'Under Review' | 'Sent' | 'Approved' | 'Active' | 'Completed' | 'Issued' | 'Pending' | 'Partially Paid' | 'Paid' | 'Cancelled' | 'Expired'

export interface CustomerTransaction {
  id: string
  customerId: string
  date: string
  type: CustomerTransactionType
  reference: string
  description: string
  amount?: number
  status: CustomerTransactionStatus
}

export interface NewCustomerInput {
  companyName: string
  customerType: CustomerType
  businessAddress: string
  cityProvince: string
  country: string
  taxId: string
  companyEmail: string
  companyPhone: string
  website: string
  firstName: string
  lastName: string
  position: string
  contactEmail: string
  contactPhone: string
  status: CustomerStatus
  assignedRepresentative: string
  leadSource: string
  notes: string
}
