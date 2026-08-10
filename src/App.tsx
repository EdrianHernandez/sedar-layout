import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Toast } from './components/ui/Toast'
import { CustomerProfilePage } from './pages/customers/CustomerProfilePage'
import { CustomersPage } from './pages/customers/CustomersPage'
import { NewServiceRequestPage } from './pages/service-requests/NewServiceRequestPage'
import { ServiceRequestDetailsPage } from './pages/service-requests/ServiceRequestDetailsPage'
import { ServiceRequestsPage } from './pages/service-requests/ServiceRequestsPage'
import { NewQuotationPlaceholder } from './pages/quotations/NewQuotationPlaceholder'
import { QuotationDetailsPlaceholder } from './pages/quotations/QuotationDetailsPlaceholder'
import { QuotationsPage } from './pages/quotations/QuotationsPage'
import { ContractDetailsPlaceholder } from './pages/contracts/ContractDetailsPlaceholder'
import { AppointmentsPage } from './pages/appointments/AppointmentsPage'
import { MarketingReportsPage } from './pages/reports/MarketingReportsPage'
import { NewContractPlaceholder } from './pages/contracts/NewContractPlaceholder'
import { ContractsPage } from './pages/contracts/ContractsPage'
import { MarketingDashboardPage } from './pages/dashboard/MarketingDashboardPage'

export default function App() {
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(() => localStorage.getItem('sedar-marketing-sidebar-collapsed') !== 'true')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
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
        <Route path="/marketing/dashboard" element={<MarketingDashboardPage onNotify={notify} />} />
        <Route path="/marketing/service-requests" element={<ServiceRequestsPage onNotify={notify} />} />
        <Route path="/marketing/service-requests/new" element={<NewServiceRequestPage onNotify={notify} />} />
        <Route path="/marketing/service-requests/:requestId" element={<ServiceRequestDetailsPage onNotify={notify} />} />
        <Route path="/marketing/customers" element={<CustomersPage onNotify={notify} />} />
        <Route path="/marketing/customers/:customerId" element={<CustomerProfilePage onNotify={notify} />} />
        <Route path="/marketing/quotations" element={<QuotationsPage onNotify={notify} />} />
        <Route path="/marketing/quotations/new" element={<NewQuotationPlaceholder />} />
        <Route path="/marketing/quotations/:quotationId" element={<QuotationDetailsPlaceholder onNotify={notify} />} />
        <Route path="/marketing/contracts" element={<ContractsPage onNotify={notify} />} />
        <Route path="/marketing/contracts/new" element={<NewContractPlaceholder />} />
        <Route path="/marketing/contracts/:contractId" element={<ContractDetailsPlaceholder onNotify={notify} />} />
        <Route path="/marketing/appointments" element={<AppointmentsPage onNotify={notify} />} />
        <Route path="/marketing/reports" element={<MarketingReportsPage />} />
        <Route path="*" element={<Navigate to="/marketing/dashboard" replace />} />
      </Routes>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </AppShell>
  )
}
