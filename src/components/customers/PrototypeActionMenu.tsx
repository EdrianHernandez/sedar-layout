import { MoreHorizontal, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface PrototypeMenuAction {
  label: string
  message: string
  icon?: LucideIcon
}

interface PrototypeActionMenuProps {
  label: string
  actions: PrototypeMenuAction[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onNotify: (message: string) => void
}

export function PrototypeActionMenu({ label, actions, open, onOpenChange, onNotify }: PrototypeActionMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, right: 8 })

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) onOpenChange(false)
    }
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onOpenChange(false); buttonRef.current?.focus() }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [open, onOpenChange])

  const toggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuHeight = actions.length * 36 + 10
      setPosition({
        top: rect.bottom + menuHeight > window.innerHeight ? Math.max(8, rect.top - menuHeight - 4) : rect.bottom + 4,
        right: Math.max(8, window.innerWidth - rect.right),
      })
    }
    onOpenChange(!open)
  }

  return <>
    <button ref={buttonRef} className="customer-menu-trigger" type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={toggle}><MoreHorizontal size={18} /></button>
    {open && createPortal(<div ref={menuRef} className="customer-action-menu profile-action-menu" role="menu" style={position}>
      {actions.map(({ label: actionLabel, message, icon: Icon }) => <button key={actionLabel} type="button" role="menuitem" onClick={() => { onOpenChange(false); onNotify(message) }}>{Icon && <Icon size={14} aria-hidden="true" />}<span>{actionLabel}</span></button>)}
    </div>, document.body)}
  </>
}
