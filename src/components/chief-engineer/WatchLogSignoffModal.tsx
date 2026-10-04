import { useEffect, useRef, useState } from 'react'
import { LockKeyhole, ShieldCheck, X } from 'lucide-react'
import { crewByVessel } from '../../data/chiefEngineerMockData'
import { useEngineRoom } from '../../context/engineRoomStore'

interface WatchLogSignoffModalProps {
  onClose: () => void
  onSubmit: (preparedBy: string) => void
}

// Kiosk sign-off: the log is signed in one gated step — PREPARED BY (this vessel's duty
// engineers), VERIFIED BY (this vessel's designated chief, read-only), then the chief's
// 4-digit PIN unlocks SUBMIT & LOCK. No user accounts, no logout/login cycle.
export function WatchLogSignoffModal({ onClose, onSubmit }: WatchLogSignoffModalProps) {
  const { activeVessel } = useEngineRoom()
  const crew = crewByVessel[activeVessel.id]
  const [preparedBy, setPreparedBy] = useState('')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const pinInputRef = useRef<HTMLInputElement>(null)
  const dateLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handlePinChange = (raw: string) => {
    setPin(raw.replace(/\D/g, '').slice(0, 4))
    setPinError('')
  }

  const handleSubmit = () => {
    if (!preparedBy) return
    if (pin !== crew.chiefPin) {
      setPinError('Incorrect PIN. Authorization refused — try again.')
      setPin('')
      pinInputRef.current?.focus()
      return
    }
    onSubmit(preparedBy)
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="signoff-dialog" role="dialog" aria-modal="true" aria-labelledby="signoff-title">
        <header className="signoff-header">
          <span className="signoff-icon" aria-hidden="true">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2 id="signoff-title">Watch Log Sign-off</h2>
            <p>{activeVessel.name} · {dateLabel}</p>
          </div>
          <button type="button" className="signoff-close" aria-label="Close sign-off" onClick={onClose}>
            <X size={16} />
          </button>
        </header>

        <div className="signoff-body">
          <label className="signoff-field">
            <span>Prepared By <em>*</em></span>
            <select
              className="signoff-control"
              value={preparedBy}
              onChange={(event) => setPreparedBy(event.target.value)}
              autoFocus
            >
              <option value="" disabled>
                Select duty engineer
              </option>
              {crew.dutyEngineers.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="signoff-field">
            <span>Verified By</span>
            <span className="signoff-readonly">
              <LockKeyhole size={14} aria-hidden="true" />
              <input
                type="text"
                readOnly
                value={crew.chiefEngineer}
                aria-label="Verified by (designated chief engineer for this vessel)"
              />
            </span>
          </label>

          <div className="signoff-field">
            <span id="signoff-pin-label">Chief Engineer PIN</span>
            <div className="signoff-pin" onMouseDown={(event) => { if (event.target !== pinInputRef.current) { event.preventDefault(); pinInputRef.current?.focus() } }}>
              {[0, 1, 2, 3].map((index) => (
                <span key={index} className="signoff-pin-box" aria-hidden="true">
                  {pin[index] ? '•' : '_'}
                </span>
              ))}
              <input
                ref={pinInputRef}
                className="signoff-pin-input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={pin}
                aria-labelledby="signoff-pin-label"
                aria-invalid={Boolean(pinError)}
                onChange={(event) => handlePinChange(event.target.value)}
              />
            </div>
            <span className="signoff-hint">Demo PIN: {crew.chiefPin}</span>
            {pinError && (
              <span className="signoff-error" role="alert">
                {pinError}
              </span>
            )}
          </div>
        </div>

        <footer className="signoff-actions">
          <button type="button" className="button button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="button button-success"
            disabled={!preparedBy || pin.length !== 4}
            onClick={handleSubmit}
          >
            <LockKeyhole size={15} aria-hidden="true" /> SUBMIT &amp; LOCK
          </button>
        </footer>
      </section>
    </div>
  )
}
