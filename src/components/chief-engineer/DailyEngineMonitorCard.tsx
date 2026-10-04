import { useCallback, useEffect, type ReactNode } from 'react'
import { Minus, Plus, Fuel, Clock, Activity, AlertTriangle, ChevronDown, Droplet, Droplets } from 'lucide-react'
import { useEngineRoom } from '../../context/engineRoomStore'
import type { EngineLog } from '../../types/engineLog'
import type { PMSInterval } from '../../types/pmsChecklist'
import { ENGINE_TABS, PMS_INTERVALS, type MonitorTabId } from '../../data/chiefEngineerMockData'
import { computeWatchDurationHours, currentClockTime } from '../../utils/engineLog'

interface DailyEngineMonitorCardProps {
  log: EngineLog
  activeTab: MonitorTabId
  onTabChange: (tab: MonitorTabId) => void
  onUpdate: (log: EngineLog) => void
  readOnly?: boolean
  stopError?: boolean
}

interface MetricStepperProps {
  label: string
  unit: string
  value: number
  min: number
  max: number
  step: number
  decimals?: number
  disabled?: boolean
  icon?: ReactNode
  onChange: (value: number) => void
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

// Shared geometry, focus ring and hover lift for every Row-1 control; each control
// layers its own skin on top — white for the time inputs, a status tint for the select.
const FIELD_BASE =
  'h-14 w-full rounded-lg border-2 transition focus:border-[#315d82] focus:ring-2 focus:ring-[#315d82]/15 disabled:cursor-not-allowed'
const FIELD_LIFT = 'hover:shadow-[0_1px_3px_rgba(16,24,40,0.10)] disabled:hover:shadow-none'

const FIELD_SHELL = `${FIELD_BASE} ${FIELD_LIFT} border-slate-300 bg-white hover:border-slate-400 disabled:hover:border-slate-300`

const TIME_INPUT_CLS = `${FIELD_SHELL} px-4 text-center text-xl font-black tabular-nums text-slate-900 outline-none placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400`

const STATUS_SELECT_CLS = `${FIELD_BASE} ${FIELD_LIFT} cursor-pointer appearance-none pl-10 pr-11 text-base font-black uppercase tracking-wider outline-none disabled:opacity-60`

const ROW_LABEL_CLS = 'text-[11px] font-extrabold uppercase tracking-[.08em] text-[#5f6873]'

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

// Masked 24-hour entry: digits only (max 4) with the colon auto-inserted after HH, so
// typing 2,1,0,1 yields "21:01" — never AM/PM, never browser locale formatting.
function maskTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits
}

// On blur, complete and clamp a partial entry to strict HH:MM: "9" → "09:00",
// "21" → "21:00", "213" → "21:30"; hours ≤ 23, minutes ≤ 59; empty stays empty
// (the stop-required gate and the NO-OPERATION repair own the empty case).
function completeTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (!digits) return ''
  const hours = Math.min(23, Number(digits.slice(0, 2).padStart(2, '0')))
  const minutes = Math.min(59, Number(digits.slice(2).padEnd(2, '0')))
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

const DONUT_CIRCUMFERENCE = 2 * Math.PI * 34

const PMS_TONES = {
  critical: {
    accent: 'border-t-red-500',
    track: 'text-red-100',
    ring: 'text-red-600',
    percent: 'text-red-600',
    chip: 'border-red-300 bg-red-100 text-red-700',
    value: 'text-red-700',
    label: 'text-red-700/80',
    helper: 'text-red-800/70',
  },
  warning: {
    accent: 'border-t-amber-500',
    track: 'text-amber-100',
    ring: 'text-amber-500',
    percent: 'text-amber-600',
    chip: 'border-amber-300 bg-amber-100 text-amber-800',
    value: 'text-amber-700',
    label: 'text-amber-700/80',
    helper: 'text-amber-800/70',
  },
  normal: {
    accent: 'border-t-blue-500',
    track: 'text-blue-100',
    ring: 'text-blue-600',
    percent: 'text-blue-600',
    chip: 'border-blue-300 bg-blue-100 text-blue-700',
    value: 'text-blue-900',
    label: 'text-blue-700/70',
    helper: 'text-blue-800/70',
  },
} as const

type PmsTone = keyof typeof PMS_TONES

