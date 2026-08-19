import { BriefcaseBusiness, Building2, CalendarClock, Check, ChevronLeft, ChevronRight, FileText, Paperclip, Save, Send, ShieldCheck, Ship, Trash2, UploadCloud } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { DiscardChangesDialog } from '../../components/service-requests/DiscardChangesDialog'
import { CustomerStatusBadge } from '../../components/customers/CustomerStatusBadge'
import { initialCustomers } from '../../data/customerMockData'
import { SERVICE_PRIORITIES, SERVICE_TYPES } from '../../data/serviceRequestOptions'
import { customerContactRepository } from '../../repositories/customerContactRepository'
import { serviceRequestRepository } from '../../repositories/serviceRequestRepository'
import type { ServicePriority, ServiceRequest, ServiceRequestStatus } from '../../types/serviceRequest'
import { generateServiceRequestReference } from '../../utils/generateServiceRequestReference'

interface NewServiceRequestPageProps { onNotify: (message: string) => void }
type FormState = Record<string, string>
type Errors = Record<string, string>

const vesselTypes = ['Cargo Ship', 'Container Ship', 'Bulk Carrier', 'Tanker', 'Passenger Vessel', 'Barge', 'Fishing Vessel', 'Offshore Vessel', 'Other']
const requestSources = ['Customer Inquiry', 'Phone Call', 'Email', 'Walk-in', 'Referral', 'Existing Contract', 'Other']
const flexibilityOptions = ['Fixed Schedule', 'Flexible by 1 Hour', 'Flexible by 3 Hours', 'Flexible Within the Day', 'To Be Confirmed']
const priorities: ServicePriority[] = SERVICE_PRIORITIES
const representatives = [...new Set(initialCustomers.map((customer) => customer.assignedRepresentative))].sort()
const today = new Date().toISOString().slice(0, 10)

const emptyForm = (customerId = '', requestedContactId = ''): FormState => {
  const customer = initialCustomers.find((item) => item.id === customerId)
  const activeContacts = customer ? customerContactRepository.getByCustomer(customer.id).filter((contact) => contact.status === 'Active') : []
  const selectedContact = activeContacts.find((contact) => contact.id === requestedContactId) ?? activeContacts.find((contact) => contact.isPrimary) ?? activeContacts[0]
  return { customerId: customer?.id ?? '', contactId: selectedContact?.id ?? '', requestSource: 'Customer Inquiry', vesselName: '', imoNumber: '', vesselType: '', flag: '', grossTonnage: '', lengthOverall: '', beam: '', draft: '', cargoType: '', vesselAgent: '', serviceType: '', tugboatsRequired: '1', preferredTugClass: '', estimatedDuration: '', contractReference: '', purchaseOrderReference: '', serviceDescription: '', requestedDate: '', requestedTime: '', portOrOperatingArea: '', berthOrTerminal: '', origin: '', destination: '', completionDate: '', completionTime: '', flexibility: 'Fixed Schedule', natureOfAssistance: '', specialTugRequirements: '', safetyRequirements: '', knownHazards: '', weatherTide: '', communicationChannel: '', additionalInstructions: '', priority: 'Normal', assignedRepresentative: customer?.assignedRepresentative ?? '', operationsReviewer: '', internalTags: '', internalNotes: '', followUpDate: '' }
}

interface FieldProps { name: string; label: string; value: string; error?: string; required?: boolean; type?: string; min?: string; step?: string; placeholder?: string; wide?: boolean; options?: string[]; rows?: number; onChange: (name: string, value: string) => void }
function RequestField({ name, label, value, error, required, type = 'text', min, step, placeholder, wide, options, rows, onChange }: FieldProps) {
  const id = `sr-${name}`
  return <label className={`request-field${wide ? ' request-field-wide' : ''}`} htmlFor={id}><span>{label}{required && <em aria-hidden="true"> *</em>}</span>{rows ? <textarea id={id} rows={rows} value={value} placeholder={placeholder} aria-required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={(event) => onChange(name, event.target.value)} /> : options ? <select id={id} value={value} aria-required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={(event) => onChange(name, event.target.value)}><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option}>{option}</option>)}</select> : <input id={id} type={type} min={min} step={step} value={value} placeholder={placeholder} aria-required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={(event) => onChange(name, event.target.value)} />}{error && <small id={`${id}-error`}>{error}</small>}</label>
}

