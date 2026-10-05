import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Camera, Check, CheckCheck, CircleSlash, ShieldCheck, Trash2, X } from 'lucide-react'
import type { PMSTask, TaskCondition } from '../../types/pmsChecklist'
import {
  consoleTitle,
  crewByVessel,
  MACHINERY_TABS,
  PMS_INTERVALS,
  PMS_INTERVAL_HOURS,
  PMS_INTERVAL_LABELS,
} from '../../data/chiefEngineerMockData'
import { isRoutineDue, nextDueHours, pmsOdometer, remainingToDue } from '../../utils/engineLog'
import { useChiefEngineer } from './chiefEngineerOutlet'

interface ConditionOption {
  value: TaskCondition
  label: string
  icon: ReactNode
  active: string
  idle: string
}

const IDLE_CLS = 'border-[#cdd3d8] bg-white text-[#526475] hover:bg-[#f4f6f7]'

// 3-state condition reporting: every task must be resolved (done / issue / na) before
// the checklist can be signed off. Issue Found reveals the defect inputs below its row.
const CONDITION_OPTIONS: ConditionOption[] = [
  {
    value: 'done',
    label: 'Done',
    icon: <Check size={15} aria-hidden="true" />,
    active: 'border-[#177342] bg-[#d9f1e3] text-[#116437]',
    idle: IDLE_CLS,
  },
  {
    value: 'issue',
    label: 'Issue Found',
    icon: <AlertTriangle size={15} aria-hidden="true" />,
    active: 'border-[#e0b64a] bg-[#fff0bd] text-[#775000]',
    idle: IDLE_CLS,
  },
  {
    value: 'na',
    label: 'N/A',
    icon: <CircleSlash size={15} aria-hidden="true" />,
    active: 'border-[#5f6873] bg-[#edf0f2] text-[#4f5d68]',
    idle: IDLE_CLS,
  },
]

