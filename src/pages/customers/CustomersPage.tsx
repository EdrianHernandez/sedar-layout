import { BellRing, Download, Plus, Search, UserCheck, UserPlus, Users } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AddCustomerModal } from '../../components/customers/AddCustomerModal'
import { CustomerActionsMenu } from '../../components/customers/CustomerActionsMenu'
import { CustomerStatusBadge } from '../../components/customers/CustomerStatusBadge'
import { MetricCard } from '../../components/dashboard/MetricCard'
import { customerStatuses, customerTypes, initialCustomers } from '../../data/customerMockData'
import type { Customer, CustomerStatus, CustomerType, NewCustomerInput } from '../../types/customer'
import { serviceRequestRepository } from '../../repositories/serviceRequestRepository'

interface CustomersPageProps { onNotify: (message: string) => void }

const formatDate = (date: string) => new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`))

export function CustomersPage({ onNotify }: CustomersPageProps) {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [status, setStatus] = useState<CustomerStatus | ''>('')
  const [type, setType] = useState<CustomerType | ''>('')
  const [representative, setRepresentative] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const representatives = [...new Set(customers.map((customer) => customer.assignedRepresentative).filter((name) => name && name !== 'Unassigned'))].sort()
  const normalizedSearch = deferredSearch.trim().toLowerCase()
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = !normalizedSearch || [customer.id, customer.companyName, customer.primaryContact.name, customer.primaryContact.email].some((value) => value.toLowerCase().includes(normalizedSearch))
    return matchesSearch && (!status || customer.status === status) && (!type || customer.customerType === type) && (!representative || customer.assignedRepresentative === representative)
  })
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * rowsPerPage
  const visibleCustomers = filteredCustomers.slice(startIndex, startIndex + rowsPerPage)
  const filtersActive = Boolean(search || status || type || representative)
  const activeRequestCounts = serviceRequestRepository.getAll().reduce((counts, request) => {
    if (!['Completed', 'Cancelled'].includes(request.status)) counts.set(request.customerId, (counts.get(request.customerId) ?? 0) + 1)
    return counts
  }, new Map<string, number>())

  const updateFilter = (update: () => void) => { update(); setPage(1) }
  const clearFilters = () => {
    setSearch(''); setStatus(''); setType(''); setRepresentative(''); setPage(1)
  }

  const addCustomer = (input: NewCustomerInput) => {
    const nextNumber = customers.reduce((highest, customer) => Math.max(highest, Number(customer.id.replace(/\D/g, '')) || 0), 0) + 1
    const initials = input.companyName.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0].toUpperCase()).join('')
    const customer: Customer = {
      id: `CUS-${String(nextNumber).padStart(3, '0')}`,
      companyName: input.companyName.trim(),
      companyInitials: initials,
      primaryContact: { name: `${input.firstName.trim()} ${input.lastName.trim()}`, position: input.position.trim(), email: input.contactEmail.trim(), phone: input.contactPhone.trim() },
      customerType: input.customerType,
      activeRequests: 0,
      activeContracts: 0,
      lastInteraction: new Date().toISOString().slice(0, 10),
      status: input.status,
      assignedRepresentative: input.assignedRepresentative || 'Unassigned',
      needsFollowUp: false,
    }
    setCustomers((current) => [customer, ...current])
    setModalOpen(false)
    setPage(1)
    onNotify('Customer added successfully.')
  }

  return (
    <div className="customers-page">
      <header className="dashboard-header">
        <div><h1>Customers</h1><p>Manage customer accounts, contacts, and service relationships.</p></div>
        <div className="header-actions">
          <button className="button button-primary" type="button" onClick={() => setModalOpen(true)}><Plus size={15} />Add Customer</button>
          <button className="button button-secondary" type="button" onClick={() => onNotify('Customer export will be available later.')}><Download size={15} />Export</button>
        </div>
      </header>

      <section className="metrics-grid customer-metrics" aria-label="Customer metrics">
        <MetricCard label="TOTAL CUSTOMERS" value={customers.length} icon={Users} />
        <MetricCard label="ACTIVE CUSTOMERS" value={customers.filter((customer) => customer.status === 'Active').length} icon={UserCheck} />
        <MetricCard label="PROSPECTIVE CUSTOMERS" value={customers.filter((customer) => customer.status === 'Prospect').length} icon={UserPlus} />
        <MetricCard label="NEEDS FOLLOW-UP" value={customers.filter((customer) => customer.needsFollowUp).length} icon={BellRing} />
      </section>

      <section className="panel customer-directory" aria-labelledby="customer-directory-title">
        <header className="customer-panel-header"><h2 id="customer-directory-title">Customer Directory</h2></header>
        <div className="customer-filters">
          <label className="customer-search"><span className="sr-only">Search customers</span><Search size={15} aria-hidden="true" /><input value={search} placeholder="Search by company, contact, email, or customer ID" onChange={(event) => updateFilter(() => setSearch(event.target.value))} /></label>
          <label><span className="sr-only">Account status</span><select value={status} onChange={(event) => updateFilter(() => setStatus(event.target.value as CustomerStatus | ''))}><option value="">All Statuses</option>{customerStatuses.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label><span className="sr-only">Customer type</span><select value={type} onChange={(event) => updateFilter(() => setType(event.target.value as CustomerType | ''))}><option value="">All Customer Types</option>{customerTypes.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label><span className="sr-only">Assigned representative</span><select value={representative} onChange={(event) => updateFilter(() => setRepresentative(event.target.value))}><option value="">All Representatives</option>{representatives.map((option) => <option key={option}>{option}</option>)}</select></label>
          <button className="clear-filters" type="button" disabled={!filtersActive} onClick={clearFilters}>Clear Filters</button>
        </div>

        {customers.length === 0 ? (
          <div className="customer-empty"><Users size={32} /><strong>No customers have been added yet.</strong><p>Add your first customer to begin managing service relationships.</p><button className="button button-primary" type="button" onClick={() => setModalOpen(true)}><Plus size={15} />Add Customer</button></div>
        ) : filteredCustomers.length === 0 ? (
          <div className="customer-empty"><Search size={32} /><strong>No customers match your search or selected filters.</strong><button className="button button-secondary" type="button" onClick={clearFilters}>Clear Filters</button></div>
        ) : (
          <div className="customer-table-scroll">
            <table className="customer-table">
              <thead><tr><th scope="col">Customer ID</th><th scope="col">Company</th><th scope="col">Primary Contact</th><th scope="col">Customer Type</th><th scope="col" className="number-column">Active Requests</th><th scope="col" className="number-column">Active Contracts</th><th scope="col">Last Interaction</th><th scope="col">Status</th><th scope="col" className="actions-column">Actions</th></tr></thead>
              <tbody>{visibleCustomers.map((customer) => <tr key={customer.id} className="clickable-customer-row" tabIndex={0} onClick={(event) => { if (!(event.target as HTMLElement).closest('a, button')) navigate(`/marketing/customers/${customer.id}`) }} onKeyDown={(event) => { if (event.key === 'Enter' && !(event.target as HTMLElement).closest('a, button')) navigate(`/marketing/customers/${customer.id}`) }}>
                <td className="customer-id">{customer.id}</td>
                <td><div className="company-cell"><span className="company-avatar">{customer.companyInitials}</span><Link to={`/marketing/customers/${customer.id}`} state={{ companyName: customer.companyName }}>{customer.companyName}</Link></div></td>
                <td><strong>{customer.primaryContact.name}</strong><span>{customer.primaryContact.position || 'Primary contact'}</span></td>
                <td>{customer.customerType}</td><td className="number-column">{activeRequestCounts.get(customer.id) ?? 0}</td><td className="number-column">{customer.activeContracts}</td><td>{formatDate(customer.lastInteraction)}</td><td><CustomerStatusBadge status={customer.status} /></td>
                <td className="actions-column"><CustomerActionsMenu customer={customer} open={openMenu === customer.id} onToggle={() => setOpenMenu((current) => current === customer.id ? null : customer.id)} onClose={() => setOpenMenu(null)} onNotify={onNotify} /></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}

        <footer className="customer-pagination">
          <span>{filteredCustomers.length ? `Showing ${startIndex + 1}–${Math.min(startIndex + rowsPerPage, filteredCustomers.length)} of ${filteredCustomers.length} customers` : 'Showing 0 customers'}</span>
          <div className="pagination-controls"><label>Rows per page:<select value={rowsPerPage} onChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(1) }}>{[10, 25, 50].map((count) => <option key={count}>{count}</option>)}</select></label><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => value - 1)}>Previous</button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button key={number} type="button" className={number === currentPage ? 'current-page' : ''} aria-current={number === currentPage ? 'page' : undefined} onClick={() => setPage(number)}>{number}</button>)}<button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div>
        </footer>
      </section>
      {modalOpen && <AddCustomerModal representatives={representatives} onClose={() => setModalOpen(false)} onSubmit={addCustomer} />}
    </div>
  )
}
