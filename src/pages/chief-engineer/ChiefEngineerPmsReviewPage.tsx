import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  CircleCheckBig,
  Download,
  LockKeyhole,
  ShieldCheck,
  X,
} from 'lucide-react'
import type { TaskCondition } from '../../types/pmsChecklist'
import {
  consoleTitle,
  crewByVessel,
  MACHINERY_TABS,
  PMS_INTERVALS,
  PMS_INTERVAL_HOURS,
  PMS_INTERVAL_LABELS,
} from '../../data/chiefEngineerMockData'
import { isRoutineDue, pmsOdometer } from '../../utils/engineLog'
import { generatePmsReportPdf } from '../../utils/generatePmsReportPdf'
import { useChiefEngineer } from './chiefEngineerOutlet'

// Read-only condition chips for the answered task list (labels mirror the PDF table).
const REVIEW_CONDITIONS: Record<
  Exclude<TaskCondition, 'pending'>,
  { label: string; icon: ReactNode; cls: string }
> = {
  done: {
    label: 'Done',
    icon: <Check size={13} aria-hidden="true" />,
    cls: 'border-[#177342] bg-[#d9f1e3] text-[#116437]',
  },
  issue: {
    label: 'Issue Found',
    icon: <AlertTriangle size={13} aria-hidden="true" />,
    cls: 'border-[#e0b64a] bg-[#fff0bd] text-[#775000]',
  },
}

