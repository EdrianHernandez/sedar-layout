export type ServiceRequestStatus = 'Draft' | 'Under Review' | 'Awaiting Operations' | 'Quotation Prepared' | 'Awaiting Customer Approval' | 'Approved' | 'Scheduled' | 'Completed' | 'Cancelled'
export type ServicePriority = 'Normal' | 'High' | 'Urgent' | 'Emergency'
export type OperationsReviewStatus = 'Not Submitted' | 'Awaiting Review' | 'More Information Required' | 'Feasible' | 'Feasible with Conditions' | 'Not Feasible'

export interface OperationsReview {
  status: OperationsReviewStatus
  submittedAt?: string
  submittedBy?: string
  reviewedAt?: string
  reviewedBy?: string
  conditions?: string
  informationRequest?: string
  internalNotes?: string
  marketingResponse?: string
  marketingResponseDetails?: string
  marketingResponseNote?: string
  respondedAt?: string
  respondedBy?: string
}

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
  operationsReview?: OperationsReview
  waitingForCustomerInformation?: boolean
  cancellationReason?: string
  cancellationExplanation?: string
  cancelledAt?: string
  cancelledBy?: string
  createdAt: string
  updatedAt: string
}
