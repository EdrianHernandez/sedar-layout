import { PanelLeft, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { marketingNavigationGroups } from '../../data/mockData'

interface SidebarProps {
  desktopOpen: boolean
  mobileOpen: boolean
  onDesktopOpen: () => void
  onDesktopClose: () => void
  onMobileClose: () => void
  onNavigate: (item: string) => void
}

export function Sidebar({ desktopOpen, mobileOpen, onDesktopOpen, onDesktopClose, onMobileClose, onNavigate }: SidebarProps) {
  const handleNavigate = (item: string) => {
    onNavigate(item)
    onMobileClose()
  }

  return (
    <>
      <aside className={`sidebar${desktopOpen ? '' : ' desktop-collapsed'}${mobileOpen ? ' mobile-open' : ''}`} aria-label="Marketing navigation">
        <div className="brand-block">
          {desktopOpen ? (
            <div className="brand-mark">S</div>
          ) : (
            <button type="button" className="brand-mark brand-expand" aria-label="Expand sidebar" aria-expanded={false} title="Expand sidebar" onClick={onDesktopOpen}>S</button>
          )}
          <div className="brand-copy"><strong>SEDAR</strong></div>
          <button type="button" className="sidebar-close desktop-collapse" aria-label="Collapse sidebar" aria-expanded={desktopOpen} onClick={onDesktopClose}><PanelLeft size={17} /></button>
          <button type="button" className="sidebar-close mobile-close" aria-label="Close navigation" aria-expanded={mobileOpen} onClick={onMobileClose}><X size={17} /></button>
        </div>
        <nav className="sidebar-nav" aria-label="Marketing navigation">
          {marketingNavigationGroups.map((group, groupIndex) => {
            const labelId = `marketing-nav-group-${groupIndex}`
            return (
              <section className="nav-group" aria-labelledby={labelId} key={group.label}>
                <h2 className="nav-group-label" id={labelId}>{group.label}</h2>
                <ul className="nav-list">
                  {group.items.map(({ label, path, icon: Icon }) => (
                    <li key={path}>
                      <NavLink to={path} end={path === '/marketing/dashboard'} className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} aria-label={label} title={desktopOpen ? undefined : label} onClick={() => handleNavigate(label)}>
                        <Icon aria-hidden="true" size={16} />
                        <span>{label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </nav>
        <footer className="sidebar-footer">
          <div className="footer-avatar" role="img" aria-label="SEDAR MVP – Marketing ERP" title={desktopOpen ? undefined : 'SEDAR MVP – Marketing ERP'}>S</div>
          <div><strong>SEDAR MVP</strong><span>Marketing ERP</span></div>
        </footer>
      </aside>
      {mobileOpen && <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={onMobileClose} />}
    </>
  )
}
