import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { DashboardHeader } from './components/dashboard/DashboardHeader'
import { MetricCard } from './components/dashboard/MetricCard'
import { ServiceRequestsPanel } from './components/dashboard/ServiceRequestsPanel'
import { TodaySchedulePanel } from './components/dashboard/TodaySchedulePanel'
import { AppShell } from './components/layout/AppShell'
import { PlaceholderPage } from './components/pages/PlaceholderPage'
import { Toast } from './components/ui/Toast'
import { metrics } from './data/mockData'
import { CustomerProfilePage } from './pages/customers/CustomerProfilePage'
import { CustomersPage } from './pages/customers/CustomersPage'
import { NewServiceRequestPage } from './pages/service-requests/NewServiceRequestPage'
import { ServiceRequestDetailsPlaceholder } from './pages/service-requests/ServiceRequestDetailsPlaceholder'
import { NewQuotationPlaceholder } from './pages/quotations/NewQuotationPlaceholder'
import { QuotationDetailsPlaceholder } from './pages/quotations/QuotationDetailsPlaceholder'
import { ContractDetailsPlaceholder } from './pages/contracts/ContractDetailsPlaceholder'
import { NewContractPlaceholder } from './pages/contracts/NewContractPlaceholder'
import type { RequestFilter } from './types'

export default function App() {
  const navigate = useNavigate()
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(() => localStorage.getItem('sedar-marketing-sidebar-collapsed') !== 'true')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [filter, setFilter] = useState<RequestFilter>('ALL')
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    localStorage.setItem('sedar-marketing-sidebar-collapsed', String(!desktopSidebarOpen))
  }, [desktopSidebarOpen])

  useEffect(() => {
    if (!mobileSidebarOpen) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileSidebarOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [mobileSidebarOpen])

  const notify = (message: string) => setToast(message)

  return (
    <AppShell
      desktopSidebarOpen={desktopSidebarOpen}
      mobileSidebarOpen={mobileSidebarOpen}
      setDesktopSidebarOpen={setDesktopSidebarOpen}
      setMobileSidebarOpen={setMobileSidebarOpen}
      onNavigate={(item) => notify(`${item} selected.`)}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/marketing/dashboard" replace />} />
        <Route path="/marketing/dashboard" element={<>
          <DashboardHeader onNewRequest={() => navigate('/marketing/service-requests/new')} onSchedule={() => notify('Appointment scheduler will open here.')} />
          <section className="metrics-grid" aria-label="Dashboard metrics">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</section>
          <div className="panels-grid">
            <ServiceRequestsPanel filter={filter} onFilterChange={setFilter} />
            <TodaySchedulePanel onViewCalendar={() => notify('Full calendar selected.')} />
          </div>
        </>} />
        <Route path="/marketing/service-requests" element={<PlaceholderPage title="Service Requests" />} />
        <Route path="/marketing/service-requests/new" element={<NewServiceRequestPage onNotify={notify} />} />
        <Route path="/marketing/service-requests/:requestId" element={<ServiceRequestDetailsPlaceholder />} />
        <Route path="/marketing/customers" element={<CustomersPage onNotify={notify} />} />
        <Route path="/marketing/customers/:customerId" element={<CustomerProfilePage onNotify={notify} />} />
        <Route path="/marketing/quotations" element={<PlaceholderPage title="Quotations" />} />
        <Route path="/marketing/quotations/new" element={<NewQuotationPlaceholder />} />
        <Route path="/marketing/quotations/:quotationId" element={<QuotationDetailsPlaceholder />} />
        <Route path="/marketing/contracts" element={<PlaceholderPage title="Contracts" />} />
        <Route path="/marketing/contracts/new" element={<NewContractPlaceholder />} />
        <Route path="/marketing/contracts/:contractId" element={<ContractDetailsPlaceholder />} />
        <Route path="/marketing/appointments" element={<PlaceholderPage title="Appointments" />} />
        <Route path="/marketing/reports" element={<PlaceholderPage title="Reports" />} />
        <Route path="*" element={<Navigate to="/marketing/dashboard" replace />} />
      </Routes>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </AppShell>
  )
}