function RequestSection({ icon: Icon, title, description, children }: { icon: typeof Building2; title: string; description: string; children: ReactNode }) {
  return <fieldset className="request-section"><legend className="sr-only">{title}</legend><div className="request-section-header"><span className="request-section-icon"><Icon size={18} /></span><span className="request-section-heading"><strong>{title}</strong><span>{description}</span></span></div>{children}</fieldset>
}

export function NewServiceRequestPage({ onNotify }: NewServiceRequestPageProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const originCustomerId = searchParams.get('customerId') ?? ''
  const requestedContactId = searchParams.get('contactId') ?? ''
  const originCustomer = initialCustomers.find((customer) => customer.id === originCustomerId)
  const [form, setForm] = useState<FormState>(() => emptyForm(originCustomerId, requestedContactId))
  const [customerSearch, setCustomerSearch] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [formMessage, setFormMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [dirty, setDirty] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const selectedCustomer = initialCustomers.find((customer) => customer.id === form.customerId)
  const activeContacts = selectedCustomer ? customerContactRepository.getByCustomer(selectedCustomer.id).filter((item) => item.status === 'Active') : []
  const contact = activeContacts.find((item) => item.id === form.contactId)
  const cancelTarget = originCustomer ? `/marketing/customers/${originCustomer.id}` : '/marketing/service-requests'
  const steps = [
    { icon: Building2, title: 'Customer Information', description: 'Select the requesting customer and primary contact.' },
    { icon: Ship, title: 'Vessel Information', description: 'Record vessel identity, dimensions, and operating particulars.' },
    { icon: FileText, title: 'Service Details', description: 'Describe the tug service and commercial references.' },
    { icon: CalendarClock, title: 'Schedule and Location', description: 'Define the requested operating window and movement locations.' },
    { icon: ShieldCheck, title: 'Operational Requirements', description: 'Capture assistance, safety, hazards, and operating instructions.' },
    { icon: Paperclip, title: 'Supporting Documents', description: 'Select prototype attachments for request review.' },
    { icon: BriefcaseBusiness, title: 'Internal Assignment', description: 'Marketing-only ownership and follow-up information.' },
  ]

  const update = (name: string, value: string) => {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => { const next = { ...current }; delete next[name]; return next })
    setDirty(true)
  }
  const chooseCustomer = (value: string) => {
    setCustomerSearch(value)
    const normalized = value.toLowerCase()
    const customer = initialCustomers.find((item) => item.id.toLowerCase() === normalized || item.companyName.toLowerCase() === normalized || `${item.companyName} (${item.id})`.toLowerCase() === normalized)
    if (!customer) return
    const contacts = customerContactRepository.getByCustomer(customer.id).filter((item) => item.status === 'Active')
    const selected = contacts.find((item) => item.isPrimary) ?? contacts[0]
    setForm((current) => ({ ...current, customerId: customer.id, contactId: selected?.id ?? '', assignedRepresentative: customer.assignedRepresentative }))
    setErrors((current) => { const next = { ...current }; delete next.customerId; delete next.contactId; delete next.assignedRepresentative; return next })
    setDirty(true)
  }
  const changeCustomer = () => { setForm((current) => ({ ...current, customerId: '', contactId: '', assignedRepresentative: '' })); setCustomerSearch(''); setDirty(true) }

  const validate = (mode: 'draft' | 'review') => {
    const next: Errors = {}
    if (!form.customerId) next.customerId = 'Customer is required.'
    if (!form.assignedRepresentative) next.assignedRepresentative = 'Assigned Marketing representative is required.'
    const vesselDependent = [form.imoNumber, form.vesselType, form.flag, form.grossTonnage, form.lengthOverall, form.beam, form.draft, form.cargoType, form.vesselAgent].some(Boolean)
    if ((mode === 'review' || vesselDependent) && !form.vesselName.trim()) next.vesselName = 'Vessel name is required.'
    if (mode === 'review') {
      if (!form.contactId) next.contactId = 'Contact person is required.'
      if (!form.vesselType) next.vesselType = 'Vessel type is required.'
      if (!form.serviceType) next.serviceType = 'Service type is required.'
      if (!form.tugboatsRequired || Number(form.tugboatsRequired) < 1 || !Number.isInteger(Number(form.tugboatsRequired))) next.tugboatsRequired = 'At least one tugboat is required.'
      if (!form.requestedDate) next.requestedDate = 'Requested service date is required.'
      if (!form.requestedTime) next.requestedTime = 'Requested start time is required.'
      if (!form.portOrOperatingArea.trim()) next.portOrOperatingArea = 'Port or operating area is required.'
      if (!form.serviceDescription.trim()) next.serviceDescription = 'Service description is required.'
    }
    if (form.requestedDate && form.requestedDate < today) next.requestedDate = 'Requested service date cannot be earlier than today.'
    if (form.completionDate && form.requestedDate && form.completionDate < form.requestedDate) next.completionDate = 'Completion date cannot be earlier than the requested date.'
    for (const field of ['grossTonnage', 'lengthOverall', 'beam', 'draft']) if (form[field] && Number(form[field]) < 0) next[field] = 'Value cannot be negative.'
    setErrors(next)
    if (Object.keys(next).length) {
      setFormMessage('Please review the highlighted required fields.')
      window.setTimeout(() => document.getElementById(`sr-${Object.keys(next)[0]}`)?.focus(), 0)
      return false
    }
    setFormMessage('')
    return true
  }

  const createRequest = (status: ServiceRequestStatus) => {
    const mode = status === 'Draft' ? 'draft' : 'review'
    if (!validate(mode)) return
    const existing = serviceRequestRepository.getAll()
    const referenceNumber = generateServiceRequestReference(existing)
    const now = new Date().toISOString()
    const optionalNumber = (value: string) => value === '' ? undefined : Number(value)
    const request: ServiceRequest = {
      id: `REQ-${referenceNumber}`, referenceNumber, customerId: form.customerId, contactId: form.contactId, requestSource: form.requestSource,
      vessel: { name: form.vesselName.trim(), imoNumber: form.imoNumber || undefined, type: form.vesselType, flag: form.flag || undefined, grossTonnage: optionalNumber(form.grossTonnage), lengthOverall: optionalNumber(form.lengthOverall), beam: optionalNumber(form.beam), draft: optionalNumber(form.draft), cargoType: form.cargoType || undefined, vesselAgent: form.vesselAgent || undefined },
      service: { type: form.serviceType, tugboatsRequired: Number(form.tugboatsRequired) || 1, preferredTugClass: form.preferredTugClass || undefined, estimatedDuration: form.estimatedDuration || undefined, contractReference: form.contractReference || undefined, purchaseOrderReference: form.purchaseOrderReference || undefined, description: form.serviceDescription.trim() },
      schedule: { requestedDate: form.requestedDate, requestedTime: form.requestedTime, portOrOperatingArea: form.portOrOperatingArea.trim(), berthOrTerminal: form.berthOrTerminal || undefined, origin: form.origin || undefined, destination: form.destination || undefined, estimatedCompletionDate: form.completionDate || undefined, estimatedCompletionTime: form.completionTime || undefined, flexibility: form.flexibility },
      operations: { natureOfAssistance: form.natureOfAssistance || undefined, specialTugRequirements: form.specialTugRequirements || undefined, safetyRequirements: form.safetyRequirements || undefined, knownHazards: form.knownHazards || undefined, weatherOrTideConsiderations: form.weatherTide || undefined, communicationChannel: form.communicationChannel || undefined, additionalInstructions: form.additionalInstructions || undefined },
      priority: form.priority as ServicePriority, assignedMarketingRepresentative: form.assignedRepresentative, requestedOperationsReviewer: form.operationsReviewer || undefined, internalTags: form.internalTags.split(',').map((tag) => tag.trim()).filter(Boolean), internalNotes: form.internalNotes || undefined, followUpDate: form.followUpDate || undefined, status, operationsReview: { status: 'Not Submitted' }, createdAt: now, updatedAt: now,
    }
    serviceRequestRepository.save(request)
    setDirty(false)
    onNotify(status === 'Draft' ? 'Service request saved as draft.' : 'Service request submitted for operational review.')
    navigate(`/marketing/service-requests/${request.id}`)
  }

  const cancel = () => dirty ? setDiscardOpen(true) : navigate(cancelTarget)
  const goNext = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1))
  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 0))
  const addFiles = (list: FileList | null) => {
    if (!list) return
    const selected = Array.from(list)
    const accepted = selected.filter((file) => /\.(pdf|jpe?g|png|docx)$/i.test(file.name))
    if (accepted.length !== selected.length) onNotify('Only PDF, JPG, PNG, and DOCX files can be selected.')
    if (accepted.length) { setFiles((current) => [...current, ...accepted]); setDirty(true) }
  }

  return <div className="new-request-page">
    <nav className="request-breadcrumb" aria-label="Breadcrumb"><ol>{originCustomer ? <><li><Link to="/marketing/customers">Customers</Link></li><li><ChevronRight size={12} /></li><li><Link to={`/marketing/customers/${originCustomer.id}`}>{originCustomer.companyName}</Link></li></> : <li><Link to="/marketing/service-requests">Service Requests</Link></li>}<li><ChevronRight size={12} /></li><li aria-current="page">New Service Request</li></ol></nav>
    <header className="request-page-header"><div><span className="new-request-badge">Service Request</span><h1>New Service Request</h1><p>Create a tug-service request for customer evaluation and operational review.</p></div></header>
    {formMessage && <div className="request-form-alert" role="alert">{formMessage}</div>}
    <div className="request-steps" aria-label="Form steps">{steps.map((step, index) => { const StepIcon = step.icon; const isCompleted = index < currentStep; const isActive = index === currentStep; return <button key={step.title} type="button" className={`request-step${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}`} onClick={() => setCurrentStep(index)} aria-current={isActive ? 'step' : undefined}><span className="request-step-number">{isCompleted ? <Check size={14} /> : <StepIcon size={14} />}</span><span className="request-step-label">{step.title}</span></button> })}</div>
    <form onSubmit={(event: FormEvent) => { event.preventDefault(); createRequest('Under Review') }} noValidate>
      {currentStep === 0 && <RequestSection icon={Building2} title="Customer Information" description="Select the requesting customer and primary contact."><div className="request-form-grid">
        <div className="request-field request-field-wide"><span>Customer <em>*</em></span>{selectedCustomer ? <div className="selected-customer"><span>{selectedCustomer.companyInitials}</span><div><strong>{selectedCustomer.companyName}</strong><p>{selectedCustomer.id} · {selectedCustomer.customerType}</p></div><CustomerStatusBadge status={selectedCustomer.status} /><button type="button" onClick={changeCustomer}>Change Customer</button></div> : <><input id="sr-customerId" list="customer-options" value={customerSearch} placeholder="Search by company name or customer ID" aria-invalid={Boolean(errors.customerId)} aria-describedby={errors.customerId ? 'sr-customerId-error' : undefined} onChange={(event) => chooseCustomer(event.target.value)} /><datalist id="customer-options">{initialCustomers.map((customer) => <option key={customer.id} value={`${customer.companyName} (${customer.id})`} />)}</datalist>{errors.customerId && <small id="sr-customerId-error">{errors.customerId}</small>}</>}</div>
        <div id="sr-contactId" className="request-field request-field-wide" tabIndex={-1}><span>Contact Person <em>*</em></span>{contact ? <><select className="request-contact-select" value={form.contactId} aria-invalid={Boolean(errors.contactId)} aria-describedby={errors.contactId ? 'sr-contactId-error' : undefined} onChange={(event) => update('contactId', event.target.value)}>{activeContacts.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName} — {item.position}</option>)}</select><div className="selected-contact"><span>{contact.firstName[0]}{contact.lastName[0]}</span><div><strong>{contact.firstName} {contact.lastName}</strong><p>{contact.position} · {contact.email} · {contact.primaryPhone}</p></div></div></> : <div className="missing-contact"><p>No contact person is available for this customer.<br />Add a customer contact before submitting the request.</p><button type="button" onClick={() => onNotify('Customer contact creation will be implemented next.')}>Add Contact Later</button></div>}{errors.contactId && <small id="sr-contactId-error">{errors.contactId}</small>}</div>
        <RequestField name="requestSource" label="Request Source" value={form.requestSource} options={requestSources} onChange={update} />
      </div></RequestSection>}

      {currentStep === 1 && <RequestSection icon={Ship} title="Vessel Information" description="Record vessel identity, dimensions, and operating particulars."><div className="request-form-grid">
        <RequestField name="vesselName" label="Vessel Name" value={form.vesselName} error={errors.vesselName} required onChange={update} /><RequestField name="imoNumber" label="IMO Number" value={form.imoNumber} onChange={update} /><RequestField name="vesselType" label="Vessel Type" value={form.vesselType} error={errors.vesselType} required options={vesselTypes} onChange={update} /><RequestField name="flag" label="Flag or Country of Registry" value={form.flag} onChange={update} /><RequestField name="grossTonnage" label="Gross Tonnage" value={form.grossTonnage} error={errors.grossTonnage} type="number" min="0" onChange={update} /><RequestField name="lengthOverall" label="Length Overall (meters)" value={form.lengthOverall} error={errors.lengthOverall} type="number" min="0" step="0.01" onChange={update} /><RequestField name="beam" label="Beam (meters)" value={form.beam} error={errors.beam} type="number" min="0" step="0.01" onChange={update} /><RequestField name="draft" label="Current Draft (meters)" value={form.draft} error={errors.draft} type="number" min="0" step="0.01" onChange={update} /><RequestField name="cargoType" label="Cargo Type" value={form.cargoType} onChange={update} /><RequestField name="vesselAgent" label="Vessel Agent" value={form.vesselAgent} onChange={update} />
      </div></RequestSection>}

      {currentStep === 2 && <RequestSection icon={FileText} title="Service Details" description="Describe the tug service and commercial references."><div className="request-form-grid">
        <RequestField name="serviceType" label="Service Type" value={form.serviceType} error={errors.serviceType} required options={SERVICE_TYPES} onChange={update} /><RequestField name="tugboatsRequired" label="Number of Tugboats Required" value={form.tugboatsRequired} error={errors.tugboatsRequired} required type="number" min="1" step="1" onChange={update} /><RequestField name="preferredTugClass" label="Preferred Tugboat or Tug Class" value={form.preferredTugClass} onChange={update} /><RequestField name="estimatedDuration" label="Estimated Service Duration" value={form.estimatedDuration} onChange={update} /><RequestField name="contractReference" label="Contract Reference" value={form.contractReference} onChange={update} /><RequestField name="purchaseOrderReference" label="Customer Purchase Order Reference" value={form.purchaseOrderReference} onChange={update} /><RequestField name="serviceDescription" label="Service Description" value={form.serviceDescription} error={errors.serviceDescription} required wide rows={4} placeholder="Describe the requested tug service and expected assistance." onChange={update} />
      </div></RequestSection>}

      {currentStep === 3 && <RequestSection icon={CalendarClock} title="Schedule and Location" description="Define the requested operating window and movement locations."><div className="request-form-grid">
        <RequestField name="requestedDate" label="Requested Service Date" value={form.requestedDate} error={errors.requestedDate} required type="date" min={today} onChange={update} /><RequestField name="requestedTime" label="Requested Start Time" value={form.requestedTime} error={errors.requestedTime} required type="time" onChange={update} /><RequestField name="portOrOperatingArea" label="Port or Operating Area" value={form.portOrOperatingArea} error={errors.portOrOperatingArea} required onChange={update} /><RequestField name="berthOrTerminal" label="Berth or Terminal" value={form.berthOrTerminal} onChange={update} /><RequestField name="origin" label="Origin" value={form.origin} onChange={update} /><RequestField name="destination" label="Destination" value={form.destination} onChange={update} /><RequestField name="completionDate" label="Estimated Completion Date" value={form.completionDate} error={errors.completionDate} type="date" min={form.requestedDate || today} onChange={update} /><RequestField name="completionTime" label="Estimated Completion Time" value={form.completionTime} type="time" onChange={update} /><RequestField name="flexibility" label="Schedule Flexibility" value={form.flexibility} options={flexibilityOptions} onChange={update} />
      </div></RequestSection>}

      {currentStep === 4 && <RequestSection icon={ShieldCheck} title="Operational Requirements" description="Capture assistance, safety, hazards, and operating instructions."><div className="request-form-grid">
        <RequestField name="priority" label="Priority" value={form.priority} required options={priorities} onChange={update} /><div className={`priority-description priority-${form.priority.toLowerCase()}`}><strong>{form.priority}</strong><span>{form.priority === 'Normal' ? 'Standard scheduling' : form.priority === 'High' ? 'Requires prompt review' : form.priority === 'Urgent' ? 'Time-sensitive request' : 'Immediate operational attention'}</span></div>{form.priority === 'Emergency' && <div className="emergency-warning" role="status">Emergency requests require immediate confirmation with Tug Operations.</div>}
        <RequestField name="natureOfAssistance" label="Nature of Assistance" value={form.natureOfAssistance} wide rows={3} onChange={update} /><RequestField name="specialTugRequirements" label="Special Tug Requirements" value={form.specialTugRequirements} wide rows={3} onChange={update} /><RequestField name="safetyRequirements" label="Safety Requirements" value={form.safetyRequirements} rows={3} onChange={update} /><RequestField name="knownHazards" label="Known Hazards" value={form.knownHazards} rows={3} onChange={update} /><RequestField name="weatherTide" label="Weather or Tide Considerations" value={form.weatherTide} rows={3} onChange={update} /><RequestField name="communicationChannel" label="Communication Channel" value={form.communicationChannel} onChange={update} /><RequestField name="additionalInstructions" label="Additional Instructions" value={form.additionalInstructions} wide rows={3} onChange={update} />
      </div></RequestSection>}

      {currentStep === 5 && <RequestSection icon={Paperclip} title="Supporting Documents" description="Select prototype attachments for request review."><div className="attachment-prototype-note">Prototype-only attachment selection. Files are not uploaded or stored.</div><label className="attachment-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files) }}><UploadCloud size={28} /><strong>Drag files here or choose files</strong><span>PDF, JPG, PNG, DOCX</span><small>Suggested: vessel particulars, towage plan, port instructions, purchase order, or photographs.</small><input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.docx" onChange={(event) => addFiles(event.target.files)} /></label>{files.length > 0 && <ul className="attachment-list">{files.map((file, index) => <li key={`${file.name}-${index}`}><FileText size={15} /><div><strong>{file.name}</strong><span>{file.type || 'Unknown type'} · {(file.size / 1024).toFixed(1)} KB</span></div><button type="button" aria-label={`Remove ${file.name}`} onClick={() => { setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index)); setDirty(true) }}><Trash2 size={15} /></button></li>)}</ul>}</RequestSection>}

      {currentStep === 6 && <RequestSection icon={BriefcaseBusiness} title="Internal Assignment" description="Marketing-only ownership and follow-up information."><div className="internal-request-label">Internal – Not visible to the customer</div><div className="request-form-grid"><RequestField name="assignedRepresentative" label="Assigned Marketing Representative" value={form.assignedRepresentative} error={errors.assignedRepresentative} required options={representatives} onChange={update} /><RequestField name="operationsReviewer" label="Requested Operations Reviewer" value={form.operationsReviewer} onChange={update} /><RequestField name="internalTags" label="Internal Tags" value={form.internalTags} placeholder="Separate tags with commas" onChange={update} /><RequestField name="followUpDate" label="Follow-up Date" value={form.followUpDate} type="date" onChange={update} /><RequestField name="internalNotes" label="Internal Notes" value={form.internalNotes} wide rows={4} onChange={update} /></div></RequestSection>}

      <footer className="request-form-actions"><div className="request-action-summary"><p>Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}</p></div><div className="request-action-controls"><button className="button request-cancel-button" type="button" onClick={cancel}>Cancel</button>{currentStep > 0 && <button className="button button-secondary" type="button" onClick={goPrev}><ChevronLeft size={14} />Previous</button>}{currentStep < steps.length - 1 ? <button className="button button-primary" type="button" onClick={goNext}>Next<ChevronRight size={14} /></button> : <><button className="button button-secondary" type="button" onClick={() => createRequest('Draft')}><Save size={14} />Save as Draft</button><button className="button button-primary" type="submit"><Send size={14} />Submit for Review</button></>}</div></footer>
    </form>
    {discardOpen && <DiscardChangesDialog onContinue={() => setDiscardOpen(false)} onDiscard={() => navigate(cancelTarget)} />}
  </div>
}
