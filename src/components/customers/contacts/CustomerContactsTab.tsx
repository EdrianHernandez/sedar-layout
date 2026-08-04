import { CalendarDays, Clock3, Mail, MessageSquare, Phone, Plus, Search, UserPlus, Users } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { serviceRequestRepository } from '../../../repositories/serviceRequestRepository'
import { customerContactRepository } from '../../../repositories/customerContactRepository'
import type { Customer } from '../../../types/customer'
import type { ContactStatus, ContactType, CustomerContact, CustomerContactInput } from '../../../types/customerContact'
import { ContactActionsMenu } from './ContactActionsMenu'
import { AssignPrimaryContactDialog } from './AssignPrimaryContactDialog'
import { ContactStatusBadge, ContactTypeBadge } from './ContactBadges'
import { ContactConfirmDialog } from './ContactConfirmDialog'
import { ContactFormModal } from './ContactFormModal'
import { ViewContactDrawer } from './ViewContactDrawer'

interface Props { customer: Customer; onNotify: (message: string) => void }
type PendingConfirmation = { type: 'primary' | 'inactive'; contact: CustomerContact } | null
const displayDate = (value?: string) => value ? new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value.includes('T') ? value : `${value}T00:00:00`)) : 'Not contacted'

export function CustomerContactsTab({ customer, onNotify }: Props) {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState(() => customerContactRepository.getByCustomer(customer.id))
  const [search, setSearch] = useState(''); const deferredSearch = useDeferredValue(search)
  const [type, setType] = useState<ContactType | 'Primary' | ''>(''); const [department, setDepartment] = useState(''); const [status, setStatus] = useState<ContactStatus | ''>('')
  const [page, setPage] = useState(1); const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [viewContact, setViewContact] = useState<CustomerContact | null>(null); const [editContact, setEditContact] = useState<CustomerContact | null>(null); const [formOpen, setFormOpen] = useState(false); const [confirmation, setConfirmation] = useState<PendingConfirmation>(null)
  const [assignPrimaryOpen, setAssignPrimaryOpen] = useState(false)
  const primary = contacts.find((contact) => contact.isPrimary)
  const departments = [...new Set(contacts.map((contact) => contact.department).filter(Boolean) as string[])].sort()
  const normalized = deferredSearch.trim().toLowerCase()
  const filtered = contacts.filter((contact) => {
    const text = [contact.firstName, contact.middleName, contact.lastName, contact.position, contact.department, contact.email, contact.primaryPhone, contact.secondaryPhone].filter(Boolean).join(' ').toLowerCase()
    const typeMatch = !type || (type === 'Primary' ? contact.isPrimary : contact.contactTypes.includes(type))
    return (!normalized || text.includes(normalized)) && typeMatch && (!department || contact.department === department) && (!status || contact.status === status)
  })
  const totalPages = Math.ceil(filtered.length / 10); const shown = filtered.slice((page - 1) * 10, page * 10); const filtersActive = Boolean(search || type || department || status)
  const clear = () => { setSearch(''); setType(''); setDepartment(''); setStatus(''); setPage(1) }
  const refresh = () => setContacts(customerContactRepository.getByCustomer(customer.id))
  const fullName = (contact: CustomerContact) => [contact.firstName, contact.middleName, contact.lastName].filter(Boolean).join(' ')
  const notifySchedule = () => onNotify('Appointment scheduling will be implemented next.')
  const createRequest = (contact: CustomerContact) => navigate(`/marketing/service-requests/new?customerId=${customer.id}&contactId=${contact.id}`)
  const saveContact = (input: CustomerContactInput) => {
    if (editContact?.isPrimary && input.status === 'Inactive') {
      onNotify('A primary contact cannot be marked inactive. Assign another active contact as primary before deactivating this contact.')
      return
    }
    const now = new Date().toISOString()
    const contact: CustomerContact = editContact ? { ...editContact, ...input, updatedAt: now } : { ...input, id: `${customer.id}-CON-${String(Date.now()).slice(-6)}`, customerId: customer.id, createdAt: now, updatedAt: now, addedBy: 'SEDAR Marketing' }
    customerContactRepository.save(contact)
    if (input.isPrimary) customerContactRepository.setPrimary(customer.id, contact.id)
    refresh(); setFormOpen(false); setEditContact(null); setViewContact(null)
    onNotify(editContact ? 'Contact updated successfully.' : 'Contact added successfully.')
  }
  const confirm = () => {
    if (!confirmation) return
    if (confirmation.type === 'primary') { customerContactRepository.setPrimary(customer.id, confirmation.contact.id); onNotify('Primary contact updated successfully.') }
    else { customerContactRepository.save({ ...confirmation.contact, status: 'Inactive', updatedAt: new Date().toISOString() }); onNotify('Contact marked as inactive.') }
    refresh(); setConfirmation(null)
  }
  const toggleStatus = (contact: CustomerContact) => {
    if (contact.status === 'Inactive') { customerContactRepository.save({ ...contact, status: 'Active', updatedAt: new Date().toISOString() }); refresh(); onNotify('Contact marked as active.'); return }
    if (contact.isPrimary) { onNotify('A primary contact cannot be marked inactive. Assign another active contact as primary before deactivating this contact.'); return }
    setConfirmation({ type: 'inactive', contact })
  }
  const edit = (contact: CustomerContact) => { setViewContact(null); setEditContact(contact); setFormOpen(true) }
  return <div className="contacts-tab">
    <header className="contacts-tab-header"><h2>Contacts</h2><button className="button button-primary" type="button" onClick={() => { setEditContact(null); setFormOpen(true) }}><UserPlus size={15} />Add Contact</button></header>
    {primary ? <section className="primary-contact-card"><div className="primary-contact-label">Primary Contact</div><div className="primary-contact-main"><div className="primary-contact-profile"><span className="primary-contact-avatar">{primary.firstName[0]}{primary.lastName[0]}</span><div className="primary-contact-identity"><h3>{fullName(primary)}</h3><p>{primary.position} · {primary.department || 'Department not provided'}</p><div>{primary.contactTypes.map((item) => <ContactTypeBadge key={item} type={item} />)}<ContactStatusBadge status={primary.status} /></div></div></div><dl><div><dt><Mail size={11} />Email</dt><dd>{primary.email}</dd></div><div><dt><Phone size={11} />Phone</dt><dd>{primary.primaryPhone}</dd></div><div><dt><MessageSquare size={11} />Preferred Method</dt><dd>{primary.preferredContactMethod}</dd></div><div><dt><Clock3 size={11} />Last Contacted</dt><dd>{displayDate(primary.lastContactedAt)}</dd></div></dl><div className="primary-contact-actions"><button className="button button-secondary" type="button" onClick={() => onNotify('Email integration will be implemented later.')}><Mail size={15} />Send Email</button><button className="button button-secondary" type="button" onClick={notifySchedule}><CalendarDays size={15} />Schedule Appointment</button><ContactActionsMenu contact={primary} open={openMenu === `primary:${primary.id}`} onOpenChange={(open) => setOpenMenu(open ? `primary:${primary.id}` : null)} onView={() => setViewContact(primary)} onEdit={() => edit(primary)} onPrimary={() => {}} onRequest={() => createRequest(primary)} onSchedule={notifySchedule} onStatus={() => toggleStatus(primary)} /></div></div></section> : <section className="contact-empty primary-empty"><Users size={28} /><h3>No primary contact has been assigned.</h3><p>Assign a primary contact so Marketing knows who to coordinate with.</p>{contacts.some((item) => item.status === 'Active') && <button className="button button-secondary" type="button" onClick={() => setAssignPrimaryOpen(true)}>Assign Primary Contact</button>}</section>}
    <section className="contacts-directory panel"><div className="contact-filters"><label className="customer-search"><span className="sr-only">Search contacts</span><Search size={15} /><input value={search} placeholder="Search by name, position, email, or phone" onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></label><label><span className="sr-only">Contact type</span><select value={type} onChange={(event) => { setType(event.target.value as ContactType | 'Primary' | ''); setPage(1) }}><option value="">All Contact Types</option><option>Primary</option>{(['Commercial', 'Operations', 'Billing', 'Emergency', 'Authorized Signatory', 'Other'] as ContactType[]).map((item) => <option key={item}>{item}</option>)}</select></label><label><span className="sr-only">Department</span><select value={department} onChange={(event) => { setDepartment(event.target.value); setPage(1) }}><option value="">All Departments</option>{departments.map((item) => <option key={item}>{item}</option>)}</select></label><label><span className="sr-only">Status</span><select value={status} onChange={(event) => { setStatus(event.target.value as ContactStatus | ''); setPage(1) }}><option value="">All Statuses</option><option>Active</option><option>Inactive</option></select></label><button className="clear-filters" type="button" disabled={!filtersActive} onClick={clear}>Clear Filters</button></div>
      {!contacts.length ? <div className="contact-empty"><Users size={30} /><h3>No contacts have been added for this customer.</h3><p>Add a contact person so Marketing can coordinate service requests, quotations, contracts, and appointments.</p><button className="button button-primary" type="button" onClick={() => setFormOpen(true)}><Plus size={14} />Add Contact</button></div> : !filtered.length ? <div className="contact-empty"><Search size={30} /><h3>No contacts match your search or selected filters.</h3><button className="button button-secondary" type="button" onClick={clear}>Clear Filters</button></div> : <div className="contacts-table-scroll"><table className="contacts-table"><thead><tr><th scope="col">Contact</th><th scope="col">Contact Type</th><th scope="col">Department</th><th scope="col">Contact Details</th><th scope="col">Preferred Method</th><th scope="col">Last Contacted</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{shown.map((contact) => <tr key={contact.id}><td><div className="contact-name-cell"><span>{contact.firstName[0]}{contact.lastName[0]}</span><div><strong>{fullName(contact)}</strong><p>{contact.position}</p>{contact.isPrimary && <small>Primary</small>}</div></div></td><td><div className="contact-badges">{contact.contactTypes.map((item) => <ContactTypeBadge key={item} type={item} />)}</div></td><td>{contact.department || 'Not provided'}</td><td><div className="contact-details-cell"><span><Mail size={12} />{contact.email}</span><span><Phone size={12} />{contact.primaryPhone}</span></div></td><td>{contact.preferredContactMethod}</td><td>{displayDate(contact.lastContactedAt)}</td><td><ContactStatusBadge status={contact.status} /></td><td><ContactActionsMenu contact={contact} open={openMenu === `table:${contact.id}`} onOpenChange={(open) => setOpenMenu(open ? `table:${contact.id}` : null)} onView={() => setViewContact(contact)} onEdit={() => edit(contact)} onPrimary={() => setConfirmation({ type: 'primary', contact })} onRequest={() => createRequest(contact)} onSchedule={notifySchedule} onStatus={() => toggleStatus(contact)} /></td></tr>)}</tbody></table></div>}
      {totalPages > 1 && <footer className="contact-pagination"><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></footer>}
    </section>
    {formOpen && <ContactFormModal contact={editContact ?? undefined} existingContacts={contacts} onClose={() => { setFormOpen(false); setEditContact(null) }} onSave={saveContact} />}
    {viewContact && <ViewContactDrawer contact={viewContact} relatedRequests={serviceRequestRepository.getAll().filter((request) => request.contactId === viewContact.id).length} onClose={() => setViewContact(null)} onEdit={() => edit(viewContact)} onCreateRequest={() => createRequest(viewContact)} onSchedule={notifySchedule} />}
    {confirmation && <ContactConfirmDialog title={confirmation.type === 'primary' ? 'Change primary contact?' : 'Mark contact as inactive?'} message={confirmation.type === 'primary' ? `${primary ? fullName(primary) : 'The current contact'} will be replaced by ${fullName(confirmation.contact)} as the primary contact for ${customer.companyName}.` : 'This contact will remain in historical records but cannot be selected for new service requests or appointments.'} confirmLabel={confirmation.type === 'primary' ? 'Confirm Change' : 'Mark as Inactive'} destructive={confirmation.type === 'inactive'} onCancel={() => setConfirmation(null)} onConfirm={confirm} />}
    {assignPrimaryOpen && <AssignPrimaryContactDialog contacts={contacts.filter((contact) => contact.status === 'Active')} onClose={() => setAssignPrimaryOpen(false)} onSelect={(contact) => { customerContactRepository.setPrimary(customer.id, contact.id); refresh(); setAssignPrimaryOpen(false); onNotify('Primary contact updated successfully.') }} />}
  </div>
}
