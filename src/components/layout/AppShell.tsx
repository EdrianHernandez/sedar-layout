import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import type { Department } from '../../types'

interface AppShellProps {
  children: ReactNode
  department: Department
  desktopSidebarOpen: boolean
  mobileSidebarOpen: boolean
  setDesktopSidebarOpen: (open: boolean) => void
  setMobileSidebarOpen: (open: boolean) => void
  onNavigate: (item: string) => void
  onDepartmentChange: (dept: Department) => void
}

export function AppShell({ children, department, desktopSidebarOpen, mobileSidebarOpen, setDesktopSidebarOpen, setMobileSidebarOpen, onNavigate, onDepartmentChange }: AppShellProps) {
  return (
    <div className={desktopSidebarOpen ? 'app-shell' : 'app-shell sidebar-collapsed'}>
      <Sidebar
        department={department}
        desktopOpen={desktopSidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onDesktopOpen={() => setDesktopSidebarOpen(true)}
        onDesktopClose={() => setDesktopSidebarOpen(false)}
        onMobileClose={() => setMobileSidebarOpen(false)}
        onNavigate={onNavigate}
        onDepartmentChange={onDepartmentChange}
      />
      <main className="workspace">{children}</main>
    </div>
  )
}
