import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  children: ReactNode
  desktopSidebarOpen: boolean
  mobileSidebarOpen: boolean
  setDesktopSidebarOpen: (open: boolean) => void
  setMobileSidebarOpen: (open: boolean) => void
  onNavigate: (item: string) => void
}

export function AppShell({ children, desktopSidebarOpen, mobileSidebarOpen, setDesktopSidebarOpen, setMobileSidebarOpen, onNavigate }: AppShellProps) {
  return (
    <div className={desktopSidebarOpen ? 'app-shell' : 'app-shell sidebar-collapsed'}>
      <Sidebar
        desktopOpen={desktopSidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onDesktopOpen={() => setDesktopSidebarOpen(true)}
        onDesktopClose={() => setDesktopSidebarOpen(false)}
        onMobileClose={() => setMobileSidebarOpen(false)}
        onNavigate={onNavigate}
      />
      <main className="workspace">{children}</main>
    </div>
  )
}
