import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Camera, Check, CheckCheck, Pencil, Trash2, X } from 'lucide-react'
import type { PMSTask, TaskCondition } from '../../types/pmsChecklist'
import {
  consoleTitle,
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

// Module scope (not render): a datetime-local value is invalid if it lies in the
// future — inspections can be backdated, never scheduled ahead.
const isFutureLocalTime = (localValue: string): boolean => {
  const time = new Date(localValue).getTime()
  return !Number.isNaN(time) && time > Date.now()
}

// Strict binary condition reporting: every task must be resolved (Done / Issue Found)
// before the checklist can be submitted. Issue Found reveals the mandatory remarks
// and evidence inputs below its row.
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
]

// Dedicated Task Execution Screen for one engine + interval: reached from a card's
// START/VIEW CHECKLIST navigation (never expanded in place on the dashboard).
export function ChiefEngineerPmsExecutePage() {
  const { engineId: engineParam, interval: intervalParam } = useParams()
  const { logs, checklists, setTaskCondition, setTaskIssue, setTaskLoggedAt, notify } =
    useChiefEngineer()
  const navigate = useNavigate()
  // Manual timestamp override: which task is being edited + its datetime-local draft.
  const [tsTask, setTsTask] = useState<PMSTask | null>(null)
  const [tsDraft, setTsDraft] = useState('')
  const [tsError, setTsError] = useState('')
  const tsInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!tsTask) return
    tsInputRef.current?.focus()
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setTsTask(null)
      setTsError('')
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [tsTask])

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
  const allResolved = resolved === total
  const nextDue = nextDueHours(hours, checklist.completedOdometer)
  const remaining = remainingToDue(odometer, hours, checklist.completedOdometer)
  const label = PMS_INTERVAL_LABELS[interval]

  // Submission moved to the full-screen Review Summary step — this button only
  // routes there once every task carries a condition.
  const openReview = () => {
    if (readOnly || !allResolved) return
    navigate(`/chief-engineer/pms/execute/${engineTab.id}/${interval}/review`)
  }

  // Compact logged-time display: "Oct 5, 10:45 AM".
  const formatLoggedAt = (iso: string) =>
    new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  // datetime-local needs a local "YYYY-MM-DDTHH:mm" string (no timezone, no seconds).
  const toLocalInputValue = (iso: string) => {
    const date = new Date(iso)
    const pad = (value: number) => String(value).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const openTsEditor = (task: PMSTask) => {
    if (!task.loggedAt) return
    setTsDraft(toLocalInputValue(task.loggedAt))
    setTsError('')
    setTsTask(task)
  }

  const cancelTsEditor = () => {
    setTsTask(null)
    setTsError('')
  }

  const saveTsEditor = () => {
    if (!tsTask) return
    const date = new Date(tsDraft)
    if (Number.isNaN(date.getTime())) {
      setTsError('Pick a valid date and time.')
      return
    }
    if (isFutureLocalTime(tsDraft)) {
      setTsError('An inspection cannot be logged in the future.')
      return
    }
    setTaskLoggedAt(checklist.id, tsTask.id, date.toISOString())
    setTsTask(null)
    setTsError('')
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
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              {engineTab.label} · {engineTab.className === 'main' ? 'Main Engine' : 'Auxiliary Generator'} · Odometer
              at execution: {odometer.toFixed(1)} HRS
            </span>
            {readOnly ? (
              <span className="tech-status-badge tech-status-completed">
                Signed Off · Next due {nextDue.toLocaleString('en-US')} H
              </span>
            ) : due ? (
              <span className="tech-status-badge tech-status-overdue inline-flex items-center gap-1.5">
                <AlertTriangle size={12} aria-hidden="true" /> Due Now
              </span>
            ) : (
              <span className="tech-status-badge tech-status-scheduled">
                Scheduled · {remaining.toFixed(1)} H remaining
              </span>
            )}
          </p>
        </div>
        <div className="tech-header-actions">
          <span className="tech-status-badge tech-status-completed">
            {resolved}/{total} Resolved
          </span>
          {issueCount > 0 && (
            <span className="tech-status-badge tech-status-due-soon">
              {issueCount} Issue{issueCount > 1 ? 's' : ''}
            </span>
          )}
          <Link to="/chief-engineer/pms" className="button button-secondary button-lg">
            <ArrowLeft size={15} aria-hidden="true" /> Back to Dashboard
          </Link>
          {!readOnly && (
            <button
              type="button"
              className="button button-success button-lg"
              disabled={!allResolved}
              title={allResolved ? undefined : 'Resolve every task (Done / Issue Found) to continue.'}
              onClick={openReview}
            >
              <CheckCheck size={15} aria-hidden="true" /> Review Summary
            </button>
          )}
        </div>
      </div>

      {/* Flat task list on the page background — no panel card, no duplicate inner header
          (the main page header above owns the title and odometer metadata). */}
      <div className="grid gap-4">
        <ul className="border-y border-[#e2e7ea]">
          {checklist.tasks.map((task, index) => (
            <li
              key={task.id}
              className="flex flex-wrap items-start gap-x-4 gap-y-2 border-b border-[#e2e7ea] py-3 last:border-b-0"
            >
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <span className="w-5 shrink-0 text-right text-xs font-black text-[#7c8994]">{index + 1}.</span>
                <p className="text-sm font-bold leading-snug text-[#283746]">{task.label}</p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <div
                  role="group"
                  aria-label={`Condition for: ${task.label}`}
                  className="inline-flex gap-1.5"
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
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-70 ${
                          active ? option.active : option.idle
                        }`}
                      >
                        {option.icon}
                        {option.label}
                      </button>
                    )
                  })}
                </div>

                {/* Auto-captured inspection time — tucked under the buttons, right-aligned. */}
                {task.condition !== 'pending' && task.loggedAt && (
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-[10px] font-bold text-[#5f6873]">
                      Logged: {formatLoggedAt(task.loggedAt)}
                    </span>
                    {!readOnly && (
                      <button
                        type="button"
                        aria-label={`Edit logged time for: ${task.label}`}
                        title="Edit logged time"
                        onClick={() => openTsEditor(task)}
                        className="grid size-5 place-items-center rounded border border-[#cdd3d8] bg-white text-[#526475] transition hover:bg-[#f4f6f7]"
                      >
                        <Pencil size={11} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}
              </div>

                {/* Conditional defect inputs — rendered only for Issue Found tasks. */}
                {task.condition === 'issue' && (
                  <div className="basis-full grid gap-3 rounded-lg border border-[#efd181] bg-[#fffbe9] p-3">
                    <label className="grid gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#775000]">
                        Remarks / Findings <em className="not-italic text-[#b5451d]">*</em>
                      </span>
                      <textarea
                        rows={3}
                        required
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
                        {task.photoDataUrl ? 'Replace Evidence' : 'Upload Evidence'}
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
        </div>

      {/* Manual timestamp override — backdate to the actual physical inspection time. */}
      {tsTask && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cancelTsEditor()
          }}
        >
          <section className="signoff-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-time-title">
            <header className="signoff-header">
              <span className="signoff-icon" aria-hidden="true">
                <Pencil size={18} />
              </span>
              <div>
                <h2 id="edit-time-title">Edit Logged Time</h2>
                <p>
                  {tsTask.label} · {label}
                </p>
              </div>
              <button
                type="button"
                className="signoff-close"
                aria-label="Close logged time editor"
                onClick={cancelTsEditor}
              >
                <X size={16} />
              </button>
            </header>

            <div className="signoff-body">
              <p className="rounded-lg border border-[#e2e7ea] bg-[#f9fafb] p-3 text-sm font-bold leading-relaxed text-[#465560]">
                Override the auto-captured time to the exact moment the physical inspection
                was conducted. Backdating is allowed; future times are not.
              </p>
              <label className="signoff-field">
                <span>Inspection Date &amp; Time <em>*</em></span>
                <input
                  ref={tsInputRef}
                  className="signoff-control"
                  type="datetime-local"
                  value={tsDraft}
                  max={toLocalInputValue(new Date().toISOString())}
                  aria-label="Inspection date and time"
                  aria-invalid={Boolean(tsError)}
                  onChange={(event) => {
                    setTsDraft(event.target.value)
                    setTsError('')
                  }}
                />
              </label>
              {tsError && (
                <span className="signoff-error" role="alert">
                  {tsError}
                </span>
              )}
            </div>

            <footer className="signoff-actions">
              <button type="button" className="button button-secondary" onClick={cancelTsEditor}>
                Cancel
              </button>
              <button
                type="button"
                className="button button-success"
                disabled={!tsDraft}
                onClick={saveTsEditor}
              >
                Save Timestamp
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  )
}
