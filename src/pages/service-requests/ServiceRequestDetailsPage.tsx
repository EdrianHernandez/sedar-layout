import {
  AlertTriangle, ArrowLeft, CalendarDays, Check, ChevronRight, Circle, ClipboardCheck, Copy, Download,
  FileText, FolderOpen, Mail, MapPin, MoreHorizontal, Paperclip, Pencil, Phone, Plus, Printer,
  Search, Send, Ship, UserRound, UserRoundCog, XCircle,
} from 'lucide-react'
import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AssignRepresentativeDialog, CancelRequestDialog, DuplicateRequestDialog, RespondOperationsDialog, SubmitOperationsDialog } from '../../components/service-requests/GlobalServiceRequestDialogs'
import { OperationsReviewBadge, ServiceRequestStatusBadge } from '../../components/service-requests/ServiceRequestBadges'
import { initialCustomers } from '../../data/customerMockData'
import { DOCUMENT_TYPES, PROTOTYPE_DOCUMENT_USER, type DocumentType } from '../../types/customerDocument'
import type { CustomerActivity } from '../../types/customerActivity'
import type { OperationsReviewStatus, ServiceRequest } from '../../types/serviceRequest'
import { appointmentRepository } from '../../repositories/appointmentRepository'
import { contractRepository } from '../../repositories/contractRepository'
import { customerActivityRepository } from '../../repositories/customerActivityRepository'
import { customerContactRepository } from '../../repositories/customerContactRepository'
import { customerDocumentRepository } from '../../repositories/customerDocumentRepository'
import { quotationRepository } from '../../repositories/quotationRepository'
import { serviceRequestRepository } from '../../repositories/serviceRequestRepository'
import { canPerformMarketingAction, getAvailableMarketingActions, type MarketingRequestAction } from '../../utils/serviceRequestMarketingActions'

interface Props { onNotify: (message: string) => void }
type DetailsTab = 'overview' | 'operations' | 'documents' | 'activity'
type DialogState = 'assign' | 'submit' | 'respond' | 'duplicate' | 'cancel' | null
type ActivityFilter = 'all' | 'marketing' | 'operations' | 'customer' | 'system'

