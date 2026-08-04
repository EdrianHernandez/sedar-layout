import { Bell, Menu, MessageSquare } from 'lucide-react'

interface TopbarProps {
  mobileSidebarOpen: boolean
  onMobileMenuClick: () => void
}

function BadgedIcon({ type }: { type: 'message' | 'notification' }) {
  const Icon = type === 'message' ? MessageSquare : Bell
  return <button type="button" className="topbar-icon" aria-label={type === 'message' ? 'Messages, 6 unread' : 'Notifications, 6 unread'}><Icon size={16} /><span>6</span></button>
}

export function Topbar({ mobileSidebarOpen, onMobileMenuClick }: TopbarProps) {
  return (
    <header className="topbar">
      <button className="menu-button mobile-menu-button" type="button" aria-label="Open navigation" aria-expanded={mobileSidebarOpen} onClick={onMobileMenuClick}><Menu size={19} /></button>
      <div className="topbar-actions">
        <BadgedIcon type="message" />
        <BadgedIcon type="notification" />
        <span className="company-name">Sedar Tug Services Corp.</span>
        <div className="user-avatar" aria-label="User profile">S</div>
      </div>
    </header>
  )
}
