import { ArrowLeft, ChevronRight, ClipboardList, ContactRound, FileSignature, Files, ListChecks, ReceiptText, CircleCheckBig } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CustomerContactsTab } from '../../components/customers/contacts/CustomerContactsTab'
import { CustomerOverviewTab } from '../../components/customers/CustomerOverviewTab'
import { CustomerProfileHeader } from '../../components/customers/CustomerProfileHeader'
import { CustomerProfileTabs } from '../../components/customers/CustomerProfileTabs'
import { CustomerTabPlaceholder } from '../../components/customers/CustomerTabPlaceholder'
import { CustomerTransactionHistoryTab } from '../../components/customers/CustomerTransactionHistoryTab'
import { CustomerServiceRequestsTab } from '../../components/customers/service-requests/CustomerServiceRequestsTab'
import { CustomerQuotationsTab } from '../../components/customers/quotations/CustomerQuotationsTab'
import { CustomerContractsTab } from '../../components/customers/contracts/CustomerContractsTab'
import { CustomerAppointmentsTab } from '../../components/customers/appointments/CustomerAppointmentsTab'
import { AppointmentCalendarInteractions } from '../../components/customers/appointments/AppointmentCalendarInteractions'
import { MetricCard } from '../../components/dashboard/MetricCard'
import { initialCustomers } from '../../data/customerMockData'
import { profileTabs, profileTabSlugs, type ProfileTab } from '../../data/customerProfileTabs'
import { customerActivities, customerInternalNotes, customerTransactions } from '../../data/customerTransactionMockData'
import { serviceRequestRepository } from '../../repositories/serviceRequestRepository'
import { appointmentRepository } from '../../repositories/appointmentRepository'
import { sortAppointments } from '../../utils/appointmentSorting'

interface CustomerProfilePageProps { onNotify: (message: string) => void }

const placeholders: Record<Exclude<ProfileTab, 'Overview' | 'Contacts' | 'Service Requests' | 'Quotations' | 'Contracts' | 'Transaction History' | 'Appointments'>, { icon: typeof ContactRound; description: string }> = {
  Documents: { icon: Files, description: 'Manage documents associated with this customer.' },
  'Activity Log': { icon: ListChecks, description: 'Review the complete customer activity record.' },
}

export function CustomerProfilePage({ onNotify }: CustomerProfilePageProps) {
  const { customerId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const activeTab = profileTabs.find((tab) => profileTabSlugs[tab] === requestedTab) ?? 'Overview'
  const setActiveTab = (tab: ProfileTab) => {
    const next = new URLSearchParams(searchParams)
    if (tab === 'Overview') next.delete('tab')
    else next.set('tab', profileTabSlugs[tab])
    setSearchParams(next)
  }
  const customer = initialCustomers.find((record) => record.id === customerId)

  if (!customer) return <section className="profile-not-found"><h1>Customer Not Found</h1><p>The requested customer record could not be found.</p><Link className="button button-secondary" to="/marketing/customers"><ArrowLeft size={15} />Back to Customers</Link></section>

  const transactions = customerTransactions.filter((transaction) => transaction.customerId === customer.id)
  const requestReferences = new Set(transactions.filter((transaction) => transaction.type === 'Service Request').map((transaction) => transaction.reference))
  serviceRequestRepository.getAll().filter((request) => request.customerId === customer.id).forEach((request) => requestReferences.add(request.referenceNumber))
  const totalRequests = requestReferences.size
  const activeQuotations = transactions.filter((transaction) => transaction.type === 'Quotation' && ['Draft', 'Under Review', 'Sent', 'Approved'].includes(transaction.status)).length
  const activeContracts = transactions.filter((transaction) => transaction.type === 'Contract' && transaction.status === 'Active').length
  const completedServices = transactions.filter((transaction) => transaction.type === 'Completed Service' || (transaction.type === 'Service Request' && transaction.status === 'Completed')).length
  const activeTabIndex = profileTabs.indexOf(activeTab)
  const upcomingAppointment = sortAppointments(appointmentRepository.getByCustomerId(customer.id).filter((appointment) => !['Completed', 'Cancelled', 'No Show'].includes(appointment.status) && new Date(appointment.endAt) >= new Date()))[0]

  return <div className="customer-profile-page">
    <div className="profile-navigation">
      <nav aria-label="Breadcrumb"><ol><li><Link to="/marketing/customers">Customers</Link></li><li><ChevronRight size={12} aria-hidden="true" /></li><li aria-current="page">{customer.companyName}</li></ol></nav>
    </div>
    <CustomerProfileHeader customer={customer} onNotify={onNotify} />
    <section className="metrics-grid profile-metrics" aria-label="Customer relationship summary">
      <MetricCard label="TOTAL SERVICE REQUESTS" value={totalRequests} icon={ClipboardList} />
      <MetricCard label="ACTIVE QUOTATIONS" value={activeQuotations} icon={ReceiptText} />
      <MetricCard label="ACTIVE CONTRACTS" value={activeContracts} icon={FileSignature} />
      <MetricCard label="COMPLETED SERVICES" value={completedServices} icon={CircleCheckBig} />
    </section>
    <div className="profile-tab-shell">
      <CustomerProfileTabs activeTab={activeTab} onChange={setActiveTab} />
      <div id="customer-tab-panel" className="profile-tab-panel" role="tabpanel" aria-labelledby={`customer-tab-${activeTabIndex}`} tabIndex={0}>
        {activeTab === 'Overview' && <CustomerOverviewTab customer={customer} appointment={upcomingAppointment} activities={customerActivities[customer.id] ?? []} notes={customerInternalNotes[customer.id] ?? []} onNotify={onNotify} />}
        {activeTab === 'Contacts' && <CustomerContactsTab customer={customer} onNotify={onNotify} />}
        {activeTab === 'Service Requests' && <CustomerServiceRequestsTab customer={customer} onNotify={onNotify} />}
        {activeTab === 'Quotations' && <CustomerQuotationsTab customer={customer} onNotify={onNotify} />}
        {activeTab === 'Contracts' && <CustomerContractsTab customer={customer} onNotify={onNotify} />}
        {activeTab === 'Transaction History' && <><header className="transaction-history-header"><h2>Transaction History</h2></header><CustomerTransactionHistoryTab customer={customer} onNotify={onNotify} /></>}
        {activeTab === 'Appointments' && <><CustomerAppointmentsTab customer={customer} onNotify={onNotify} /><AppointmentCalendarInteractions customerId={customer.id} /></>}
        {activeTab !== 'Overview' && activeTab !== 'Contacts' && activeTab !== 'Service Requests' && activeTab !== 'Quotations' && activeTab !== 'Contracts' && activeTab !== 'Transaction History' && activeTab !== 'Appointments' && <CustomerTabPlaceholder title={activeTab} {...placeholders[activeTab]} />}
      </div>
    </div>
  </div>
}
