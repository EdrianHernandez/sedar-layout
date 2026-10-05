import { useEffect, useRef, useState } from 'react'
import { ChevronDown, CircleCheckBig, Download, LockKeyhole, ShieldCheck, X } from 'lucide-react'
import { crewByVessel, masterRobByVessel } from '../../data/chiefEngineerMockData'
import { useEngineRoom } from '../../context/engineRoomStore'
import { generateDailyEngineLogPdf } from '../../utils/generateDailyEngineLogPdf'

interface WatchLogSignoffModalProps {
  onClose: () => void
  onSubmit: (preparedBy: string, remarks: string) => void
}

// Kiosk sign-off in two steps: (1) the report details — PREPARED BY (the chief engineer or one
// of this vessel's duty engineers), VERIFIED BY (designated chief, read-only) and optional
// handover remarks; (2) a Security Check — download the PDF report first (compliance gate:
// PIN entry and Confirm & Submit stay locked until the file is generated), then enter the
// chief's 4-digit PIN. No user accounts, no logout/login.
export function WatchLogSignoffModal({ onClose, onSubmit }: WatchLogSignoffModalProps) {
  const { activeVessel, logs, hydraulicOilAdded, robReceived } = useEngineRoom()
  const crew = crewByVessel[activeVessel.id]
  const [step, setStep] = useState<'details' | 'security'>('details')
  const [preparedBy, setPreparedBy] = useState('')
  const [remarks, setRemarks] = useState('')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [downloaded, setDownloaded] = useState(false)
  const pinInputRef = useRef<HTMLInputElement>(null)
  const dateLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // Security Check unwinds to the details step first; only step 1 closes the dialog.
      if (step === 'security') {
        setPin('')
        setPinError('')
        setDownloaded(false)
        setStep('details')
        return
      }
      onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose, step])

  // The hidden PIN input takes focus as soon as the Security Check state renders and is
  // enabled (the download gate keeps it disabled until the PDF has been saved).
  useEffect(() => {
    if (step === 'security' && downloaded) pinInputRef.current?.focus()
  }, [step, downloaded])

  const backToDetails = () => {
    setPin('')
    setPinError('')
    // Details may change after going back, so the previously downloaded file is stale —
    // drop the gate so the report must be downloaded again before submitting.
    setDownloaded(false)
    setStep('details')
  }

  const openSecurityCheck = () => {
    if (!preparedBy) return
    setStep('security')
  }

  const handlePinChange = (raw: string) => {
    setPin(raw.replace(/\D/g, '').slice(0, 4))
    setPinError('')
  }

  // Compliance gate: the Daily Engine Monitoring Report PDF (corporate letterhead, engine
  // tables, vessel R.O.B. + remarks, signature block) must be saved to the device before
  // the PIN unlocks — awaited, so the gate only opens once the file exists.
  const handleDownload = async () => {
    await generateDailyEngineLogPdf({
      vesselName: activeVessel.name,
      logDate: dateLabel,
      logs,
      masterRob: masterRobByVessel[activeVessel.id],
      robReceived,
      hydraulicOilAdded,
      preparedBy,
      verifiedBy: crew.chiefEngineer,
      remarks,
    })
    setDownloaded(true)
  }

  const handleSubmit = () => {
    if (!preparedBy) return
    if (!downloaded) return
    if (pin !== crew.chiefPin) {
      setPinError('Incorrect PIN. Authorization refused — try again.')
      setPin('')
      pinInputRef.current?.focus()
      return
    }
    onSubmit(preparedBy, remarks)
  }

  const isSecurity = step === 'security'

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="signoff-dialog" role="dialog" aria-modal="true" aria-labelledby="signoff-title">
        <header className="signoff-header">
          <span className="signoff-icon" aria-hidden="true">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2 id="signoff-title">{isSecurity ? 'Security Check' : 'Watch Log Sign-off'}</h2>
            <p>
              {isSecurity ? `Watch Log Sign-off · ${activeVessel.name} · ${dateLabel}` : `${activeVessel.name} · ${dateLabel}`}
            </p>
          </div>
          <button type="button" className="signoff-close" aria-label="Close sign-off" onClick={onClose}>
            <X size={16} />
          </button>
        </header>

        {!isSecurity ? (
          <div className="signoff-body">
            <label className="signoff-field">
              <span>Prepared By <em>*</em></span>
              <span className="signoff-select">
                <select
                  className="signoff-control"
                  value={preparedBy}
                  onChange={(event) => setPreparedBy(event.target.value)}
                  autoFocus
                >
                  <option value="" disabled>
                    Select preparer
                  </option>
                  {/* The chief often prepares the log directly, so the roster leads with them. */}
                  {[crew.chiefEngineer, ...crew.dutyEngineers].map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </span>
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

            <label className="signoff-field">
              <span>Remarks / Handover Notes (Optional)</span>
              <textarea
                className="signoff-textarea"
                rows={4}
                value={remarks}
                placeholder="Operational notes, anomalies, or handover messages…"
                aria-label="Remarks / handover notes (optional)"
                onChange={(event) => setRemarks(event.target.value)}
              />
            </label>
          </div>
        ) : (
          <div className="signoff-body">
            <label className="signoff-field">
              <span>Prepared By</span>
              <span className="signoff-readonly">
                <LockKeyhole size={14} aria-hidden="true" />
                <input
                  type="text"
                  readOnly
                  value={preparedBy}
                  aria-label="Prepared by (autofilled from the report details)"
                />
              </span>
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

            <button type="button" className="button button-primary signoff-download" onClick={handleDownload}>
              <Download size={15} aria-hidden="true" /> Download Report for Signing (PDF)
            </button>
            {downloaded && (
              <span className="signoff-done">
                <CircleCheckBig size={13} aria-hidden="true" /> Report downloaded — PIN entry enabled.
              </span>
            )}

            <div className="signoff-field signoff-field-center">
              <span id="signoff-pin-label">Chief Engineer PIN</span>
              <div
                className={`signoff-pin${downloaded ? '' : ' signoff-pin-locked'}`}
                onMouseDown={(event) => {
                  if (!downloaded) return
                  if (event.target !== pinInputRef.current) { event.preventDefault(); pinInputRef.current?.focus() }
                }}
              >
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
                  disabled={!downloaded}
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
        )}

        <footer className="signoff-actions">
          {!isSecurity ? (
            <>
              <button type="button" className="button button-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="button button-success"
                disabled={!preparedBy}
                onClick={openSecurityCheck}
              >
                Submit Report
              </button>
            </>
          ) : (
            <>
              <button type="button" className="button button-secondary" onClick={backToDetails}>
                Back
              </button>
              <button
                type="button"
                className="button button-success"
                disabled={!downloaded || pin.length !== 4}
                onClick={handleSubmit}
              >
                Confirm &amp; Submit
              </button>
              {!downloaded && (
                <span className="signoff-gate-hint">Please download the report first to enable submission.</span>
              )}
            </>
          )}
        </footer>
      </section>
    </div>
  )
}
