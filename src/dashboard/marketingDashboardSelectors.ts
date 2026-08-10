import type { Appointment } from '../types/appointment'
import type { Contract } from '../types/contract'
import type { Customer } from '../types/customer'
import type { Quotation } from '../types/quotation'
import type { ServiceRequest } from '../types/serviceRequest'
import { getAppointmentConfirmationStatus } from '../utils/appointmentWorkflow'
import { getContractDisplayStatus } from '../utils/contractWorkflow'
import { getQuotationDisplayStatus } from '../utils/quotationWorkflow'
import { getManilaDateKey } from './marketingDashboardFormatters'
import type { DashboardActivity, DashboardData, DashboardFollowUp, DashboardPipelineStage, DashboardPriority, DashboardTask, MarketingDashboardSource } from './marketingDashboardTypes'

const priorityRank: Record<DashboardPriority, number> = { Critical: 0, High: 1, Medium: 2, Normal: 3 }
const representativeAliases: Record<string, string> = { 'REP-ANDREA': 'Andrea Santos', 'USR-ANDREA': 'Andrea Santos', 'REP-MIGUEL': 'Miguel Reyes' }
const normalizeRepresentative = (value?: string) => representativeAliases[value ?? ''] ?? value ?? 'Unassigned'
const isAssignedTo = (assigned: string, user?: string) => !user || normalizeRepresentative(assigned) === normalizeRepresentative(user)
const customerName = (customers: Map<string, Customer>, id: string) => customers.get(id)?.companyName ?? 'Unknown customer'
const dueTime = (value?: string) => value ? Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59+08:00` : value) : Number.POSITIVE_INFINITY
const isOverdue = (value: string | undefined, now: Date) => Boolean(value && dueTime(value) < now.getTime())
const routeFor = (type: DashboardTask['type'], id: string) => type === 'Service Request' ? `/marketing/service-requests/${id}` : type === 'Quotation' ? `/marketing/quotations/${id}` : type === 'Contract' ? `/marketing/contracts/${id}` : type === 'Customer' ? `/marketing/customers/${id}` : `/marketing/appointments?appointmentId=${id}`

export function validateUniqueBusinessReferences<T>(records: readonly T[], reference: (record: T) => string, type: string): string[] {
  const seen = new Map<string, number>()
  records.forEach((record) => seen.set(reference(record), (seen.get(reference(record)) ?? 0) + 1))
  return [...seen].filter(([value, count]) => value && count > 1).map(([value]) => `Duplicate ${type} reference: ${value}`)
}

export function getNextMarketingAction(record: ServiceRequest | Quotation | Contract): string {
  if ('referenceNumber' in record) {
    if (record.waitingForCustomerInformation || record.operationsReview?.status === 'More Information Required') return 'Respond to Information Request'
    if (record.operationsReview?.status === 'Feasible with Conditions') return 'Review Conditions and Create Quotation'
    if (record.operationsReview?.status === 'Feasible') return 'Create Quotation'
    if (record.operationsReview?.status === 'Not Feasible') return 'Review Operations Decision'
    return ({ Draft: 'Complete Request Details', 'Under Review': 'Submit to Operations', 'Awaiting Operations': 'Monitor Review' } as Record<string, string>)[record.status] ?? 'Review Request'
  }
  if ('quotationNumber' in record) {
    const status = getQuotationDisplayStatus(record)
    if (record.internalApprovalStatus === 'Revision Required') return 'Revise Quotation'
    return ({ Draft: 'Complete Quotation', 'For Approval': 'Monitor Approval', Approved: 'Send to Customer', Sent: 'Follow Up with Customer', Viewed: 'Follow Up with Customer', 'Changes Requested': 'Create Revision', Accepted: 'Request Contract', Expired: 'Follow Up or Create Revision', Rejected: 'Review Customer Feedback' } as Record<string, string>)[status] ?? 'Review Quotation'
  }
  const status = getContractDisplayStatus(record)
  const correction = record.correctionRequests?.some((item) => item.status === 'Requested')
  if (correction) return 'Respond to Information Request'
  return ({ Requested: 'Monitor Drafting', Drafting: 'Review Draft', 'Internal Review': 'Monitor Review', 'Approved for Signature': 'Send to Customer', 'Sent for Signature': 'Send Signing Reminder', 'Partially Signed': 'Follow Up on Remaining Signature', 'Expiring Soon': 'Request Renewal' } as Record<string, string>)[status] ?? 'Review Contract'
}

function task<T extends Omit<DashboardTask, 'overdue'>>(input: T, now: Date): T & Pick<DashboardTask, 'overdue'> {
  return { ...input, overdue: isOverdue(input.dueAt, now) }
}

function requestPriority(request: ServiceRequest): DashboardPriority {
  if (request.priority === 'Emergency') return 'Critical'
  if (request.priority === 'Urgent' || request.waitingForCustomerInformation) return 'High'
  if (request.priority === 'High' || request.operationsReview?.status === 'More Information Required') return 'Medium'
  return 'Normal'
}

function getServiceRequestTasks(requests: readonly ServiceRequest[], customers: Map<string, Customer>, now: Date): DashboardTask[] {
  return requests.filter((record) => !['Completed', 'Cancelled'].includes(record.status)).map((record) => task({ id: record.id, type: 'Service Request', reference: record.referenceNumber, customerId: record.customerId, customer: customerName(customers, record.customerId), status: record.operationsReview?.status === 'More Information Required' ? 'More Information Required' : record.status, nextAction: getNextMarketingAction(record), dueAt: record.followUpDate, priority: requestPriority(record), assignedRepresentative: normalizeRepresentative(record.assignedMarketingRepresentative), reason: record.priority === 'Emergency' ? 'Emergency request requires immediate coordination' : record.operationsReview?.status === 'More Information Required' ? 'Operations requested additional information' : getNextMarketingAction(record), updatedAt: record.updatedAt, href: routeFor('Service Request', record.id) }, now))
}

function getQuotationTasks(quotations: readonly Quotation[], customers: Map<string, Customer>, now: Date): DashboardTask[] {
  return quotations.filter((record) => !['Withdrawn'].includes(getQuotationDisplayStatus(record))).filter((record) => ['Draft', 'For Approval', 'Approved', 'Sent', 'Viewed', 'Changes Requested', 'Accepted', 'Expired', 'Rejected'].includes(getQuotationDisplayStatus(record))).map((record) => {
    const status = getQuotationDisplayStatus(record)
    const followUp = record.response?.followUpDate ?? (['Sent', 'Viewed'].includes(status) ? record.validUntil : undefined)
    const priority: DashboardPriority = isOverdue(followUp, now) ? 'High' : status === 'Expired' || record.internalApprovalStatus === 'Revision Required' ? 'Medium' : 'Normal'
    return task({ id: record.id, type: 'Quotation', reference: `${record.quotationNumber}${record.revisionNumber ? ` R${record.revisionNumber}` : ''}`, customerId: record.customerId, customer: customerName(customers, record.customerId), status, nextAction: getNextMarketingAction(record), dueAt: followUp, priority, assignedRepresentative: normalizeRepresentative(record.assignedRepresentativeId ?? record.preparedBy), reason: isOverdue(followUp, now) ? 'Customer follow-up is overdue' : getNextMarketingAction(record), updatedAt: record.updatedAt, href: routeFor('Quotation', record.id) }, now)
  })
}

function contractNeedsAttention(contract: Contract, now: Date) {
  const status = getContractDisplayStatus(contract, now)
  const pendingReview = [contract.operationsReviewStatus, contract.legalReviewStatus, contract.managementApprovalStatus].some((value) => value === 'Pending' || value === 'Revision Required')
  const corrections = contract.correctionRequests?.some((item) => item.status === 'Requested')
  return pendingReview || corrections || ['Requested', 'Drafting', 'Internal Review', 'Approved for Signature', 'Sent for Signature', 'Partially Signed', 'Expiring Soon'].includes(status)
}

function getContractTasks(contracts: readonly Contract[], customers: Map<string, Customer>, now: Date): DashboardTask[] {
  return contracts.filter((record) => contractNeedsAttention(record, now)).map((record) => {
    const status = getContractDisplayStatus(record, now)
    const correction = record.correctionRequests?.some((item) => item.status === 'Requested')
    const dueAt = status === 'Expiring Soon' ? record.expirationDate : record.requiredCompletionDate
    return task({ id: record.id, type: 'Contract', reference: record.contractNumber, customerId: record.customerId, customer: customerName(customers, record.customerId), status, nextAction: getNextMarketingAction(record), dueAt, priority: correction ? 'High' : status === 'Expiring Soon' ? 'Medium' : 'Normal', assignedRepresentative: normalizeRepresentative(record.assignedRepresentativeId ?? record.managedBy), reason: correction ? 'Contract correction requires a Marketing response' : getNextMarketingAction(record), updatedAt: record.updatedAt, href: routeFor('Contract', record.id) }, now)
  })
}

export function getTodaysMarketingAppointments(source: MarketingDashboardSource, currentUser: string | undefined, now: Date): Appointment[] {
  const today = getManilaDateKey(now)
  const all = source.appointments.filter((record) => getManilaDateKey(record.startAt) === today && !['Cancelled', 'No Show'].includes(record.status))
  const personal = all.filter((record) => isAssignedTo(record.assignedRepresentativeName ?? record.assignedRepresentativeId, currentUser))
  return (personal.length ? personal : all).sort((a, b) => a.startAt.localeCompare(b.startAt))
}

export function getFollowUpsDue(source: MarketingDashboardSource, now: Date): DashboardFollowUp[] {
  const customers = new Map(source.customers.map((record) => [record.id, record]))
  const rows: DashboardFollowUp[] = []
  source.customers.filter((record) => record.needsFollowUp || record.profileDetails?.nextFollowUpDate).forEach((record) => rows.push({ ...task({ id: record.id, type: 'Customer', sourceType: 'Customer', reference: record.id, customerId: record.id, customer: record.companyName, status: 'Follow-up Due', nextAction: 'Follow Up with Customer', dueAt: record.profileDetails?.nextFollowUpDate, priority: isOverdue(record.profileDetails?.nextFollowUpDate, now) ? 'High' : 'Normal', assignedRepresentative: normalizeRepresentative(record.assignedRepresentative), reason: 'Customer relationship follow-up', updatedAt: record.lastInteraction, href: routeFor('Customer', record.id) }, now) }))
  source.serviceRequests.filter((record) => record.followUpDate && !['Completed', 'Cancelled'].includes(record.status)).forEach((record) => rows.push({ ...task({ id: record.id, type: 'Service Request', sourceType: 'Service Request', reference: record.referenceNumber, customerId: record.customerId, customer: customerName(customers, record.customerId), status: 'Follow-up Due', nextAction: 'Follow Up with Customer', dueAt: record.followUpDate, priority: isOverdue(record.followUpDate, now) ? 'High' : 'Normal', assignedRepresentative: normalizeRepresentative(record.assignedMarketingRepresentative), reason: 'Service request follow-up', updatedAt: record.updatedAt, href: routeFor('Service Request', record.id) }, now) }))
  source.quotations.filter((record) => record.response?.followUpDate).forEach((record) => rows.push({ ...task({ id: record.id, type: 'Quotation', sourceType: 'Quotation', reference: record.quotationNumber, customerId: record.customerId, customer: customerName(customers, record.customerId), status: 'Follow-up Due', nextAction: 'Follow Up with Customer', dueAt: record.response?.followUpDate, priority: isOverdue(record.response?.followUpDate, now) ? 'High' : 'Normal', assignedRepresentative: normalizeRepresentative(record.assignedRepresentativeId ?? record.preparedBy), reason: 'Quotation response follow-up', updatedAt: record.updatedAt, href: routeFor('Quotation', record.id) }, now) }))
  source.appointments.filter((record) => record.followUp.required && !record.followUp.completed).forEach((record) => rows.push({ ...task({ id: record.id, type: 'Appointment', sourceType: 'Appointment', reference: record.appointmentNumber ?? record.id, customerId: record.customerId, customer: customerName(customers, record.customerId), status: 'Follow-up Due', nextAction: 'Complete Appointment Follow-up', dueAt: record.followUp.dueDate, priority: isOverdue(record.followUp.dueDate, now) ? 'High' : 'Normal', assignedRepresentative: normalizeRepresentative(record.assignedRepresentativeName ?? record.assignedRepresentativeId), reason: record.completion?.nextAction ?? 'Appointment follow-up', updatedAt: record.updatedAt, href: routeFor('Appointment', record.id) }, now) }))
  return rows.sort((a, b) => Number(b.overdue) - Number(a.overdue) || dueTime(a.dueAt) - dueTime(b.dueAt))
}

export function getMarketingWorkQueue(source: MarketingDashboardSource, currentUser: string | undefined, now: Date): DashboardTask[] {
  const customers = new Map(source.customers.map((record) => [record.id, record]))
  const all = [...getServiceRequestTasks(source.serviceRequests, customers, now), ...getQuotationTasks(source.quotations, customers, now), ...getContractTasks(source.contracts, customers, now), ...getFollowUpsDue(source, now)]
  const personal = all.filter((record) => isAssignedTo(record.assignedRepresentative, currentUser))
  return (personal.length ? personal : all).sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || Number(b.overdue) - Number(a.overdue) || dueTime(a.dueAt) - dueTime(b.dueAt) || b.updatedAt.localeCompare(a.updatedAt))
}

export function getMarketingAttentionItems(source: MarketingDashboardSource, currentUser: string | undefined, now: Date): DashboardTask[] {
  const appointments = getTodaysMarketingAppointments(source, currentUser, now).filter((record) => getAppointmentConfirmationStatus(record) === 'Awaiting Response').map((record) => task({ id: record.id, type: 'Appointment', reference: record.appointmentNumber ?? record.id, customerId: record.customerId, customer: source.customers.find((item) => item.id === record.customerId)?.companyName ?? 'Unknown customer', status: 'Awaiting Confirmation', nextAction: 'Confirm Appointment', dueAt: record.startAt, priority: 'High', assignedRepresentative: normalizeRepresentative(record.assignedRepresentativeName ?? record.assignedRepresentativeId), reason: 'Today’s appointment is awaiting confirmation', updatedAt: record.updatedAt, href: routeFor('Appointment', record.id) }, now))
  return [...appointments, ...getMarketingWorkQueue(source, currentUser, now).filter((record) => record.priority !== 'Normal' || record.overdue)].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || Number(b.overdue) - Number(a.overdue) || dueTime(a.dueAt) - dueTime(b.dueAt) || b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5)
}

export function getPipelineSnapshot(source: MarketingDashboardSource): DashboardPipelineStage[] {
  const openRequests = source.serviceRequests.filter((record) => !['Completed', 'Cancelled'].includes(record.status))
  const feasible = openRequests.filter((record) => ['Feasible', 'Feasible with Conditions'].includes(record.operationsReview?.status ?? ''))
  const feasibleIds = new Set(feasible.map((record) => record.id))
  const sent = source.quotations.filter((record) => feasibleIds.has(record.serviceRequestId) && ['Sent', 'Viewed', 'Accepted'].includes(getQuotationDisplayStatus(record)))
  const accepted = sent.filter((record) => getQuotationDisplayStatus(record) === 'Accepted')
  const acceptedIds = new Set(accepted.map((record) => record.id))
  const active = source.contracts.filter((record) => acceptedIds.has(record.quotationId) && ['Active', 'Expiring Soon'].includes(getContractDisplayStatus(record)))
  const raw = [
    { id: 'open', label: 'Open Requests', records: openRequests, href: '/marketing/service-requests?filter=open' },
    { id: 'feasible', label: 'Operationally Feasible', records: feasible, href: '/marketing/service-requests?operationsReview=feasible' },
    { id: 'sent', label: 'Quotations Sent', records: sent, href: '/marketing/quotations?status=sent' },
    { id: 'accepted', label: 'Customer Accepted', records: accepted, href: '/marketing/quotations?status=accepted' },
    { id: 'active', label: 'Contracts Active', records: active, href: '/marketing/contracts?status=active' },
  ]
  return raw.map((stage, index) => ({ id: stage.id, label: stage.label, count: stage.records.length, conversion: index ? (raw[index - 1].records.length ? stage.records.length / raw[index - 1].records.length * 100 : 0) : undefined, href: stage.href }))
}

export function getRecentMarketingActivity(source: MarketingDashboardSource): DashboardActivity[] {
  const customers = new Map(source.customers.map((record) => [record.id, record]))
  const allowedModules = new Set(['Customer Account', 'Service Requests', 'Quotations', 'Contract Requests', 'Contracts', 'Appointments'])
  return source.activities.filter((record) => record.visibility !== 'Restricted' && allowedModules.has(record.module)).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 8).map((record) => {
    const type = record.relatedRecord?.type
    const href = !record.relatedRecord ? undefined : type === 'Service Request' ? routeFor('Service Request', record.relatedRecord.id) : type === 'Quotation' ? routeFor('Quotation', record.relatedRecord.id) : type === 'Contract' ? routeFor('Contract', record.relatedRecord.id) : type === 'Appointment' ? routeFor('Appointment', record.relatedRecord.id) : undefined
    return { id: record.id, description: record.description, customer: customerName(customers, record.customerId), actor: record.actor.department ? `${record.actor.name} · ${record.actor.department}` : record.actor.name, occurredAt: record.occurredAt, module: record.module, reference: record.relatedRecord?.referenceNumber, href }
  })
}

export function getMarketingDashboardMetrics(source: MarketingDashboardSource, currentUser: string | undefined, now: Date) {
  const requests = source.serviceRequests.filter((record) => !['Completed', 'Cancelled'].includes(record.status))
  const awaitingReview = requests.filter((record) => record.status === 'Awaiting Operations' && record.operationsReview?.status === 'Awaiting Review')
  const quotes = source.quotations.filter((record) => ['Sent', 'Viewed'].includes(getQuotationDisplayStatus(record)))
  const contracts = source.contracts.filter((record) => contractNeedsAttention(record, now))
  const appointments = getTodaysMarketingAppointments(source, currentUser, now)
  return [
    { id: 'requests', label: 'Open Service Requests', count: requests.length, detail: `${requests.filter((record) => ['Urgent', 'Emergency'].includes(record.priority)).length} urgent`, href: '/marketing/service-requests?filter=open', icon: 'requests' as const },
    { id: 'review', label: 'Awaiting Operations Review', count: awaitingReview.length, detail: `${awaitingReview.filter((record) => isOverdue(record.followUpDate, now)).length} overdue follow-ups`, href: '/marketing/service-requests?operationsReview=awaiting', icon: 'review' as const },
    { id: 'quotation', label: 'Quotations Awaiting Customer Response', count: quotes.length, detail: `${quotes.filter((record) => isOverdue(record.response?.followUpDate ?? record.validUntil, now)).length} follow-ups overdue`, href: '/marketing/quotations?status=awaiting-response', icon: 'quotation' as const },
    { id: 'contract', label: 'Contracts Requiring Attention', count: contracts.length, detail: `${contracts.filter((record) => getContractDisplayStatus(record, now) === 'Expiring Soon').length} expire within 30 days`, href: '/marketing/contracts?filter=attention', icon: 'contract' as const },
    { id: 'appointment', label: 'Today’s Appointments', count: appointments.length, detail: `${appointments.filter((record) => getAppointmentConfirmationStatus(record) === 'Awaiting Response').length} awaiting confirmation`, href: '/marketing/appointments?view=calendar', icon: 'appointment' as const },
  ]
}

export function getMarketingDashboardData(source: MarketingDashboardSource, currentUser: string | undefined, now: Date): DashboardData {
  const integrityWarnings = [
    ...validateUniqueBusinessReferences(source.serviceRequests, (record) => record.referenceNumber, 'service request'),
    ...validateUniqueBusinessReferences(source.quotations, (record) => `${record.quotationNumber}:R${record.revisionNumber}`, 'quotation revision'),
    ...validateUniqueBusinessReferences(source.contracts, (record) => record.contractNumber, 'contract'),
    ...validateUniqueBusinessReferences(source.appointments.filter((record) => Boolean(record.appointmentNumber)), (record) => record.appointmentNumber ?? '', 'appointment'),
  ]
  if (import.meta.env.DEV && integrityWarnings.length) integrityWarnings.forEach((warning) => console.warn(`[Marketing dashboard] ${warning}`))
  const workQueue = getMarketingWorkQueue(source, currentUser, now)
  return { metrics: getMarketingDashboardMetrics(source, currentUser, now), attention: getMarketingAttentionItems(source, currentUser, now), workQueue, appointments: getTodaysMarketingAppointments(source, currentUser, now), followUps: getFollowUpsDue(source, now), pipeline: getPipelineSnapshot(source), activities: getRecentMarketingActivity(source), isPersonalized: Boolean(currentUser && workQueue.some((record) => isAssignedTo(record.assignedRepresentative, currentUser))), integrityWarnings }
}
