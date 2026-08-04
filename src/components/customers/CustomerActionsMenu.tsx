import { MoreHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import type { Customer } from '../../types/customer'

interface CustomerActionsMenuProps {
  customer: Customer
  open: boolean
  onToggle: () => void
  onClose: () => void
  onNotify: (message: string) => void
}

const prototypeActions = [
  ['Edit Customer', 'Customer editing will be implemented next.'],
  ['Create Service Request', 'Service request creation will be implemented next.'],
  ['Schedule Appointment', 'Appointment scheduling will be implemented next.'],
  ['Create Quotation', 'Quotation creation will be implemented next.'],
] as const

export function CustomerActionsMenu({ customer, open, onToggle, onClose, onNotify }: CustomerActionsMenuProps) {
  const navigate = useNavigate()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, right: 0 })

  useEffect(() => {
    if (!open) return
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) setPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right })

    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) onClose()
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open, onClose])

  const viewCustomer = () => {
    onClose()
    navigate(`/marketing/customers/${customer.id}`, { state: { companyName: customer.companyName } })
  }

  const runPrototypeAction = (message: string) => {
    onClose()
    onNotify(message)
  }

  return (
    <>
      <button ref={buttonRef} className="customer-menu-trigger" type="button" aria-label={`Actions for ${customer.companyName}`} aria-haspopup="menu" aria-expanded={open} onClick={onToggle}>
        <MoreHorizontal size={17} />
      </button>
      {open && createPortal(
        <div ref={menuRef} className="customer-action-menu" role="menu" style={position}>
          <button type="button" role="menuitem" onClick={viewCustomer}>View Customer</button>
          {prototypeActions.map(([label, message]) => (
            <button key={label} type="button" role="menuitem" onClick={() => runPrototypeAction(message)}>{label}</button>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