// Full-screen Review Summary step: read-only answers, PREPARED BY / VERIFIED BY
// sign-off fields, and the Download-Before-Sign-Off compliance gate — the Chief's
// 4-digit PIN modal only opens once the PMS report PDF has been downloaded.
export function ChiefEngineerPmsReviewPage() {
  const { engineId: engineParam, interval: intervalParam } = useParams()
  const { activeVessel, logs, checklists, signoffChecklist, notify } = useChiefEngineer()
  const navigate = useNavigate()
  const [preparedBy, setPreparedBy] = useState('')
  const [downloaded, setDownloaded] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const pinInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!pinOpen) return
    pinInputRef.current?.focus()
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setPinOpen(false)
      setPin('')
      setPinError('')
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [pinOpen])

  // Route validation — mirrors the execution screen's guard.
  const engineTab = MACHINERY_TABS.find((tab) => tab.id.toLowerCase() === (engineParam ?? '').toLowerCase())
  const interval = PMS_INTERVALS.find((item) => item.toLowerCase() === (intervalParam ?? '').toLowerCase())
  const log = engineTab ? logs.find((item) => item.engineId === engineTab.id) : undefined
  const checklist =
    engineTab && interval ? checklists.find((item) => item.engineId === engineTab.id && item.interval === interval) : undefined
  if (!engineTab || !interval || !log || !checklist) return <Navigate to="/chief-engineer/pms" replace />

  const executePath = `/chief-engineer/pms/execute/${engineTab.id}/${interval}`
  const odometer = pmsOdometer(log)
  const hours = PMS_INTERVAL_HOURS[interval]
  const due = isRoutineDue(odometer, hours, checklist.completedOdometer)
  const readOnly = checklist.isDone
  const total = checklist.tasks.length
  const resolved = checklist.tasks.filter((task) => task.condition !== 'pending').length
  const allResolved = resolved === total
  // Signed-off, partially resolved or stale deep links go back to the execution screen.
  if (readOnly || !allResolved || !due) return <Navigate to={executePath} replace />

  const crew = crewByVessel[activeVessel.id]
  const label = PMS_INTERVAL_LABELS[interval]
  const isDrydock = interval === '12000H'

  const complete = () => {
    signoffChecklist(checklist.id)
    notify(
      isDrydock
        ? `${label} signed off for ${engineTab.label} — odometer reset to 0.0 H.`
        : `${label} signed off for ${engineTab.label}.`,
    )
    navigate('/chief-engineer/pms')
  }

  // Compliance gate: the report must be generated from the CURRENT preparer —
  // changing PREPARED BY invalidates the previous download.
  const handlePreparedBy = (value: string) => {
    setPreparedBy(value)
    setDownloaded(false)
  }

  const handleDownload = async () => {
    if (!preparedBy) return
    await generatePmsReportPdf({
      vesselName: activeVessel.name,
      engineName: engineTab.label,
      intervalLabel: label,
      odometer,
      // Strict binary status + timestamp only — findings and photos are never passed.
      tasks: checklist.tasks.map((task) => ({
        label: task.label,
        condition: task.condition === 'issue' ? 'issue' : 'done',
        loggedAt: task.loggedAt,
      })),
      preparedBy,
      verifiedBy: crew.chiefEngineer,
    })
    setDownloaded(true)
  }

  const openPin = () => {
    if (!downloaded || !preparedBy) return
    setPin('')
    setPinError('')
    setPinOpen(true)
  }

  const cancelPin = () => {
    setPinOpen(false)
    setPin('')
    setPinError('')
  }

  const confirmSecurity = () => {
    if (pin !== crew.chiefPin) {
      setPinError('Incorrect PIN. Authorization refused — try again.')
      setPin('')
      pinInputRef.current?.focus()
      return
    }
    cancelPin()
    complete()
  }

  const handlePinChange = (raw: string) => {
    setPin(raw.replace(/\D/g, '').slice(0, 4))
    setPinError('')
  }

  const formatLoggedAt = (iso?: string) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  return (
    <>
      <div className="tech-dashboard-header">
        <div className="tech-header-text">
          <span className="tech-header-kicker">{consoleTitle} · PMS Review &amp; Sign-Off</span>
          <h1>{label}</h1>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              {engineTab.label} · {engineTab.className === 'main' ? 'Main Engine' : 'Auxiliary Generator'} · Odometer
              at execution: {odometer.toFixed(1)} HRS
            </span>
            <span className="tech-status-badge tech-status-completed">All {total} tasks resolved</span>
          </p>
        </div>
        <div className="tech-header-actions">
          <Link to={executePath} className="button button-secondary button-lg">
            <ArrowLeft size={15} aria-hidden="true" /> Back to Checklist
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Read-only list of every answered task. */}
        <ul className="border-y border-[#e2e7ea]">
          {checklist.tasks.map((task, index) => {
            const condition = task.condition === 'issue' ? REVIEW_CONDITIONS.issue : REVIEW_CONDITIONS.done
            return (
              <li
                key={task.id}
                className="flex flex-wrap items-start gap-x-4 gap-y-2 border-b border-[#e2e7ea] py-3 last:border-b-0"
              >
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <span className="w-5 shrink-0 text-right text-xs font-black text-[#7c8994]">{index + 1}.</span>
                <div className="grid gap-1.5">
                  <p className="text-sm font-bold leading-snug text-[#283746]">{task.label}</p>
                  {task.condition === 'issue' && task.findings && (
                    <p className="border-l-2 border-[#efd181] bg-[#fffbe9] px-2.5 py-1.5 text-xs font-medium leading-relaxed text-[#775000]">
                      {task.findings}
                    </p>
                  )}
                  {/* Optional remark captured alongside a Done result. */}
                  {task.condition === 'done' && task.findings && (
                    <p className="border-l-2 border-[#cdd3d8] bg-[#f7f8f9] px-2.5 py-1.5 text-xs font-medium leading-relaxed text-[#5f6873]">
                      {task.findings}
                    </p>
                  )}
                </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider ${condition.cls}`}
                  >
                    {condition.icon}
                    {condition.label}
                  </span>
                  <span className="text-[10px] font-bold text-[#5f6873]">Logged: {formatLoggedAt(task.loggedAt)}</span>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Sign-off block — preparer, locked verifier, and the compliance-gated actions. */}
        <div className="grid gap-4 rounded-lg border border-[#d4d4d4] bg-[#f9fafb] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="signoff-field">
              <span>Prepared By <em>*</em></span>
              <span className="signoff-select">
                <select
                  className="signoff-control"
                  value={preparedBy}
                  aria-label="Prepared by (duty engineer)"
                  onChange={(event) => handlePreparedBy(event.target.value)}
                >
                  <option value="" disabled>
                    Select preparer
                  </option>
                  {/* The chief often inspects directly, so the roster leads with them. */}
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
                  aria-label="Verified by (designated chief engineer for this vessel, locked pending PIN)"
                />
              </span>
            </label>
          </div>

          <div className="grid gap-2.5">
            <button
              type="button"
              className="button button-primary signoff-download"
              disabled={!preparedBy}
              onClick={handleDownload}
            >
              <Download size={15} aria-hidden="true" /> Download PMS Report (PDF)
            </button>
            {downloaded && (
              <span className="signoff-done">
                <CircleCheckBig size={13} aria-hidden="true" /> Report downloaded — sign-off enabled.
              </span>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
              <p className="text-[11px] font-medium text-[#7c8994]">
                {downloaded
                  ? 'Chief Engineer PIN required to finalize the sign-off.'
                  : 'Download the PMS report (PDF) to enable sign-off.'}
              </p>
              <button
                type="button"
                className="button button-success"
                disabled={!downloaded || !preparedBy}
                onClick={openPin}
              >
                <CheckCheck size={15} aria-hidden="true" /> Confirm &amp; Sign-Off
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Check — Chief Engineer 4-digit PIN authorizes every submission. */}
      {pinOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cancelPin()
          }}
        >
          <section className="signoff-dialog" role="dialog" aria-modal="true" aria-labelledby="security-check-title">
            <header className="signoff-header">
              <span className="signoff-icon" aria-hidden="true">
                <ShieldCheck size={20} />
              </span>
              <div>
                <h2 id="security-check-title">Security Check</h2>
                <p>
                  {label} · {engineTab.label} · {activeVessel.name}
                </p>
              </div>
              <button type="button" className="signoff-close" aria-label="Close security check" onClick={cancelPin}>
                <X size={16} />
              </button>
            </header>

            <div className="signoff-body">
              <p className="rounded-lg border border-[#e2e7ea] bg-[#f9fafb] p-3 text-sm font-bold leading-relaxed text-[#465560]">
                {isDrydock
                  ? `Signing off resets ${engineTab.label}'s PMS odometer to 0.0 H and starts a fresh 12,000-Hour epoch. Every other routine restarts from its first interval.`
                  : `Confirming saves every task record, logged timestamp and evidence for this ${label}, then recalculates the PMS odometer schedule for ${engineTab.label}.`}
              </p>

              <label className="signoff-field">
                <span>Prepared By</span>
                <span className="signoff-readonly">
                  <LockKeyhole size={14} aria-hidden="true" />
                  <input
                    type="text"
                    readOnly
                    value={preparedBy}
                    aria-label="Prepared by (autofilled from the review summary)"
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

              <div className="signoff-field signoff-field-center">
                <span id="security-check-pin-label">Chief Engineer PIN</span>
                <div
                  className="signoff-pin"
                  onMouseDown={(event) => {
                    if (event.target !== pinInputRef.current) {
                      event.preventDefault()
                      pinInputRef.current?.focus()
                    }
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
                    aria-labelledby="security-check-pin-label"
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
              <button type="button" className="button button-secondary" onClick={cancelPin}>
                Cancel
              </button>
              <button
                type="button"
                className="button button-success"
                disabled={pin.length !== 4}
                onClick={confirmSecurity}
              >
                Confirm &amp; Submit
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  )
}
