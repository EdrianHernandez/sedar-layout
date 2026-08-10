import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
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
import { TechnicalDashboardPage } from './pages/technical/TechnicalDashboardPage'
import { TechnicalPlaceholderPage } from './pages/technical/TechnicalPlaceholderPage'
import type { Department } from './types'

function getDepartmentFromPath(pathname: string): Department {
  if (pathname.startsWith('/technical')) return 'technical'
  return 'marketing'
}

export default function App() {
  const location = useLocation()
  const [department, setDepartment] = useState<Department>(() => getDepartmentFromPath(location.pathname))
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(() => localStorage.getItem('sedar-marketing-sidebar-collapsed') !== 'true')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    setDepartment(getDepartmentFromPath(location.pathname))
  }, [location.pathname])

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

  const notify = useCallback((message: string) => setToast(message), [])

  const handleDepartmentChange = useCallback((dept: Department) => {
    setDepartment(dept)
    setDesktopSidebarOpen(true)
    setMobileSidebarOpen(false)
  }, [])

  return (
    <AppShell
      department={department}
      desktopSidebarOpen={desktopSidebarOpen}
      mobileSidebarOpen={mobileSidebarOpen}
      setDesktopSidebarOpen={setDesktopSidebarOpen}
      setMobileSidebarOpen={setMobileSidebarOpen}
      onNavigate={(item) => notify(`${item} selected.`)}
      onDepartmentChange={handleDepartmentChange}
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
        <Route path="/technical/dashboard" element={<TechnicalDashboardPage />} />
        <Route path="/technical/maintenance" element={<TechnicalPlaceholderPage title="Planned Maintenance" description="Manage scheduled preventive maintenance activities for SEDAR vessels and equipment." />} />
        <Route path="/technical/work-orders" element={<TechnicalPlaceholderPage title="Work Orders" description="Create, assign, and track maintenance work orders across the fleet." />} />
        <Route path="/technical/defects" element={<TechnicalPlaceholderPage title="Defects & Repairs" description="Log and manage vessel defects, repairs, and corrective maintenance requests." />} />
        <Route path="/technical/equipment" element={<TechnicalPlaceholderPage title="Equipment History" description="Review maintenance history and performance records for all vessel equipment." />} />
        <Route path="/technical/dry-dock" element={<TechnicalPlaceholderPage title="Dry Dock Planning" description="Plan and manage dry dock schedules, scopes, and vessel availability windows." />} />
        <Route path="/technical/spare-parts" element={<TechnicalPlaceholderPage title="Spare Parts" description="Track spare parts inventory, reorder levels, and procurement status for vessel equipment." />} />
        <Route path="/technical/reports" element={<TechnicalPlaceholderPage title="Maintenance Reports" description="View maintenance performance reports, fleet status summaries, and compliance metrics." />} />
        <Route path="*" element={<Navigate to="/marketing/dashboard" replace />} />
      </Routes>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </AppShell>
  )
}