const STATUS_OPTIONS = [
  { id: 'operated', label: 'Operated', bg: 'bg-green-100', text: 'text-green-800', shell: 'border-green-300 bg-green-50 text-green-800 hover:border-green-400', dotRing: 'ring-green-200' },
  { id: 'no-operation', label: 'No Operation', bg: 'bg-amber-100', text: 'text-amber-800', shell: 'border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400', dotRing: 'ring-amber-200' },
  { id: 'standby', label: 'Standby', bg: 'bg-slate-100', text: 'text-slate-700', shell: 'border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-400', dotRing: 'ring-slate-200' },
] as const

type EngineStatus = (typeof STATUS_OPTIONS)[number]['id']

function MetricStepper({ label, unit, value, min, max, step, decimals = 0, disabled = false, icon, onChange }: MetricStepperProps) {
  const bump = (direction: 1 | -1) => {
    onChange(roundTo(clamp(value + step * direction, min, max), decimals))
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-[#d4d4d4] bg-white p-3">
      <span className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[.08em] text-[#5f6873]">{label}</span>
      </span>
      <div className="mt-3 flex flex-row items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => bump(-1)}
          disabled={disabled}
          className="flex w-16 items-center justify-center bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Minus size={24} strokeWidth={3} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center border-x border-slate-200 p-3 focus-within:border-[#4b718f]">
          <input
            type="number"
            inputMode="decimal"
            aria-label={label}
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={(event) => {
              const next = Number(event.target.value)
              onChange(Number.isFinite(next) && next >= 0 ? next : 0)
            }}
            className="no-number-spinner w-full bg-transparent text-center text-3xl font-black tabular-nums leading-none text-[#111820] outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          />
          <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#7c8994]">{unit}</span>
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => bump(1)}
          disabled={disabled}
          className="flex w-16 items-center justify-center bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>
    </div>
  )
}

export function DailyEngineMonitorCard({ log, activeTab, onTabChange, onUpdate, readOnly = false, stopError = false }: DailyEngineMonitorCardProps) {
  const { watchStart, watchStop, setWatchStart, setWatchStop, hydraulicOilAdded, setHydraulicOilAdded } = useEngineRoom()
  const isVesselTab = activeTab === 'VESSEL-FLUIDS'
  const isRunning = Boolean(log.timeStart) && !log.timeStop
  const hasStarted = Boolean(log.timeStart)
  const consumption = Math.max(0, log.fuelRobStart - log.fuelRobStop)

  const activeStatus: EngineStatus = isRunning ? 'operated' : hasStarted ? 'no-operation' : 'standby'
  const activeStatusOption = STATUS_OPTIONS.find((option) => option.id === activeStatus) ?? STATUS_OPTIONS[0]
  const isNoOperation = activeStatus === 'no-operation'

  // Strict auto-calculation: hours run this watch come purely from START TIME → STOP TIME.
  // 0 while NO OPERATION · null while the times are incomplete · otherwise decimal hours (overnight included).
  const watchDelta = activeStatus === 'no-operation' ? 0 : computeWatchDurationHours(watchStart, watchStop)
  // Current Meter = Previous + delta; null until both times exist, so the cards fall back to the previous reading.
  const derivedMeter = watchDelta === null ? null : roundTo(log.meterPrevious + watchDelta, 1)
  const displayMeter = derivedMeter ?? log.meterPrevious
  // Derived from the rounded meter so "TOTAL RUNNING HOURS" and the PMS odometer can never disagree.
  const watchHours = derivedMeter === null ? 0 : roundTo(derivedMeter - log.meterPrevious, 1)

  const sinceOverhaul = Math.max(0, roundTo(displayMeter - log.lastOverhaulMeter, 1))
  const nextInterval: PMSInterval = PMS_INTERVALS.find((interval) => Number(interval.replace('H', '')) > sinceOverhaul) ?? '6000H'
  const intervalHours = Number(nextInterval.replace('H', ''))
  const pmsRemaining = Math.max(0, roundTo(intervalHours - sinceOverhaul, 1))
  const pmsProgress = clamp((sinceOverhaul / intervalHours) * 100, 0, 100)
  const pmsTone: PmsTone = pmsRemaining < 10 ? 'critical' : pmsRemaining < 50 ? 'warning' : 'normal'
  const tone = PMS_TONES[pmsTone]

  // Invariant: ROB Start ≥ ROB Stop, so Fuel Consumed (start − stop) can never go negative.
  // Enforced by the bumpers clamping within the opposite bound, the stop input clamping on every
  // keystroke, and blur correction on both inputs (start is typed freely, then floored to stop).
  const bumpRobStart = (direction: 1 | -1) => {
    onUpdate({ ...log, fuelRobStart: clamp(log.fuelRobStart + 10 * direction, log.fuelRobStop, 999999) })
  }

  const bumpRobStop = (direction: 1 | -1) => {
    onUpdate({ ...log, fuelRobStop: clamp(log.fuelRobStop + 10 * direction, 0, log.fuelRobStart) })
  }

  const selectStatus = useCallback(
    (next: EngineStatus) => {
      if (next === activeStatus) return
      const stamp = new Date().toISOString()
      if (next === 'no-operation') {
        // Explicitly switching to NO OPERATION zeroes consumption once: R.O.B. stop = start,
        // rpm 0. The meter follows automatically through the reconciliation effect below
        // (delta 0 ⇒ meter = previous). No auto-sync afterwards, so recorded stop < start
        // values survive — only a fresh status selection resets them.
        // The watch window resets to the current wall-clock time with STOP matching START, so the
        // duration starts at 0. STOP is disabled while NO OPERATION and kept in step with START
        // by the mirror effect below; total hours remain 0 regardless of the stop value.
        const clock = currentClockTime()
        onUpdate({
          ...log,
          timeStart: log.timeStart ?? stamp,
          timeStop: stamp,
          fuelRobStop: log.fuelRobStart,
          rpm: 0,
        })
        setWatchStart(clock)
        setWatchStop(clock)
      } else if (next === 'operated') {
        onUpdate({ ...log, timeStart: log.timeStart ?? stamp, timeStop: null })
      } else onUpdate({ ...log, timeStart: null, timeStop: null })
    },
    [activeStatus, log, onUpdate, setWatchStart, setWatchStop],
  )

  // Single owner of the auto-derived fields: mirror the computed meter so the Review table and
  // the PMS card stay in agreement. R.O.B. stop is NOT reconciled here — it is reset to start
  // only when the user explicitly picks NO OPERATION in selectStatus, so recorded service-tank
  // consumption (stop < start) persists for logs recorded during the watch.
  // One effect (not two) so two onUpdate calls can never clobber each other's {...log} snapshot.
  // Equality guards make it loop-free; review mode never writes.
  useEffect(() => {
    if (readOnly) return
    const next = { ...log }
    let changed = false
    if (derivedMeter !== null && log.meterCurrent !== derivedMeter) {
      next.meterCurrent = derivedMeter
      changed = true
    }
    if (changed) onUpdate(next)
  }, [derivedMeter, log, onUpdate, readOnly])

  // While NO OPERATION, STOP always mirrors START (duration 0 by construction). The equality guard
  // keeps it loop-free; it also repairs logs that open as NO OPERATION with an empty stop time.
  // While NO OPERATION, STOP mirrors START (duration 0 by construction) because the stop
  // input is disabled here — an edited start would otherwise leave a stale, uneditable stop.
  // The equality guard keeps it loop-free; it also repairs logs that open with an empty stop.
  useEffect(() => {
    if (readOnly || !isNoOperation) return
    if (watchStop === watchStart) return
    setWatchStop(watchStart)
  }, [isNoOperation, readOnly, watchStart, watchStop, setWatchStop])

  const tabBar = (
    <div
      className="profile-tabs shrink-0"
      role="tablist"
      aria-label="Engine selector"
      style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
    >
      {ENGINE_TABS.map((tab) => {
        const active = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTabChange(tab.id)}
            className={active ? 'active flex flex-col items-center justify-center' : 'flex flex-col items-center justify-center'}
          >
            {tab.label}
            <span className="text-[9px] font-semibold opacity-70">
              {tab.className === 'main' ? 'MAIN' : tab.className === 'auxiliary' ? 'AUX' : 'VESSEL'}
            </span>
          </button>
        )
      })}
    </div>
  )

  // Vessel-level tab: hydraulic oil is not tied to an engine, so it gets its own console body
  // (no status / meters / R.O.B. / parameters). Hooks above stay unconditional.
  if (isVesselTab) {
    return (
      <section className="tech-panel tech-console" aria-label="Vessel Fluids">
        {tabBar}
        <div className="tech-console-body flex flex-col p-4 sm:p-5">
          <div>
            <span className="section-header">
              <Droplet size={16} className="text-[#ff4d2f]" aria-hidden="true" />
              <span>Vessel Fluids &amp; General R.O.B.</span>
            </span>
            {/* Expansion point: further vessel-level fluids (e.g. greases) can be added as
                sibling cards in this sm:grid-cols-2 row. */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MetricStepper
                label="Hydraulic Oil Added (68/100/46)"
                unit="L"
                value={hydraulicOilAdded}
                min={0}
                max={9999}
                step={5}
                disabled={readOnly}
                icon={<Droplets size={14} className="text-teal-600" aria-hidden="true" />}
                onChange={setHydraulicOilAdded}
              />
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="tech-panel tech-console" aria-label="Daily Engine Monitor">
      {tabBar}

      <div className="tech-console-body flex flex-col p-4 sm:p-5">
        <div>
          <span className="section-header">
            <Clock size={16} className="text-[#ff4d2f]" aria-hidden="true" />
            <span>Running Hours Log</span>
          </span>

          {/* Row 1 — time & status: inputs plus the computed total side by side. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1">
              <span className={ROW_LABEL_CLS}>Engine Status</span>
              <div className={`relative ${activeStatusOption.text}`}>
                <span
                  className={`pointer-events-none absolute left-3.5 top-1/2 size-3 -translate-y-1/2 rounded-full bg-current ring-2 ${activeStatusOption.dotRing} ${isRunning ? 'animate-pulse' : ''}`}
                  aria-hidden="true"
                />
                <select
                  aria-label="Engine status"
                  value={activeStatus}
                  disabled={readOnly}
                  onChange={(event) => selectStatus(event.target.value as EngineStatus)}
                  className={`${STATUS_SELECT_CLS} peer ${activeStatusOption.shell}`}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id} className={`${option.bg} ${option.text}`}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 opacity-70 peer-disabled:opacity-50"
                  aria-hidden="true"
                >
                  <ChevronDown size={18} />
                </span>
              </div>
            </label>

            <label className="grid gap-1">
              <span className={ROW_LABEL_CLS}>Start Time</span>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="__:__"
                  aria-label="Start time"
                  value={watchStart}
                  disabled={readOnly}
                  onChange={(event) => setWatchStart(maskTimeInput(event.target.value))}
                  onBlur={() => setWatchStart(completeTimeInput(watchStart))}
                  className={`${TIME_INPUT_CLS} peer`}
                />
                <span
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-black tracking-[.12em] text-slate-500 peer-disabled:border-slate-300 peer-disabled:bg-slate-100 peer-disabled:text-slate-400"
                  aria-hidden="true"
                >
                  24H
                </span>
              </div>
            </label>
            <label className="grid gap-1">
              <span className={ROW_LABEL_CLS}>Stop Time (Cut-off)</span>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="__:__"
                  aria-label="Stop time (cut-off)"
                  value={watchStop}
                  disabled={readOnly || isNoOperation}
                  onChange={(event) => setWatchStop(maskTimeInput(event.target.value))}
                  onBlur={() => setWatchStop(completeTimeInput(watchStop))}
                  className={`${TIME_INPUT_CLS} peer${stopError && !watchStop ? ' border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                />
                <span
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-black tracking-[.12em] text-slate-500 peer-disabled:border-slate-300 peer-disabled:bg-slate-100 peer-disabled:text-slate-400"
                  aria-hidden="true"
                >
                  24H
                </span>
              </div>
              {stopError && !watchStop && (
                <span className="text-[10px] font-bold text-red-600">A stop / cut-off time is required before review.</span>
              )}
            </label>

            <div className="grid gap-1">
              <span className={ROW_LABEL_CLS}>Total Running Hours</span>
              <div className="flex h-14 w-full items-center justify-center gap-1.5 rounded-lg border-2 border-emerald-300 bg-emerald-50 px-4">
                <strong className="text-xl font-black tabular-nums leading-none text-emerald-700">{watchHours.toFixed(1)}</strong>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">HRS</span>
              </div>
            </div>
          </div>

          {/* Row 2 — lifetime meter, PMS odometer & maintenance schedule below the time inputs. */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex h-full flex-col rounded-lg border border-[#d4d4d4] bg-white p-3">
              <span className="text-[10px] font-bold uppercase tracking-[.08em] text-[#5f6873]">Lifetime Meter Reading</span>
              <div className="mt-3 flex min-h-14 flex-1 flex-col items-center justify-center">
                <span className="truncate text-3xl font-black tabular-nums leading-none text-[#111820]">
                  {displayMeter.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#7c8994]">HRS</span>
              </div>
            </div>

            <div className="flex h-full flex-col rounded-lg border border-[#d4d4d4] bg-white p-3">
              <span className="text-[10px] font-bold uppercase tracking-[.08em] text-[#5f6873]">PMS Odometer (Elapsed)</span>
              <div className="mt-3 flex min-h-14 flex-1 flex-col items-center justify-center">
                <span className="truncate text-3xl font-black tabular-nums leading-none text-[#111820]">
                  {sinceOverhaul.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#7c8994]">HRS</span>
              </div>
            </div>

            <div className={`flex h-full flex-col rounded-lg border border-[#d4d4d4] border-t-2 ${tone.accent} bg-white p-3 sm:col-span-2 lg:col-span-1`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[.08em] text-[#5f6873]">Next Scheduled PMS</span>
                {pmsTone === 'critical' && (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${tone.chip}`}>
                    <AlertTriangle size={10} aria-hidden="true" /> Critical
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-row items-center gap-3.5">
                <div
                  role="progressbar"
                  aria-label={`${nextInterval} routine progress`}
                  aria-valuenow={Math.round(pmsProgress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="relative size-20 shrink-0"
                >
                  <svg viewBox="0 0 80 80" className="size-20 -rotate-90" aria-hidden="true">
                    <circle cx="40" cy="40" r="34" fill="none" strokeWidth="10" className={`stroke-current ${tone.track}`} />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      strokeWidth="10"
                      strokeLinecap="round"
                      className={`stroke-current transition-[stroke-dashoffset] duration-500 ${tone.ring}`}
                      strokeDasharray={DONUT_CIRCUMFERENCE}
                      strokeDashoffset={DONUT_CIRCUMFERENCE * (1 - pmsProgress / 100)}
                    />
                  </svg>
                  <span className={`absolute inset-0 grid place-items-center text-[11px] font-black tabular-nums ${tone.percent}`}>
                    {Math.round(pmsProgress)}%
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <strong className={`text-5xl font-black tabular-nums leading-none ${tone.value}`}>
                    {pmsRemaining.toFixed(1)}
                  </strong>
                  <span className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${tone.label}`}>Hrs to {nextInterval} Routine</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-8 border-slate-200" />

        <div>
          <span className="section-header">
            <Fuel size={16} className="text-[#ff4d2f]" aria-hidden="true" />
            <span>Fuel R.O.B. (Remaining On Board)</span>
          </span>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex h-full flex-col rounded-lg border border-[#d4d4d4] bg-white p-3">
              <span className="text-[10px] font-bold uppercase tracking-[.08em] text-[#5f6873]">ROB Start (L)</span>
              <div className="mt-3 flex flex-row items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white">
                <button
                  type="button"
                  aria-label="Decrease ROB start"
                  onClick={() => bumpRobStart(-1)}
                  disabled={isNoOperation || readOnly}
                  className="flex w-16 items-center justify-center bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Minus size={24} strokeWidth={3} />
                </button>
                <div className="flex min-w-0 flex-1 flex-col items-center justify-center border-x border-slate-200 p-3 focus-within:border-[#4b718f]">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={log.fuelRobStop}
                    step={10}
                    aria-label="ROB Start"
                    value={log.fuelRobStart}
                    disabled={isNoOperation || readOnly}
                    onChange={(event) => {
                      const next = Number(event.target.value)
                      onUpdate({ ...log, fuelRobStart: Number.isFinite(next) && next >= 0 ? next : 0 })
                    }}
                    onBlur={() => {
                      if (log.fuelRobStart < log.fuelRobStop) onUpdate({ ...log, fuelRobStart: log.fuelRobStop })
                    }}
                    className="no-number-spinner w-full bg-transparent text-center text-3xl font-black tabular-nums leading-none text-[#111820] outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#7c8994]">L</span>
                </div>
                <button
                  type="button"
                  aria-label="Increase ROB start"
                  onClick={() => bumpRobStart(1)}
                  disabled={isNoOperation || readOnly}
                  className="flex w-16 items-center justify-center bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="flex h-full flex-col rounded-lg border border-[#d4d4d4] bg-white p-3">
              <span className="text-[10px] font-bold uppercase tracking-[.08em] text-[#5f6873]">ROB Stop (L)</span>
              <div className="mt-3 flex flex-row items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white">
                <button
                  type="button"
                  aria-label="Decrease ROB stop"
                  onClick={() => bumpRobStop(-1)}
                  disabled={isNoOperation || readOnly}
                  className="flex w-16 items-center justify-center bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Minus size={24} strokeWidth={3} />
                </button>
                <div className="flex min-w-0 flex-1 flex-col items-center justify-center border-x border-slate-200 p-3 focus-within:border-[#4b718f]">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={log.fuelRobStart}
                    step={10}
                    aria-label="ROB Stop"
                    value={log.fuelRobStop}
                    disabled={isNoOperation || readOnly}
                    onChange={(event) => {
                      const next = Number(event.target.value)
                      // Locked as you type: stop can never exceed the current start.
                      onUpdate({ ...log, fuelRobStop: Number.isFinite(next) && next >= 0 ? Math.min(next, log.fuelRobStart) : 0 })
                    }}
                    onBlur={() => {
                      if (log.fuelRobStop > log.fuelRobStart) onUpdate({ ...log, fuelRobStop: log.fuelRobStart })
                    }}
                    className="no-number-spinner w-full bg-transparent text-center text-3xl font-black tabular-nums leading-none text-[#111820] outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#7c8994]">L</span>
                </div>
                <button
                  type="button"
                  aria-label="Increase ROB stop"
                  onClick={() => bumpRobStop(1)}
                  disabled={isNoOperation || readOnly}
                  className="flex w-16 items-center justify-center bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="flex h-full flex-col rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <span className="text-[10px] font-bold uppercase tracking-[.08em]">Fuel Consumed</span>
              <div className="mt-3 flex min-h-14 flex-1 flex-col items-center justify-center rounded-md border border-amber-200 bg-white/60 px-1 py-1">
                <strong className="text-3xl font-black tabular-nums">{consumption.toLocaleString()}</strong>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-amber-700/70">L</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-8 border-slate-200" />

        <div>
          <span className="section-header">
            <Droplet size={16} className="text-[#ff4d2f]" aria-hidden="true" />
            <span>Fluids &amp; Lubricants</span>
          </span>

          {/* Expansion point: further engine fluids (e.g. Cylinder Oil Added) can be added as
              sibling cards in this sm:grid-cols-2 row — bump to grid-cols-3 if needed.
              Hydraulic Oil lives on the vessel-level VESSEL FLUIDS tab. */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MetricStepper
              label="L.O. Added (Liters)"
              unit="L"
              value={log.lubeOilAdded}
              min={0}
              max={9999}
              step={5}
              disabled={readOnly}
              icon={<Droplets size={14} className="text-amber-600" aria-hidden="true" />}
              onChange={(lubeOilAdded) => onUpdate({ ...log, lubeOilAdded })}
            />
            <MetricStepper
              label="F.W. / Coolant Added (Liters)"
              unit="L"
              value={log.fwCoolantAdded}
              min={0}
              max={9999}
              step={5}
              disabled={readOnly}
              icon={<Droplet size={14} className="text-blue-500" aria-hidden="true" />}
              onChange={(fwCoolantAdded) => onUpdate({ ...log, fwCoolantAdded })}
            />
          </div>
        </div>

        <hr className="my-8 border-slate-200" />

        <div>
          <span className="section-header">
            <Activity size={16} className="text-[#ff4d2f]" aria-hidden="true" />
            <span>Engine Parameters</span>
          </span>
          <div className="grid gap-3 md:grid-cols-3">
            <MetricStepper label="RPM" unit="rev/min" value={log.rpm} min={0} max={1000} step={5} disabled={isNoOperation || readOnly} onChange={(rpm) => onUpdate({ ...log, rpm })} />
            <MetricStepper label="Oil Pressure" unit="bar" value={log.oilPressure} min={0} max={8} step={0.1} decimals={1} disabled={readOnly} onChange={(oilPressure) => onUpdate({ ...log, oilPressure })} />
            <MetricStepper label="Water Temp" unit="°C" value={log.waterTemp} min={0} max={110} step={1} disabled={readOnly} onChange={(waterTemp) => onUpdate({ ...log, waterTemp })} />
          </div>
        </div>
      </div>
    </section>
  )
}