const dateFormatter = new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
const dateTimeFormatter = new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const timeFormatter = new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' })
const formatDate = (value?: string) => value ? dateFormatter.format(new Date(value.includes('T') ? value : `${value}T00:00:00`)) : 'Not provided'
const formatDateTime = (value?: string) => value ? dateTimeFormatter.format(new Date(value)) : 'Not provided'
const formatTime = (value?: string) => value ? timeFormatter.format(new Date(`2026-01-01T${value}:00`)) : 'Not provided'
const reviewStatus = (request: ServiceRequest): OperationsReviewStatus => request.operationsReview?.status ?? 'Not Submitted'
const display = (value: string | number | undefined | null, suffix = '') => value === undefined || value === null || value === '' ? 'Not provided' : `${value}${suffix}`
const bytes = (value: number) => value >= 1048576 ? `${(value / 1048576).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'NA'

const workflowLabels = ['Request Created', 'Marketing Review', 'Operations Review', 'Quotation', 'Customer Approval', 'Scheduled', 'Completed'] as const
const workflowIndex = (request: ServiceRequest) => {
  if (request.status === 'Cancelled' || reviewStatus(request) === 'Not Feasible') return Math.max(0, ['Draft', 'Under Review'].includes(request.status) ? 1 : 2)
  return ({ Draft: 0, 'Under Review': 1, 'Awaiting Operations': 2, 'Quotation Prepared': 3, 'Awaiting Customer Approval': 4, Approved: 4, Scheduled: 5, Completed: 6, Cancelled: 0 } as const)[request.status]
}

function InfoCard({ title, icon, children, action }: { title: string; icon: ReactNode; children: ReactNode; action?: ReactNode }) {
  return <section className="request-detail-section"><header><span>{icon}</span><h2>{title}</h2>{action}</header><div className="request-detail-section-body">{children}</div></section>
}

function DetailGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
  return <dl className="request-detail-grid">{items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
}

function RequestWorkflow({ request }: { request: ServiceRequest }) {
  const current = workflowIndex(request)
  const blocked = request.status === 'Cancelled' || reviewStatus(request) === 'Not Feasible'
  return <section className="request-workflow" aria-labelledby="request-workflow-title"><header><div><span>Request lifecycle</span><h2 id="request-workflow-title">Workflow progress</h2></div><strong>{blocked ? request.status === 'Cancelled' ? 'Request cancelled' : 'Operations review not feasible' : workflowLabels[current]}</strong></header><div className="request-workflow-scroll"><ol>{workflowLabels.map((label, index) => { const state = blocked && index >= current ? 'blocked' : index < current ? 'completed' : index === current ? 'current' : 'upcoming'; return <li key={label} className={state} aria-current={state === 'current' ? 'step' : undefined}><span aria-hidden="true">{state === 'completed' ? <Check size={14} /> : state === 'blocked' ? <XCircle size={14} /> : <Circle size={10} />}</span><div><small>Step {index + 1}</small><strong>{label}</strong></div></li> })}</ol></div></section>
}

export function ServiceRequestDetailsPage({ onNotify }: Props) {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(() => requestId ? serviceRequestRepository.findById(requestId) : undefined)
  const [tab, setTab] = useState<DetailsTab>('overview')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [documentSearch, setDocumentSearch] = useState('')
  const [documentType, setDocumentType] = useState<'' | DocumentType>('')
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all')
  const [internalNote, setInternalNote] = useState('')

  if (!request) return <section className="profile-not-found"><FileText size={30} /><h1>Service request not found</h1><p>The requested service record may have been removed or is unavailable.</p><Link className="button button-secondary" to="/marketing/service-requests"><ArrowLeft size={15} />Back to Service Requests</Link></section>

  const customer = initialCustomers.find((item) => item.id === request.customerId)
  const contacts = customerContactRepository.getByCustomer(request.customerId)
  const contact = contacts.find((item) => item.id === request.contactId) ?? contacts.find((item) => item.isPrimary)
  const quotations = quotationRepository.getByServiceRequestId(request.id)
  const quotation = [...quotations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  const contract = contractRepository.getAll().find((item) => item.serviceRequestId === request.id)
  const appointment = appointmentRepository.getAll().find((item) => item.relatedRecord?.type === 'Service Request' && item.relatedRecord.id === request.id)
  const documents = customerDocumentRepository.getByCustomerId(request.customerId).filter((document) => document.linkedRecords.some((record) => record.type === 'Service Request' && record.id === request.id))
  const activities = customerActivityRepository.getByCustomerId(request.customerId).filter((activity) => activity.relatedRecord?.type === 'Service Request' && activity.relatedRecord.id === request.id)
  const createdActivity = [...activities].reverse().find((activity) => activity.action === 'Created')
  const latestActivity = activities[0]
  const representatives = [...new Set([...initialCustomers.map((item) => item.assignedRepresentative), ...serviceRequestRepository.getAll().map((item) => item.assignedMarketingRepresentative)].filter(Boolean))].sort()
  const actions = getAvailableMarketingActions(request)
  const refresh = () => setRequest(serviceRequestRepository.findById(request.id))
  const confirmDialog = (callback: () => void) => { callback(); setDialog(null); refresh() }
  const submissionError = !contact || contact.status !== 'Active' ? 'An active customer contact is required.'
    : !request.vessel.name || !request.vessel.type ? 'Complete the vessel information before submission.'
      : !request.service.type || !request.service.description.trim() ? 'Complete the service type and description before submission.'
        : !request.schedule.requestedDate || !request.schedule.requestedTime || !request.schedule.portOrOperatingArea ? 'Complete the requested schedule and location before submission.'
          : !Number.isInteger(request.service.tugboatsRequired) || request.service.tugboatsRequired < 1 ? 'Enter a valid tugboat count before submission.' : ''
  const primaryAction: MarketingRequestAction | undefined = ['edit', 'submit', 'respond', 'create-quotation', 'schedule-appointment'].find((item) => actions.includes(item as MarketingRequestAction)) as MarketingRequestAction | undefined
  const actionLabel: Partial<Record<MarketingRequestAction, string>> = { edit: 'Edit Request', submit: 'Submit to Operations', respond: 'Respond to Information Request', 'create-quotation': 'Create Quotation', 'schedule-appointment': 'Schedule Appointment' }

  const handleAction = (action: MarketingRequestAction) => {
    if (!canPerformMarketingAction(request, action)) { onNotify('This action is not available for the current request state.'); return }
    if (action === 'assign') setDialog('assign')
    else if (action === 'submit') setDialog('submit')
    else if (action === 'respond') setDialog('respond')
    else if (action === 'duplicate') setDialog('duplicate')
    else if (action === 'cancel') setDialog('cancel')
    else if (action === 'edit') onNotify('Service Request editing will be implemented next.')
    else if (action === 'create-quotation') navigate(`/marketing/quotations/new?customerId=${request.customerId}&serviceRequestId=${request.id}`)
    else if (action === 'view-quotation' && quotation) navigate(`/marketing/quotations/${quotation.id}`)
    else if (action === 'schedule-appointment') navigate(`/marketing/appointments?customerId=${request.customerId}&contactId=${request.contactId}&relatedType=Service%20Request&relatedId=${request.id}`)
    else if (action === 'view-appointment' && appointment) navigate('/marketing/appointments')
    else if (action === 'schedule-follow-up') onNotify('Follow-up scheduling will be implemented next.')
    else if (action === 'view-submission') setTab('operations')
    else onNotify('The related record has not been created yet.')
  }

  const tabs: { id: DetailsTab; label: string; count?: number }[] = [{ id: 'overview', label: 'Overview' }, { id: 'operations', label: 'Operations Review' }, { id: 'documents', label: 'Documents', count: documents.length }, { id: 'activity', label: 'Activity Log', count: activities.length }]
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; setTab(tabs[next].id); document.getElementById(`request-tab-${tabs[next].id}`)?.focus() }

  const checklist = [
    ['Customer identified', Boolean(customer)], ['Primary contact available', Boolean(contact)], ['Vessel information supplied', Boolean(request.vessel.name && request.vessel.type)],
    ['Service requirements supplied', Boolean(request.service.type && request.service.description && request.service.tugboatsRequired)], ['Requested date supplied', Boolean(request.schedule.requestedDate)],
    ['Location supplied', Boolean(request.schedule.portOrOperatingArea)], ['Supporting documents supplied', documents.length > 0],
  ] as const
  const completedChecklist = checklist.filter(([, complete]) => complete).length
  const completeness = Math.round((completedChecklist / checklist.length) * 100)
  const filteredDocuments = documents.filter((document) => (!documentType || document.documentType === documentType) && (!documentSearch || `${document.title} ${document.versions.find((version) => version.version === document.currentVersion)?.fileName}`.toLowerCase().includes(documentSearch.toLowerCase())))
  const filteredActivities = activities.filter((activity) => activityFilter === 'all' || (activityFilter === 'marketing' && activity.actor.department === 'Marketing') || (activityFilter === 'operations' && activity.actor.department === 'Operations') || (activityFilter === 'customer' && activity.actor.type === 'Customer') || (activityFilter === 'system' && activity.actor.type === 'System'))

  return <main className="service-request-details-page">
    <header className="request-details-header">
      <nav aria-label="Breadcrumb"><ol><li><Link to="/marketing/service-requests">Service Requests</Link></li><li><ChevronRight size={12} /></li><li aria-current="page">{request.referenceNumber}</li></ol></nav>
      <div className="request-details-heading"><span className="request-details-eyebrow">{request.referenceNumber}</span><div className="request-details-title-row"><h1>Service Request Details</h1><div className="request-header-meta"><ServiceRequestStatusBadge status={request.status} /></div></div></div>
    </header>

    <section className="request-summary-card" aria-labelledby="request-summary-title">
      <div className="request-summary-identity"><div><small>Service request</small><h2 id="request-summary-title">{request.referenceNumber}</h2><strong>{request.service.type || 'Service type not provided'}</strong><p>{request.service.description || 'No service description provided.'}</p></div></div>
      <dl className="request-summary-facts">
        <div><dt>Customer</dt><dd>{customer ? <Link to={`/marketing/customers/${customer.id}`}>{customer.companyName}</Link> : request.customerId}</dd></div>
        <div><dt>Primary contact</dt><dd>{contact ? `${contact.firstName} ${contact.lastName}` : 'Not provided'}</dd></div>
        <div><dt>Vessel</dt><dd>{display(request.vessel.name)}</dd></div>
        <div><dt>Requested schedule</dt><dd>{formatDate(request.schedule.requestedDate)}<span>{formatTime(request.schedule.requestedTime)}</span></dd></div>
        <div><dt>Port / location</dt><dd>{display(request.schedule.portOrOperatingArea)}</dd></div>
        <div><dt>Marketing representative</dt><dd>{display(request.assignedMarketingRepresentative)}</dd></div>
        <div><dt>Request source</dt><dd>{display(request.requestSource)}</dd></div>
        <div><dt>Operations review</dt><dd><OperationsReviewBadge status={reviewStatus(request)} /></dd></div>
      </dl>
      <div className="request-summary-actions">
        {primaryAction && <button className="button button-primary" type="button" onClick={() => handleAction(primaryAction)}>{primaryAction === 'submit' || primaryAction === 'respond' ? <Send size={15} /> : primaryAction === 'edit' ? <Pencil size={15} /> : <Plus size={15} />}{actionLabel[primaryAction]}</button>}
        {actions.includes('assign') && <button className="button button-secondary" type="button" onClick={() => handleAction('assign')}><UserRoundCog size={15} />Assign Representative</button>}
        <button className="button button-secondary request-summary-icon-button" type="button" aria-label="Print summary" title="Print summary" onClick={() => window.print()}><Printer size={16} /></button>
        <details className="request-more-actions"><summary aria-label="More actions" title="More actions"><MoreHorizontal size={18} /></summary><div>{actions.includes('duplicate') && <button type="button" onClick={() => handleAction('duplicate')}><Copy size={14} />Duplicate Request</button>}{actions.includes('view-submission') && <button type="button" onClick={() => handleAction('view-submission')}><ClipboardCheck size={14} />View Submitted Information</button>}{actions.includes('cancel') && <button className="danger" type="button" onClick={() => handleAction('cancel')}><XCircle size={14} />Cancel Request</button>}</div></details>
      </div>
    </section>

    {request.priority === 'Emergency' && <aside className="request-emergency-banner"><AlertTriangle size={20} /><div><strong>Emergency service request</strong><p>This request requires immediate coordination and operational review.</p></div></aside>}
    <RequestWorkflow request={request} />

    <div className="request-details-tabs" role="tablist" aria-label="Service Request details sections">{tabs.map((item, index) => <button key={item.id} id={`request-tab-${item.id}`} role="tab" type="button" aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)} onKeyDown={(event) => onTabKeyDown(event, index)}>{item.label}{item.count !== undefined && <span>{item.count}</span>}</button>)}</div>

    {tab === 'overview' && <div className="request-overview-layout" role="tabpanel" aria-labelledby="request-tab-overview"><div className="request-overview-main">
      <InfoCard title="Customer and contact" icon={<UserRound size={17} />} action={<div className="request-card-links"><Link to={`/marketing/customers/${request.customerId}`}>View Customer</Link><Link to={`/marketing/customers/${request.customerId}?tab=contacts`}>View All Contacts</Link></div>}><DetailGrid items={[
        { label: 'Customer name', value: customer?.companyName ?? request.customerId }, { label: 'Customer ID', value: request.customerId }, { label: 'Customer type', value: display(customer?.customerType) }, { label: 'Primary contact', value: contact ? `${contact.firstName} ${contact.lastName}` : 'Not provided' },
        { label: 'Position', value: display(contact?.position) }, { label: 'Phone number', value: contact ? <a href={`tel:${contact.primaryPhone}`}><Phone size={12} />{contact.primaryPhone}</a> : 'Not provided' }, { label: 'Email address', value: contact ? <a href={`mailto:${contact.email}`}><Mail size={12} />{contact.email}</a> : 'Not provided' }, { label: 'Preferred communication', value: display(contact?.preferredContactMethod) },
      ]} /></InfoCard>
      <InfoCard title="Vessel details" icon={<Ship size={17} />}><DetailGrid items={[
        { label: 'Vessel name', value: display(request.vessel.name) }, { label: 'IMO / registration', value: display(request.vessel.imoNumber) }, { label: 'Vessel type', value: display(request.vessel.type) }, { label: 'Flag', value: display(request.vessel.flag) },
        { label: 'Gross tonnage', value: display(request.vessel.grossTonnage) }, { label: 'Length overall', value: display(request.vessel.lengthOverall, ' m') }, { label: 'Beam', value: display(request.vessel.beam, ' m') }, { label: 'Draft', value: display(request.vessel.draft, ' m') }, { label: 'Cargo description', value: display(request.vessel.cargoType) }, { label: 'Shipping agent', value: display(request.vessel.vesselAgent) },
      ]} /></InfoCard>
      <InfoCard title="Service requirements" icon={<ClipboardCheck size={17} />}><DetailGrid items={[
        { label: 'Service type', value: display(request.service.type) }, { label: 'Tugboats requested', value: request.service.tugboatsRequired }, { label: 'Preferred tug class', value: display(request.service.preferredTugClass) }, { label: 'Estimated duration', value: display(request.service.estimatedDuration) }, { label: 'Request source', value: display(request.requestSource) }, { label: 'Purchase-order reference', value: display(request.service.purchaseOrderReference) }, { label: 'Contract reference', value: display(request.service.contractReference) },
        { label: 'Service description', value: display(request.service.description) }, { label: 'Special instructions', value: display(request.operations.additionalInstructions) },
      ]} /></InfoCard>
      <InfoCard title="Schedule and location" icon={<MapPin size={17} />}><DetailGrid items={[
        { label: 'Requested date', value: formatDate(request.schedule.requestedDate) }, { label: 'Requested start time', value: formatTime(request.schedule.requestedTime) }, { label: 'Time zone', value: contact?.timeZone ?? 'Asia/Manila' }, { label: 'Port', value: display(request.schedule.portOrOperatingArea) }, { label: 'Berth or terminal', value: display(request.schedule.berthOrTerminal) }, { label: 'Origin', value: display(request.schedule.origin) }, { label: 'Destination', value: display(request.schedule.destination) }, { label: 'Estimated completion', value: request.schedule.estimatedCompletionDate ? `${formatDate(request.schedule.estimatedCompletionDate)} ${formatTime(request.schedule.estimatedCompletionTime)}` : 'Not provided' }, { label: 'Schedule flexibility', value: display(request.schedule.flexibility) }, { label: 'Alternate schedule', value: 'Not provided' },
      ]} /></InfoCard>
      <InfoCard title="Customer-provided operational information" icon={<AlertTriangle size={17} />}><p className="request-verification-note">Subject to verification by the Operations Department.</p><DetailGrid items={[
        { label: 'Nature of assistance', value: display(request.operations.natureOfAssistance) }, { label: 'Known hazards', value: display(request.operations.knownHazards) }, { label: 'Weather or tide concerns', value: display(request.operations.weatherOrTideConsiderations) }, { label: 'Safety requirements', value: display(request.operations.safetyRequirements) }, { label: 'Communication channel', value: display(request.operations.communicationChannel) }, { label: 'Required equipment', value: display(request.operations.specialTugRequirements) }, { label: 'Additional operational notes', value: display(request.operations.additionalInstructions) },
      ]} /></InfoCard>
    </div><aside className="request-overview-aside">
      <InfoCard title="Assignment and ownership" icon={<UserRoundCog size={17} />}><div className="request-owner"><span>{initials(request.assignedMarketingRepresentative)}</span><div><strong>{display(request.assignedMarketingRepresentative)}</strong><small>Marketing representative</small></div></div><DetailGrid items={[{ label: 'Created by', value: display(createdActivity?.actor.name) }, { label: 'Date created', value: formatDateTime(request.createdAt) }, { label: 'Last modified by', value: display(latestActivity?.actor.name) }, { label: 'Follow-up date', value: formatDate(request.followUpDate) }]} /><div className="request-tags">{request.internalTags.length ? request.internalTags.map((tag) => <span key={tag}>{tag}</span>) : <em>No tags</em>}</div>{actions.includes('assign') && <button className="button button-secondary request-card-button" onClick={() => handleAction('assign')}><UserRoundCog size={14} />Assign Representative</button>}</InfoCard>
      <InfoCard title="Request completeness" icon={<ClipboardCheck size={17} />}><div className="request-completeness"><div><strong>{completeness}%</strong><span>Request completeness</span></div><div className="request-progress"><span style={{ width: `${completeness}%` }} /></div><p>{completedChecklist} of {checklist.length} required sections completed</p><ul>{checklist.map(([label, complete]) => <li key={label} className={complete ? 'complete' : ''}>{complete ? <Check size={13} /> : <Circle size={11} />}{label}</li>)}</ul></div></InfoCard>
      <InfoCard title="Related records" icon={<FolderOpen size={17} />}><div className="request-related-records">
        <RelatedRecord label="Quotation" reference={quotation?.quotationNumber} status={quotation?.status} to={quotation ? `/marketing/quotations/${quotation.id}` : undefined} />
        <RelatedRecord label="Contract" reference={contract?.contractNumber} status={contract?.status} to={contract ? `/marketing/contracts/${contract.id}` : undefined} />
        <RelatedRecord label="Appointment" reference={appointment?.id} status={appointment?.status} to={appointment ? '/marketing/appointments' : undefined} />
        <RelatedRecord label="Invoice" />
        <RelatedRecord label="Customer" reference={customer?.id} status={customer?.status} to={`/marketing/customers/${request.customerId}`} />
      </div></InfoCard>
      <InfoCard title="Important dates" icon={<CalendarDays size={17} />}><dl className="request-important-dates"><DateItem label="Request submitted" value={request.createdAt} /><DateItem label="Operations submission" value={request.operationsReview?.submittedAt} /><DateItem label="Operations response" value={request.operationsReview?.reviewedAt} /><DateItem label="Quotation created" value={quotation?.createdAt} /><DateItem label="Customer approval" value={quotation?.response?.responseDate} /><DateItem label="Scheduled service date" value={request.status === 'Scheduled' ? request.schedule.requestedDate : undefined} /></dl></InfoCard>
    </aside></div>}

    {tab === 'operations' && <section className="request-tab-panel operations-review-panel" role="tabpanel" aria-labelledby="request-tab-operations"><header><div><span>Marketing visibility</span><h2>Operations Review</h2><p>Operational feasibility and resource decisions are recorded by Tug Operations and are read-only for Marketing.</p></div><OperationsReviewBadge status={reviewStatus(request)} /></header>{reviewStatus(request) === 'Not Submitted' ? <div className="request-tab-empty"><Send size={30} /><h3>Not submitted to Operations</h3><p>Complete the customer, vessel, service, schedule, and location information before submitting this request for operational review.</p>{actions.includes('submit') && <button className="button button-primary" onClick={() => handleAction('submit')}><Send size={14} />Submit to Operations</button>}</div> : <><DetailGrid items={[
      { label: 'Review status', value: <OperationsReviewBadge status={reviewStatus(request)} /> }, { label: 'Submitted by', value: display(request.operationsReview?.submittedBy) }, { label: 'Submission date and time', value: formatDateTime(request.operationsReview?.submittedAt) }, { label: 'Assigned Operations reviewer', value: display(request.operationsReview?.reviewedBy ?? request.requestedOperationsReviewer) }, { label: 'Review date', value: formatDateTime(request.operationsReview?.reviewedAt) }, { label: 'Feasibility result', value: reviewStatus(request) }, { label: 'Conditions or limitations', value: display(request.operationsReview?.conditions) }, { label: 'Requested additional information', value: display(request.operationsReview?.informationRequest) }, { label: 'Marketing response', value: display(request.operationsReview?.marketingResponse) }, { label: 'Operations notes shared with Marketing', value: display(request.operationsReview?.internalNotes) },
    ]} /><div className="operations-review-actions">{actions.includes('respond') && <button className="button button-primary" onClick={() => handleAction('respond')}><Send size={14} />Respond to Information Request</button>}<button className="button button-secondary" onClick={() => onNotify('Submitted request information is displayed in this panel.')}><FileText size={14} />View Submitted Information</button></div></>}</section>}

    {tab === 'documents' && <section className="request-tab-panel" role="tabpanel" aria-labelledby="request-tab-documents"><header className="request-panel-toolbar"><div><span>Linked records</span><h2>Documents</h2></div><Link className="button button-primary" to={`/marketing/customers/${request.customerId}?tab=documents`}><Plus size={14} />Add Document</Link></header><div className="request-document-filters"><label><Search size={14} /><span className="sr-only">Search documents</span><input value={documentSearch} placeholder="Search documents" onChange={(event) => setDocumentSearch(event.target.value)} /></label><select value={documentType} aria-label="Document type" onChange={(event) => setDocumentType(event.target.value as '' | DocumentType)}><option value="">All document types</option>{DOCUMENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>{filteredDocuments.length ? <div className="request-documents-table-wrap"><table className="request-documents-table"><thead><tr><th>Document</th><th>Type</th><th>File size</th><th>Uploaded by</th><th>Upload date</th><th>Visibility</th><th>Related record</th><th>Actions</th></tr></thead><tbody>{filteredDocuments.map((document) => { const version = document.versions.find((item) => item.version === document.currentVersion); return <tr key={document.id}><td><strong>{document.title}</strong><span>{version?.fileName}</span></td><td>{document.documentType}</td><td>{version ? bytes(version.sizeBytes) : 'Not provided'}</td><td>{version?.uploadedBy ?? document.createdBy}</td><td>{formatDate(version?.uploadedAt ?? document.createdAt)}</td><td>{document.visibility}</td><td>{request.referenceNumber}</td><td><div className="request-document-actions"><button disabled title="Preview unavailable for prototype metadata">Preview</button><button disabled title="Download unavailable for prototype metadata"><Download size={12} />Download</button><button onClick={() => onNotify('Document renaming is available from the customer Documents section.')}>Rename</button><button className="danger" onClick={() => { if (!window.confirm(`Remove ${document.title} from active documents?`)) return; customerDocumentRepository.archive(request.customerId, document.id, PROTOTYPE_DOCUMENT_USER.name); onNotify('Document archived.'); refresh() }}>Remove</button></div></td></tr> })}</tbody></table></div> : <div className="request-tab-empty"><Paperclip size={30} /><h3>No linked documents</h3><p>Add supporting records from the customer Documents section and link them to this Service Request.</p></div>}</section>}

    {tab === 'activity' && <section className="request-tab-panel" role="tabpanel" aria-labelledby="request-tab-activity"><header className="request-panel-toolbar"><div><span>Audit trail</span><h2>Activity Log</h2></div></header><div className="request-activity-tools"><div role="group" aria-label="Activity filter">{(['all', 'marketing', 'operations', 'customer', 'system'] as const).map((filter) => <button key={filter} className={activityFilter === filter ? 'active' : ''} onClick={() => setActivityFilter(filter)}>{filter === 'all' ? 'All Activities' : filter[0].toUpperCase() + filter.slice(1)}</button>)}</div><form onSubmit={(event) => { event.preventDefault(); if (!internalNote.trim()) return; serviceRequestRepository.addInternalNote(request.id, internalNote); setInternalNote(''); refresh(); onNotify('Internal note added.') }}><label><span>Internal — not visible to the customer</span><textarea value={internalNote} rows={2} placeholder="Add context for Marketing colleagues" onChange={(event) => setInternalNote(event.target.value)} /></label><button className="button button-secondary" type="submit" disabled={!internalNote.trim()}>Add Internal Note</button></form></div>{filteredActivities.length ? <ol className="request-activity-timeline">{filteredActivities.map((activity) => <ActivityItem key={activity.id} activity={activity} />)}</ol> : <div className="request-tab-empty"><ClipboardCheck size={30} /><h3>No matching activity</h3><p>Workflow changes and internal notes for this request will appear here.</p></div>}</section>}

    {dialog === 'assign' && <AssignRepresentativeDialog request={request} representatives={representatives} onClose={() => setDialog(null)} onConfirm={(name, notes) => confirmDialog(() => { serviceRequestRepository.assignRepresentative(request.id, name, notes); onNotify('Marketing representative updated.') })} />}
    {dialog === 'submit' && <SubmitOperationsDialog request={request} customerName={customer?.companyName ?? request.customerId} contactName={contact ? `${contact.firstName} ${contact.lastName}` : 'Contact unavailable'} attachmentsCount={documents.length} onClose={() => setDialog(null)} onConfirm={() => { if (submissionError) { setDialog(null); onNotify(submissionError); return } confirmDialog(() => { const updated = serviceRequestRepository.submitToOperations(request.id); onNotify(updated ? 'Service Request submitted to Tug Operations.' : 'The request is not eligible for Operations submission.') }) }} />}
    {dialog === 'respond' && <RespondOperationsDialog request={request} onClose={() => setDialog(null)} onConfirm={(response) => confirmDialog(() => { serviceRequestRepository.respondToInformationRequest(request.id, response); onNotify('Additional information submitted to Tug Operations.') })} />}
    {dialog === 'duplicate' && <DuplicateRequestDialog reference={request.referenceNumber} onClose={() => setDialog(null)} onConfirm={() => { const duplicate = serviceRequestRepository.duplicate(request.id); setDialog(null); if (duplicate) navigate(`/marketing/service-requests/${duplicate.id}`) }} />}
    {dialog === 'cancel' && <CancelRequestDialog onClose={() => setDialog(null)} onConfirm={(reason, explanation) => confirmDialog(() => { serviceRequestRepository.cancel(request.id, reason, explanation); onNotify('Service Request cancelled.') })} />}
  </main>
}

function RelatedRecord({ label, reference, status, to }: { label: string; reference?: string; status?: string; to?: string }) {
  return <div><span><FileText size={15} /></span><div><small>{label}</small><strong>{reference ?? 'Not created'}</strong>{status && <em>{status}</em>}</div>{to && <Link to={to}>View</Link>}</div>
}

function DateItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return <div><dt>{label}</dt><dd>{formatDateTime(value)}</dd></div>
}

function ActivityItem({ activity }: { activity: CustomerActivity }) {
  const Icon = activity.action === 'Created' ? Plus : activity.action === 'Assigned' ? UserRoundCog : activity.action === 'Cancelled' ? XCircle : activity.action === 'Submitted' ? Send : activity.action === 'Note Added' ? Pencil : ClipboardCheck
  return <li><span><Icon size={15} /></span><article><header><div><strong>{activity.action}</strong><p>{activity.description}</p></div><time dateTime={activity.occurredAt}>{formatDateTime(activity.occurredAt)}</time></header><footer><span>{activity.actor.name}{activity.actor.department ? ` · ${activity.actor.department}` : ''}</span>{activity.relatedRecord && <Link to={`/marketing/service-requests/${activity.relatedRecord.id}`}>{activity.relatedRecord.referenceNumber}</Link>}</footer>{activity.internalNote && <blockquote>Internal — not visible to the customer<br />{activity.internalNote}</blockquote>}</article></li>
}
