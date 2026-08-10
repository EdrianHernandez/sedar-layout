import { useCallback, useEffect, useRef, useState } from 'react'
import { PanelLeft, X, Check, ChevronUp } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { departments, marketingNavigationGroups, technicalNavigationGroups } from '../../data/mockData'
import type { Department, NavigationGroup } from '../../types'

interface SidebarProps {
  department: Department
  desktopOpen: boolean
  mobileOpen: boolean
  onDesktopOpen: () => void
  onDesktopClose: () => void
  onMobileClose: () => void
  onNavigate: (item: string) => void
  onDepartmentChange: (dept: Department) => void
}

const navigationByDepartment: Record<Department, NavigationGroup[]> = {
  marketing: marketingNavigationGroups,
  technical: technicalNavigationGroups,
}

export function Sidebar({ department, desktopOpen, mobileOpen, onDesktopOpen, onDesktopClose, onMobileClose, onNavigate, onDepartmentChange }: SidebarProps) {
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const config = departments.find((d) => d.id === department)!
  const groups = navigationByDepartment[department]

  const handleNavigate = useCallback((item: string) => {
    onNavigate(item)
    onMobileClose()
  }, [onNavigate, onMobileClose])

  const handleDepartmentSelect = useCallback((dept: Department) => {
    const target = departments.find((d) => d.id === dept)!
    setSwitcherOpen(false)
    onDepartmentChange(dept)
    navigate(target.defaultPath)
  }, [onDepartmentChange, navigate])

  useEffect(() => {
    if (!switcherOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSwitcherOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [switcherOpen])

  const ariaLabel = `${config.label} department navigation`

  return (
    <>
      <aside className={`sidebar${desktopOpen ? '' : ' desktop-collapsed'}${mobileOpen ? ' mobile-open' : ''}`} aria-label={ariaLabel}>
        <div className="brand-block">
          {desktopOpen ? (
            <div className="brand-mark"><img src="/logo.png" alt="" /></div>
          ) : (
            <button type="button" className="brand-mark brand-expand" aria-label="Expand sidebar" aria-expanded={false} title="Expand sidebar" onClick={onDesktopOpen}><img src="/logo.png" alt="" /></button>
          )}
          <div className="brand-copy"><strong>SEDAR</strong></div>
          <button type="button" className="sidebar-close desktop-collapse" aria-label="Collapse sidebar" aria-expanded={desktopOpen} onClick={onDesktopClose}><PanelLeft size={17} /></button>
          <button type="button" className="sidebar-close mobile-close" aria-label="Close navigation" aria-expanded={mobileOpen} onClick={onMobileClose}><X size={17} /></button>
        </div>
        <nav className="sidebar-nav" aria-label={ariaLabel}>
          {groups.map((group, groupIndex) => {
            const labelId = `${department}-nav-group-${groupIndex}`
            return (
              <section className="nav-group" aria-labelledby={labelId} key={group.label}>
                <h2 className="nav-group-label" id={labelId}>{group.label}</h2>
                <ul className="nav-list">
                  {group.items.map(({ label, path, icon: Icon }) => (
                    <li key={path}>
                      <NavLink to={path} end={path === `/${department}/dashboard`} className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} aria-label={label} title={desktopOpen ? undefined : label} onClick={() => handleNavigate(label)}>
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
        <div className="sidebar-footer-wrapper" ref={switcherRef}>
          <button type="button" className={`sidebar-footer${switcherOpen ? ' switcher-open' : ''}`} onClick={() => setSwitcherOpen((v) => !v)} aria-haspopup="true" aria-expanded={switcherOpen} title={desktopOpen ? undefined : 'Switch department'}>
            <div className="footer-avatar" role="img" aria-label={`${config.label} department`}>S</div>
            <div className="footer-department-info">
              <strong>SEDAR MVP</strong>
              <span>{config.sublabel}</span>
            </div>
            <ChevronUp size={14} className={`footer-chevron${switcherOpen ? ' rotated' : ''}`} />
          </button>
          {switcherOpen && (
            <div className="department-switcher" role="menu" aria-label="Switch department">
              <div className="switcher-header">Switch Department</div>
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  className={`switcher-option${dept.id === department ? ' active' : ''}`}
                  role="menuitem"
                  onClick={() => handleDepartmentSelect(dept.id)}
                >
                  <span className="switcher-check">{dept.id === department && <Check size={13} />}</span>
                  <div className="switcher-option-text">
                    <strong>{dept.label}</strong>
                    <span>{dept.sublabel}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
      {mobileOpen && <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={onMobileClose} />}
    </>
  )
}
