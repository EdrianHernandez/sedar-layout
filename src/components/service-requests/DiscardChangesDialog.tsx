import { AlertTriangle } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface DiscardChangesDialogProps { onContinue: () => void; onDiscard: () => void }

export function DiscardChangesDialog({ onContinue, onDiscard }: DiscardChangesDialogProps) {
  const continueRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    continueRef.current?.focus()
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onContinue() }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [onContinue])
  return <div className="modal-backdrop request-discard-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onContinue() }}><section className="discard-dialog" role="alertdialog" aria-modal="true" aria-labelledby="discard-title" aria-describedby="discard-description"><span><AlertTriangle size={21} /></span><h2 id="discard-title">Discard unsaved request?</h2><p id="discard-description">Your changes will be lost.</p><div><button ref={continueRef} className="button button-secondary" type="button" onClick={onContinue}>Continue Editing</button><button className="button discard-button" type="button" onClick={onDiscard}>Discard Changes</button></div></section></div>
}
