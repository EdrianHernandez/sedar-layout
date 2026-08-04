export type ServiceRequestStatus = 'Draft' | 'Under Review' | 'Awaiting Operations' | 'Quotation Prepared' | 'Awaiting Customer Approval' | 'Approved' | 'Scheduled' | 'Completed' | 'Cancelled'
export type ServicePriority = 'Normal' | 'High' | 'Urgent' | 'Emergency'

export interface ServiceRequest {
  id: string
  referenceNumber: string
  customerId: string
  contactId: string
  requestSource: string
  vessel: { name: string; imoNumber?: string; type: string; flag?: string; grossTonnage?: number; lengthOverall?: number; beam?: number; draft?: number; cargoType?: string; vesselAgent?: string }
  service: { type: string; tugboatsRequired: number; preferredTugClass?: string; estimatedDuration?: string; contractReference?: string; purchaseOrderReference?: string; description: string }
  schedule: { requestedDate: string; requestedTime: string; portOrOperatingArea: string; berthOrTerminal?: string; origin?: string; destination?: string; estimatedCompletionDate?: string; estimatedCompletionTime?: string; flexibility: string }
  operations: { natureOfAssistance?: string; specialTugRequirements?: string; safetyRequirements?: string; knownHazards?: string; weatherOrTideConsiderations?: string; communicationChannel?: string; additionalInstructions?: string }
  priority: ServicePriority
  assignedMarketingRepresentative: string
  requestedOperationsReviewer?: string
  internalTags: string[]
  internalNotes?: string
  followUpDate?: string
  status: ServiceRequestStatus
  cancellationReason?: string
  cancellationExplanation?: string
  cancelledAt?: string
  createdAt: string
  updatedAt: string
}
