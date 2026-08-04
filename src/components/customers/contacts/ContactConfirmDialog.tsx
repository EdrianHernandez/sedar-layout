import { AlertTriangle } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface Props { title: string; message: string; confirmLabel: string; destructive?: boolean; onCancel: () => void; onConfirm: () => void }
export function ContactConfirmDialog({ title, message, confirmLabel, destructive, onCancel, onConfirm }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { cancelRef.current?.focus(); const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onCancel() }; document.addEventListener('keydown', escape); return () => document.removeEventListener('keydown', escape) }, [onCancel])
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}><section className="contact-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="contact-confirm-title"><span><AlertTriangle size={20} /></span><h2 id="contact-confirm-title">{title}</h2><p>{message}</p><div><button ref={cancelRef} className="button button-secondary" type="button" onClick={onCancel}>Cancel</button><button className={`button ${destructive ? 'discard-button' : 'button-primary'}`} type="button" onClick={onConfirm}>{confirmLabel}</button></div></section></div>
}
