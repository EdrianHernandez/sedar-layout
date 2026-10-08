import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Camera, Check, CheckCheck, Trash2 } from 'lucide-react'
import type { PMSTask, TaskCondition } from '../../types/pmsChecklist'
import {
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
}

// Single-field masked text inputs replace the native pickers so the display
// format is locale-proof: date always renders MM/DD/YYYY, time always 24-hour
// HH:mm (22:18, never 10:18 PM). The field is plain table text until focused —
// no native picker involved.
const maskDateDigits = (input: string) => {
  const digits = input.replace(/\D/g, '').slice(0, 8)
  if (!digits) return ''
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/')
}

const maskTimeDigits = (input: string) => {
  const digits = input.replace(/\D/g, '').slice(0, 4)
  if (!digits) return ''
  const hours = digits.slice(0, 2)
  const minutes = digits.slice(2)
  return minutes ? `${hours}:${minutes}` : hours
}

interface MaskedInputProps {
  value: string
  placeholder: string
  maxLength: number
  ariaLabel: string
  disabled?: boolean
  mask: (input: string) => string
  parse: (display: string) => Date | null
  onCommit: (date: Date) => void
}

// Controlled digit-masked field: the draft lives locally so typing is free, a
// fully valid value commits immediately (subject to the future-time guard), and
// blur reverts half-typed text to the stored value. One seamless input — the
// mask auto-inserts separators as digits are typed ("10082026" → "10/08/2026").
function MaskedInput({
  value,
  placeholder,
  maxLength,
  ariaLabel,
  disabled,
  mask,
  parse,
  onCommit,
}: MaskedInputProps) {
  const [draft, setDraft] = useState(value)
  const [synced, setSynced] = useState(value)
  // Re-sync during render when the stored value changes (status auto-stamp,
  // another field's commit) — no effect needed, typing never clobbers the draft.
  if (value !== synced) {
    setSynced(value)
    setDraft(value)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={ariaLabel}
      placeholder={placeholder}
      maxLength={maxLength}
      value={draft}
      disabled={disabled}
      onChange={(event) => {
        const next = mask(event.target.value)
        setDraft(next)
        const parsed = parse(next)
        if (parsed) onCommit(parsed)
      }}
      onBlur={() => setDraft(value)}
      className="mx-auto w-full max-w-[100px] rounded border border-transparent bg-transparent px-2 py-1.5 text-center text-sm text-slate-800 outline-none transition placeholder:text-[#b3bcc4] focus:border-gray-300 focus:bg-white focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:text-[#9aa7b2]"
    />
  )
}

// Module scope (not render): a datetime-local value is invalid if it lies in the
// future — inspections can be backdated, never scheduled ahead.
const isFutureLocalTime = (localValue: string): boolean => {
  const time = new Date(localValue).getTime()
  return !Number.isNaN(time) && time > Date.now()
}

// Strict binary condition reporting: every task must be resolved (Done / Issue)
// before the checklist can be submitted. The Issue state turns the REMARKS cell
// into a required defect description with photo evidence.
const CONDITION_OPTIONS: ConditionOption[] = [
  {
    value: 'done',
    label: 'Done',
    icon: <Check size={15} aria-hidden="true" />,
    active: 'bg-green-600 text-white',
  },
  {
    value: 'issue',
    label: 'Issue',
    icon: <AlertTriangle size={15} aria-hidden="true" />,
    active: 'bg-red-600 text-white',
  },
]