// Dedicated Task Execution Screen for one engine + interval: reached from a card's
// START/VIEW CHECKLIST navigation (never expanded in place on the dashboard).
export function ChiefEngineerPmsExecutePage() {
  const { engineId: engineParam, interval: intervalParam } = useParams()
  const { activeVessel, logs, checklists, setTaskCondition, setTaskIssue, signoffChecklist, notify } =
    useChiefEngineer()
  const navigate = useNavigate()
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

  // Route validation: unknown engine or interval (or a routine that is neither due
  // nor signed off — a stale deep link) bounces back to the dashboard.
  const engineTab = MACHINERY_TABS.find((tab) => tab.id.toLowerCase() === (engineParam ?? '').toLowerCase())
  const interval = PMS_INTERVALS.find((item) => item.toLowerCase() === (intervalParam ?? '').toLowerCase())
  const log = engineTab ? logs.find((item) => item.engineId === engineTab.id) : undefined
  const checklist =
    engineTab && interval ? checklists.find((item) => item.engineId === engineTab.id && item.interval === interval) : undefined
  if (!engineTab || !interval || !log || !checklist) return <Navigate to="/chief-engineer/pms" replace />

  const odometer = pmsOdometer(log)
  const hours = PMS_INTERVAL_HOURS[interval]
  const due = isRoutineDue(odometer, hours, checklist.completedOdometer)
  const readOnly = checklist.isDone
  if (!due && !readOnly) return <Navigate to="/chief-engineer/pms" replace />

  const total = checklist.tasks.length
  const resolved = checklist.tasks.filter((task) => task.condition !== 'pending').length
  const issueCount = checklist.tasks.filter((task) => task.condition === 'issue').length
  const naCount = checklist.tasks.filter((task) => task.condition === 'na').length
  const allResolved = resolved === total
  const isDrydock = interval === '12000H'
  const nextDue = nextDueHours(hours, checklist.completedOdometer)
  const remaining = remainingToDue(odometer, hours, checklist.completedOdometer)
  const crew = crewByVessel[activeVessel.id]
  const label = PMS_INTERVAL_LABELS[interval]

  const complete = () => {
    signoffChecklist(checklist.id)
    notify(
      isDrydock
        ? `${label} signed off for ${engineTab.label} — odometer reset to 0.0 H.`
        : `${label} signed off for ${engineTab.label}.`,
    )
    navigate('/chief-engineer/pms')
  }

  const handleSignoff = () => {
    if (readOnly || !allResolved) return
    // Chief Engineer PIN gate: only the master drydocking tier resets the odometer.
    if (isDrydock) {
      setPin('')
      setPinError('')
      setPinOpen(true)
      return
    }
    complete()
  }

  const cancelPin = () => {
    setPinOpen(false)
    setPin('')
    setPinError('')
  }

  const confirmDrydock = () => {
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

  const attachPhoto = (task: PMSTask, file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      notify('Photographic evidence must be an image file (JPG / PNG).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      notify('Photo exceeds the 5 MB limit — attach a smaller image.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setTaskIssue(checklist.id, task.id, task.findings ?? '', String(reader.result))
    reader.onerror = () => notify('Could not read that file — try another photo.')
    reader.readAsDataURL(file)
  }

  return (
    <>
      <div className="tech-dashboard-header">
        <div className="tech-header-text">
          <span className="tech-header-kicker">{consoleTitle} · PMS Task Execution</span>
          <h1>{label}</h1>
          <p>
            {engineTab.label} · {engineTab.className === 'main' ? 'Main Engine' : 'Auxiliary Generator'} ·{' '}
            {activeVessel.name}
          </p>
        </div>
        <div className="tech-header-actions">
          <Link to="/chief-engineer/pms" className="button button-secondary button-lg">
            <ArrowLeft size={15} aria-hidden="true" /> Back to Dashboard
          </Link>
        </div>
      </div>

      <section className="tech-panel" aria-label={`${label} execution for ${engineTab.label}`}>
        <header className="tech-panel-header">
          <div>
            <h2>
              {engineTab.label} — {label}
            </h2>
            <p>Consolidated task list · condition reporting with defect evidence</p>
          </div>
          {readOnly && (
            <span className="tech-status-badge tech-status-completed inline-flex items-center gap-1.5">
              <CheckCheck size={13} aria-hidden="true" /> Signed Off
            </span>
          )}
        </header>

        <div className="grid gap-4 p-4 sm:p-5">
          {/* Current odometer for this engine + due status of this routine. */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#d4d4d4] bg-[#f9fafb] p-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[.08em] text-[#5f6873]">
                Current PMS Odometer (Elapsed) · {engineTab.label}
              </span>
              <div className="mt-1 flex items-end gap-2">
                <strong className="text-4xl font-black tabular-nums leading-none text-[#111820]">
                  {odometer.toFixed(1)}
                </strong>
                <span className="pb-1 text-[11px] font-black uppercase tracking-widest text-[#7c8994]">HRS</span>
              </div>
            </div>
            <div className="text-right">
              {readOnly ? (
                <>
                  <span className="tech-status-badge tech-status-completed">
                    Signed off at {(checklist.completedOdometer ?? 0).toFixed(1)} H
                  </span>
                  <p className="mt-1.5 text-[11px] font-bold text-[#7c8994]">
                    Next due at {nextDue.toLocaleString('en-US')} H
                  </p>
                </>
              ) : due ? (
                <>
                  <span className="tech-status-badge tech-status-overdue inline-flex items-center gap-1.5">
                    <AlertTriangle size={12} aria-hidden="true" /> Due Now
                  </span>
                  <p className="mt-1.5 text-[11px] font-bold text-[#7c8994]">
                    {hours.toLocaleString('en-US')} H interval crossed · re-arms after sign-off
                  </p>
                </>
              ) : (
                <>
                  <span className="tech-status-badge tech-status-scheduled">Scheduled</span>
                  <p className="mt-1.5 text-[11px] font-bold text-[#7c8994]">
                    Next due at {nextDue.toLocaleString('en-US')} H · {remaining.toFixed(1)} H remaining
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Consolidated task list with 3-state condition reporting. */}
          <ul className="grid gap-3">
            {checklist.tasks.map((task, index) => (
              <li key={task.id} className="rounded-lg border border-[#e2e7ea] bg-white p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-[#cdd3d8] bg-[#f4f6f7] text-[11px] font-black text-[#526475]">
                    {index + 1}
                  </span>
                  <p className="flex-1 text-sm font-bold leading-snug text-[#283746]">{task.label}</p>
                </div>

                <div
                  role="group"
                  aria-label={`Condition for: ${task.label}`}
                  className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3"
                >
                  {CONDITION_OPTIONS.map((option) => {
                    const active = task.condition === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        disabled={readOnly}
                        onClick={() => setTaskCondition(checklist.id, task.id, option.value)}
                        className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-black uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-70 ${
                          active ? option.active : option.idle
                        }`}
                      >
                        {option.icon}
                        {option.label}
                      </button>
                    )
                  })}
                </div>

                {/* Conditional defect inputs — rendered only for Issue Found tasks. */}
                {task.condition === 'issue' && (
                  <div className="mt-3 grid gap-3 rounded-lg border border-[#efd181] bg-[#fffbe9] p-3">
                    <label className="grid gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#775000]">
                        Findings / Corrective Action
                      </span>
                      <textarea
                        rows={3}
                        value={task.findings ?? ''}
                        disabled={readOnly}
                        onChange={(event) => setTaskIssue(checklist.id, task.id, event.target.value, task.photoDataUrl)}
                        placeholder="Describe the defect, measurements taken, and the corrective action…"
                        className="w-full resize-none rounded-md border border-[#d9c78a] bg-white p-2.5 text-sm font-medium text-[#293b4a] outline-none placeholder:text-[#a4a08c] focus:border-[#b58a1e] disabled:bg-[#f7f4ea]"
                      />
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <label
                        className={`inline-flex items-center gap-2 rounded-md border border-[#d9c78a] bg-white px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[#775000] transition hover:bg-[#fff7de] ${
                          readOnly ? 'pointer-events-none opacity-70' : 'cursor-pointer'
                        }`}
                      >
                        <Camera size={15} aria-hidden="true" />
                        {task.photoDataUrl ? 'Replace Photo' : 'Camera / File Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={readOnly}
                          onChange={(event) => {
                            attachPhoto(task, event.target.files?.[0])
                            event.target.value = ''
                          }}
                        />
                      </label>
                      {task.photoDataUrl && (
                        <div className="flex items-center gap-2 rounded-md border border-[#d9c78a] bg-white p-1.5">
                          <img
                            src={task.photoDataUrl}
                            alt={`Defect evidence for: ${task.label}`}
                            className="size-12 rounded object-cover"
                          />
                          <button
                            type="button"
                            disabled={readOnly}
                            aria-label="Remove attached photo"
                            onClick={() => setTaskIssue(checklist.id, task.id, task.findings ?? '')}
                            className="grid size-8 place-items-center rounded border border-[#e3c9a0] bg-[#fff7de] text-[#9a5b00] transition hover:bg-[#ffe9b8] disabled:opacity-60"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Progress + sign-off bar. */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d4d4d4] bg-[#f9fafb] p-4">
            <div className="grid gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="tech-status-badge tech-status-completed">
                  {resolved}/{total} Resolved
                </span>
                {issueCount > 0 && (
                  <span className="tech-status-badge tech-status-due-soon">
                    {issueCount} Issue{issueCount > 1 ? 's' : ''}
                  </span>
                )}
                {naCount > 0 && <span className="tech-status-badge tech-status-scheduled">{naCount} N/A</span>}
              </div>
              <p className="text-[11px] font-medium text-[#7c8994]">
                {readOnly
                  ? `Signed off${checklist.completedAt ? ` ${new Date(checklist.completedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''} · read-only view`
                  : 'Resolve every task (Done / Issue Found / N/A) to enable sign-off.'}
              </p>
            </div>
            {!readOnly && (
              <button
                type="button"
                className="button button-success button-lg"
                disabled={!allResolved}
                onClick={handleSignoff}
              >
                <CheckCheck size={15} aria-hidden="true" /> Sign Off Checklist
                {isDrydock ? ' (Chief Engineer PIN)' : ''}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Chief Engineer PIN gate — master drydocking sign-off resets the odometer. */}
      {pinOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cancelPin()
          }}
        >
          <section className="signoff-dialog" role="dialog" aria-modal="true" aria-labelledby="drydock-pin-title">
            <header className="signoff-header">
              <span className="signoff-icon" aria-hidden="true">
                <ShieldCheck size={20} />
              </span>
              <div>
                <h2 id="drydock-pin-title">Drydocking Sign-off</h2>
                <p>
                  {label} · {engineTab.label} · {activeVessel.name}
                </p>
              </div>
              <button type="button" className="signoff-close" aria-label="Close drydocking sign-off" onClick={cancelPin}>
                <X size={16} />
              </button>
            </header>

            <div className="signoff-body">
              <p className="rounded-lg border border-[#e2e7ea] bg-[#f9fafb] p-3 text-sm font-bold leading-relaxed text-[#465560]">
                Signing off resets {engineTab.label}'s PMS odometer to 0.0 H and starts a fresh 12,000-Hour epoch.
                Every other routine restarts from its first interval.
              </p>

              <div className="signoff-field signoff-field-center">
                <span id="drydock-pin-label">Chief Engineer PIN</span>
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
                    aria-labelledby="drydock-pin-label"
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
                onClick={confirmDrydock}
              >
                Confirm &amp; Reset Odometer
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  )
}