// Dedicated Task Execution Screen for one engine + interval: reached from a card's
// START/VIEW CHECKLIST navigation (never expanded in place on the dashboard).
export function ChiefEngineerPmsExecutePage() {
  const { engineId: engineParam, interval: intervalParam } = useParams()
  const { logs, checklists, setTaskCondition, setTaskRemarks, setTaskLoggedAt, notify } =
    useChiefEngineer()
  const navigate = useNavigate()

  // Error sequence for the Review Summary action: targets the first task that
  // blocks submission (row highlight + shake) until the timer clears it. Hooks
  // live above the route-validation returns below.
  const [validation, setValidation] = useState<{ taskId: string; kind: 'status' | 'remarks' } | null>(null)
  const clearTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(clearTimer.current), [])

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
  // ISSUE rows must describe the defect before the routine can be reviewed.
  const missingRemarks = checklist.tasks.filter((task) => task.condition === 'issue' && !task.findings?.trim()).length
  const reviewBlockedReason =
    !allResolved
      ? 'Resolve every task (Done / Issue Found) to continue.'
      : missingRemarks > 0
        ? 'Describe the defect on every Issue row to continue.'
        : undefined
  const nextDue = nextDueHours(hours, checklist.completedOdometer)
  const remaining = remainingToDue(odometer, hours, checklist.completedOdometer)
  const label = PMS_INTERVAL_LABELS[interval]

  // Submission moved to the full-screen Review Summary step — the button stays
  // clickable and validates on click: instead of silently doing nothing, it
  // scrolls the first blocking task into view, shakes it, and toasts why.
  const handleReviewClick = () => {
    if (readOnly) return
    const firstProblem = checklist.tasks.find(
      (task) =>
        task.condition === 'pending' || (task.condition === 'issue' && !task.findings?.trim()),
    )
    if (!firstProblem) {
      navigate(`/chief-engineer/pms/execute/${engineTab.id}/${interval}/review`)
      return
    }
    const kind: 'status' | 'remarks' = firstProblem.condition === 'pending' ? 'status' : 'remarks'
    // Clear first so repeated clicks restart the CSS shake/highlight animations.
    setValidation(null)
    window.requestAnimationFrame(() => setValidation({ taskId: firstProblem.id, kind }))
    window.clearTimeout(clearTimer.current)
    clearTimer.current = window.setTimeout(() => setValidation(null), 2200)
    document
      .querySelector(`[data-pms-row="${firstProblem.id}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (kind === 'remarks') {
      document
        .querySelector<HTMLInputElement>(`[data-remarks-input="${firstProblem.id}"]`)
        ?.focus({ preventScroll: true })
    }
    notify(
      kind === 'remarks'
        ? 'Cannot proceed: Please provide remarks for all reported issues.'
        : 'Cannot proceed: Please set a status (Done / Issue) for all tasks.',
    )
  }

  // Locale-proof display formats for the masked DATE / TIME cells.
  const pad2 = (value: number) => String(value).padStart(2, '0')
  const formatMmDdYyyy = (iso?: string) => {
    if (!iso) return ''
    const date = new Date(iso)
    return `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}/${date.getFullYear()}`
  }
  const formatHhMm = (iso?: string) => {
    if (!iso) return ''
    const date = new Date(iso)
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
  }

  // Local "YYYY-MM-DDTHH:mm" stamp for the future-time guard — inspections can be
  // backdated, never scheduled ahead.
  const toLocalStamp = (date: Date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`

  const commitLoggedAt = (task: PMSTask, date: Date) => {
    if (isFutureLocalTime(toLocalStamp(date))) {
      notify('An inspection cannot be logged in the future.')
      return
    }
    setTaskLoggedAt(checklist.id, task.id, date.toISOString())
  }

  // "MM/DD/YYYY" → Date, folded onto the row's existing time-of-day (now when
  // unset). Round-trip check rejects impossible dates like 13/40/2026.
  const parseDateText = (task: PMSTask, display: string): Date | null => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display)
    if (!match) return null
    const month = Number(match[1])
    const day = Number(match[2])
    const year = Number(match[3])
    const base = task.loggedAt ? new Date(task.loggedAt) : new Date()
    const date = new Date(year, month - 1, day, base.getHours(), base.getMinutes())
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) return null
    return date
  }

  // Strict 24-hour "HH:mm" → Date, folded onto the row's existing date (today
  // when unset). The regex admits 00:00–23:59 only — no AM/PM anywhere.
  const parseTimeText = (task: PMSTask, display: string): Date | null => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(display)
    if (!match) return null
    const base = task.loggedAt ? new Date(task.loggedAt) : new Date()
    return new Date(base.getFullYear(), base.getMonth(), base.getDate(), Number(match[1]), Number(match[2]))
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
    reader.onload = () => setTaskRemarks(checklist.id, task.id, task.findings ?? '', String(reader.result))
    reader.onerror = () => notify('Could not read that file — try another photo.')
    reader.readAsDataURL(file)
  }

  return (
    <>
      {/* Full-bleed sticky top-bar: solid background + crisp 2px rule so checklist
          rows scroll cleanly underneath; -mx/px restores the workspace padding so the
          inner content sits flush with the table below (same gutters as the monitoring
          page). Palette: brand navy #082342, brand orange #ff4d2f, grays, white.
          Built with pure Tailwind — the legacy .tech-* and .button-success rules are
          unlayered and would outbid layered utilities, so recolored elements drop those
          classes instead of trying to override them. */}
      <header className="sticky top-0 z-10 -mx-5 border-b-2 border-slate-300 bg-white px-5 py-4 shadow-[0_1px_3px_rgba(2,18,36,0.06)] max-md:-mx-3.5 max-md:px-3.5">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-[19px] leading-tight">
              <span className="font-medium text-gray-500">{engineTab.label}</span>
              <span className="mx-1.5 font-medium text-gray-400">—</span>
              <span className="font-bold text-[#082342]">{label}</span>
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500">
              <span className="tabular-nums">Odometer: {odometer.toFixed(1)} HRS</span>
              {readOnly ? (
                <span className="tech-status-badge tech-status-completed">
                  Signed Off · Next due {nextDue.toLocaleString('en-US')} H
                </span>
              ) : due ? (
                <span className="tech-status-badge inline-flex items-center gap-1.5 bg-[#ff4d2f] text-white shadow-sm">
                  <AlertTriangle size={12} aria-hidden="true" /> Due Now
                </span>
              ) : (
                <span className="tech-status-badge tech-status-scheduled">
                  Scheduled · {remaining.toFixed(1)} H remaining
                </span>
              )}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              to="/chief-engineer/pms"
              className="group inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold text-gray-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              Back to Dashboard
            </Link>
            {readOnly ? (
              <span className="whitespace-nowrap text-[11px] font-bold tabular-nums text-slate-500">
                {resolved}/{total} Resolved
              </span>
            ) : (
              <button
                type="button"
                className="button button-lg border border-[#04121f] bg-[#082342] text-white shadow-sm transition hover:bg-[#0e3157] hover:shadow-md active:translate-y-px"
                title={reviewBlockedReason}
                onClick={handleReviewClick}
              >
                <CheckCheck size={15} aria-hidden="true" /> Review Summary ({resolved}/{total}){' '}
                {issueCount > 0 && (
                  <span className="font-black text-[#ff9b84]">
                    • {issueCount} Issue{issueCount > 1 ? 's' : ''}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Full-width execution table — six columns: TASK, STATUS, DATE, TIME,
          REMARKS (text only), EVIDENCE (photo uploads only). Flush to the
          workspace padding (20px / 14px mobile) to match the monitoring page. */}
      <div className="w-full">
        <div className="overflow-x-auto">
          <div className="min-w-[1100px]">
            {/* Column header row — heavier rule separates headings from task rows;
                the gutter lives as cell padding (px-3) so both rows stay aligned. */}
            <div className="grid grid-cols-[minmax(0,1.7fr)_204px_148px_92px_minmax(240px,1fr)_148px] border-b-2 border-[#e2e7ea] text-[10px] font-black uppercase tracking-[.14em] text-[#7c8994]">
              <div className="px-3 pt-4 pb-2 text-center">Task</div>
              <div className="px-3 pt-4 pb-2 text-center">Status</div>
              <div className="px-3 pt-4 pb-2 text-center">Date</div>
              <div className="px-3 pt-4 pb-2 text-center">Time</div>
              <div className="px-3 pt-4 pb-2 text-center">Remarks</div>
              <div className="px-3 pt-4 pb-2 text-center">Evidence</div>
            </div>

            {checklist.tasks.map((task, index) => {
              const answered = task.condition !== 'pending'
              const isIssue = task.condition === 'issue'
              const remarkMissing = isIssue && !task.findings?.trim()
              return (
                <div
                  key={task.id}
                  data-pms-row={task.id}
                  className={`grid grid-cols-[minmax(0,1.7fr)_204px_148px_92px_minmax(240px,1fr)_148px] border-b border-[#e2e7ea] transition-colors duration-150 ${
                    validation?.taskId === task.id
                      ? 'bg-red-50 hover:bg-red-50 focus-within:bg-red-50'
                      : 'hover:bg-gray-50 focus-within:bg-gray-50'
                  }`}
                >
                  {/* TASK — left-aligned under the centered header; fixed-width
                      number so periods align, inner block keeps it on the first
                      line while the stretched cell centers the block vertically. */}
                  <div className="flex min-w-0 items-center px-3 py-4">
                    <div className="flex min-w-0 items-start pt-0.5">
                      <span className="mr-3 w-6 shrink-0 text-right text-xs font-black text-[#7c8994]">
                        {index + 1}.
                      </span>
                      <p className="min-w-0 text-sm font-semibold leading-snug text-[#283746]">{task.label}</p>
                    </div>
                  </div>

                  {/* STATUS — discrete pills; the active one floods solid green/red
                      while its sibling stays a gray ghost. */}
                  <div
                    role="group"
                    aria-label={`Condition for: ${task.label}`}
                    className={`flex items-center justify-center gap-2 px-3 py-4 ${
                      validation?.taskId === task.id && validation.kind === 'status' ? 'pms-shake' : ''
                    }`}
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
                          className={`flex items-center justify-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition disabled:pointer-events-none ${
                            active
                              ? option.active
                              : 'border border-gray-300 bg-transparent text-gray-400 hover:border-gray-400 hover:text-gray-500'
                          }`}
                        >
                          {option.icon}
                          {option.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* DATE — single seamless MM/DD/YYYY masked field; first status pick stamps it. */}
                  <div className="flex items-center justify-center px-3 py-4 text-center">
                    <MaskedInput
                      value={formatMmDdYyyy(task.loggedAt)}
                      placeholder="MM/DD/YYYY"
                      maxLength={10}
                      ariaLabel={`Inspection date for: ${task.label}`}
                      disabled={readOnly}
                      mask={maskDateDigits}
                      parse={(display) => parseDateText(task, display)}
                      onCommit={(date) => commitLoggedAt(task, date)}
                    />
                  </div>

                  {/* TIME — single seamless strict 24-hour HH:mm masked field; auto-injects 22:18. */}
                  <div className="flex items-center justify-center px-3 py-4 text-center">
                    <MaskedInput
                      value={formatHhMm(task.loggedAt)}
                      placeholder="HH:MM"
                      maxLength={5}
                      ariaLabel={`Inspection time for: ${task.label}`}
                      disabled={readOnly}
                      mask={maskTimeDigits}
                      parse={(display) => parseTimeText(task, display)}
                      onCommit={(date) => commitLoggedAt(task, date)}
                    />
                  </div>

                  {/* REMARKS — text input only; photo evidence lives in the next
                      column. An ISSUE row without remarks is invalid until fixed:
                      red border, helper text, and (on a failed Review click) a shake. */}
                  <div className="flex min-w-0 flex-col justify-center px-3 py-4">
                    <input
                      type="text"
                      data-remarks-input={task.id}
                      value={task.findings ?? ''}
                      disabled={readOnly || !answered}
                      aria-invalid={remarkMissing}
                      placeholder={
                        !answered ? 'Awaiting status…' : isIssue ? 'Describe defect…' : 'Optional remarks…'
                      }
                      onChange={(event) =>
                        setTaskRemarks(checklist.id, task.id, event.target.value, task.photoDataUrl)
                      }
                      className={`w-full rounded-md border px-2.5 py-1.5 text-xs font-medium text-[#293b4a] outline-none transition placeholder:font-normal disabled:cursor-not-allowed disabled:bg-[#f7f8f9] disabled:text-[#9aa7b2] ${
                        remarkMissing
                          ? 'border-[#dc2626] bg-[#fff7f7] placeholder:text-[#e09090] focus:border-[#dc2626]'
                          : 'border-[#cdd3d8] bg-white placeholder:text-[#9aa7b2] focus:border-[#5b8fb5]'
                      }${validation?.taskId === task.id && validation.kind === 'remarks' ? ' pms-shake' : ''}`}
                    />
                    {remarkMissing && (
                      <p className="mt-1 text-[11px] font-semibold text-red-500">* Required field</p>
                    )}
                  </div>

                  {/* EVIDENCE — photo uploads only, centered. Dash until an Issue
                      claims a photo; then thumbnail (click to replace) + remove. */}
                  <div className="flex min-w-0 items-center justify-center px-3 py-4">
                    {isIssue && task.photoDataUrl ? (
                      <div className="flex items-center gap-1">
                        <label
                          title="Replace evidence photo"
                          className="cursor-pointer rounded border border-[#d9c78a] bg-[#fffbe9] p-0.5 transition hover:bg-[#fff4cf]"
                        >
                          <img
                            src={task.photoDataUrl}
                            alt={`Defect evidence for: ${task.label}`}
                            className="size-8 rounded object-cover"
                          />
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
                        {!readOnly && (
                          <button
                            type="button"
                            aria-label="Remove attached photo"
                            title="Remove photo"
                            onClick={() => setTaskRemarks(checklist.id, task.id, task.findings ?? '')}
                            className="grid size-5 place-items-center rounded text-[#9a5b00] transition hover:bg-[#ffe9b8]"
                          >
                            <Trash2 size={12} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    ) : isIssue && !readOnly ? (
                      <label
                        title="Upload evidence photo"
                        className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-[#c9971b] bg-[#fffbe9] px-2.5 py-1.5 text-[11px] font-bold text-[#8a5b00] transition hover:bg-[#fff1c9]"
                      >
                        <Camera size={13} aria-hidden="true" />
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(event) => {
                            attachPhoto(task, event.target.files?.[0])
                            event.target.value = ''
                          }}
                        />
                      </label>
                    ) : (
                      <span className="text-[#b6bfc7]">—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
