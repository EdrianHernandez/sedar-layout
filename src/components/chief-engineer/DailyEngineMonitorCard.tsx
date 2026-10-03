import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, Fuel, Clock, Activity, AlertTriangle, Check, ChevronDown } from 'lucide-react'
import type { EngineLog } from '../../types/engineLog'
import type { PMSInterval } from '../../types/pmsChecklist'
import { ENGINE_TABS, PMS_INTERVALS } from '../../data/chiefEngineerMockData'

interface DailyEngineMonitorCardProps {
  log: EngineLog
  onEngineChange: (engineId: EngineLog['engineId']) => void
  onUpdate: (log: EngineLog) => void
}

interface MetricStepperProps {
  label: string
  unit: string
  value: number
  min: number
  max: number
  step: number
  decimals?: number
  onChange: (value: number) => void
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

const DONUT_CIRCUMFERENCE = 2 * Math.PI * 34

const PMS_TONES = {
  critical: {
    card: 'border-red-300 bg-red-50 text-red-900',
    track: 'text-red-100',
    ring: 'text-red-600',
    percent: 'text-red-600',
    chip: 'border-red-300 bg-red-100 text-red-700',
    value: 'text-red-700',
    label: 'text-red-700/80',
    helper: 'text-red-800/70',
  },
  warning: {
    card: 'border-amber-300 bg-amber-50 text-amber-900',
    track: 'text-amber-100',
    ring: 'text-amber-500',
    percent: 'text-amber-600',
    chip: 'border-amber-300 bg-amber-100 text-amber-800',
    value: 'text-amber-700',
    label: 'text-amber-700/80',
    helper: 'text-amber-800/70',
  },
  normal: {
    card: 'border-blue-200 bg-blue-50 text-blue-900',
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
  { id: 'running', label: 'Running', border: 'border-[#a8d9bc]', bg: 'bg-[#d9f1e3]', text: 'text-[#116437]' },
  { id: 'stopped', label: 'Stopped', border: 'border-[#efd181]', bg: 'bg-[#fff0bd]', text: 'text-[#775000]' },
  { id: 'standby', label: 'Standby', border: 'border-[#c9d1d7]', bg: 'bg-[#edf0f2]', text: 'text-[#4f5d68]' },
] as const

type EngineStatus = (typeof STATUS_OPTIONS)[number]['id']

function MetricStepper({ label, unit, value, min, max, step, decimals = 0, onChange }: MetricStepperProps) {
  const bump = (direction: 1 | -1) => {
    onChange(roundTo(clamp(value + step * direction, min, max), decimals))
  }

  return (
    <div className="rounded-lg border border-[#d4d4d4] bg-white p-3">
      <span className="text-[10px] font-bold uppercase tracking-[.08em] text-[#5f6873]">{label}</span>
      <div className="mt-3 flex flex-row items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => bump(-1)}
          className="flex w-16 items-center justify-center bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200"
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
            onChange={(event) => {
              const next = Number(event.target.value)
              onChange(Number.isFinite(next) && next >= 0 ? next : 0)
            }}
            className="no-number-spinner w-full bg-transparent text-center text-3xl font-black tabular-nums leading-none text-[#111820] outline-none"
          />
          <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#7c8994]">{unit}</span>
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => bump(1)}
          className="flex w-16 items-center justify-center bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>
    </div>
  )
}

export function DailyEngineMonitorCard({ log, onEngineChange, onUpdate }: DailyEngineMonitorCardProps) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!statusMenuOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!statusMenuRef.current?.contains(event.target as Node)) setStatusMenuOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setStatusMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [statusMenuOpen])

  const isRunning = Boolean(log.timeStart) && !log.timeStop
  const hasStarted = Boolean(log.timeStart)
  const consumption = Math.max(0, log.fuelRobStart - log.fuelRobStop)
  const watchHours = Math.max(0, roundTo(log.meterCurrent - log.meterPrevious, 1))

  const sinceOverhaul = Math.max(0, roundTo(log.meterCurrent - log.lastOverhaulMeter, 1))
  const nextInterval: PMSInterval = PMS_INTERVALS.find((interval) => Number(interval.replace('H', '')) > sinceOverhaul) ?? '6000H'
  const intervalHours = Number(nextInterval.replace('H', ''))
  const pmsRemaining = Math.max(0, roundTo(intervalHours - sinceOverhaul, 1))
  const pmsProgress = clamp((sinceOverhaul / intervalHours) * 100, 0, 100)
  const pmsTone: PmsTone = pmsRemaining < 10 ? 'critical' : pmsRemaining < 50 ? 'warning' : 'normal'
  const tone = PMS_TONES[pmsTone]

  const bumpMeter = (direction: 1 | -1) => {
    onUpdate({ ...log, meterCurrent: roundTo(clamp(log.meterCurrent + 0.1 * direction, 0, 999999), 1) })
  }

  const bumpRobStop = (direction: 1 | -1) => {
    onUpdate({ ...log, fuelRobStop: clamp(log.fuelRobStop + 10 * direction, 0, 999999) })
  }

  const activeStatus: EngineStatus = isRunning ? 'running' : hasStarted ? 'stopped' : 'standby'
  const activeStatusOption = STATUS_OPTIONS.find((option) => option.id === activeStatus) ?? STATUS_OPTIONS[0]

  const selectStatus = (next: EngineStatus) => {
    // TODO: status should eventually drive form logic — e.g. selecting "STOPPED" could
    // auto-fill the current meter reading to match the previous reading and disable the RPM input.
    if (next === activeStatus) {
      setStatusMenuOpen(false)
      return
    }
    const now = new Date().toISOString()
    if (next === 'running') onUpdate({ ...log, timeStart: log.timeStart ?? now, timeStop: null })
    else if (next === 'stopped') onUpdate({ ...log, timeStart: log.timeStart ?? now, timeStop: now })
    else onUpdate({ ...log, timeStart: null, timeStop: null })
    setStatusMenuOpen(false)
  }

  return (
    <section className="tech-panel" aria-label="Daily Engine Monitor">
      <div
        className="profile-tabs"
        role="tablist"
        aria-label="Engine selector"
        style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
      >
        {ENGINE_TABS.map((tab) => {
          const active = tab.id === log.engineId
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onEngineChange(tab.id)}
              className={active ? 'active flex flex-col items-center justify-center' : 'flex flex-col items-center justify-center'}
            >
              {tab.label}
              <span className="text-[9px] font-semibold opacity-70">{tab.className === 'main' ? 'MAIN' : 'AUX'}</span>
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 p-4 sm:p-5">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Clock size={16} className="text-[#ff4d2f]" aria-hidden="true" />
              <span className="text-[13px] font-extrabold uppercase tracking-[.1em] text-[#152f48]">Watch Timeline</span>
            </span>
            <div className="relative" ref={statusMenuRef}>
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={statusMenuOpen}
                aria-label="Watch status"
                onClick={() => setStatusMenuOpen((open) => !open)}
                className={`inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-[11px] font-bold uppercase tracking-wider ${activeStatusOption.border} ${activeStatusOption.bg} ${activeStatusOption.text}`}
              >
                <span className={`size-2 rounded-full ${isRunning ? 'animate-pulse bg-current' : 'bg-current opacity-50'}`} />
                {activeStatusOption.label}
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-150 ${statusMenuOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {statusMenuOpen && (
                <ul
                  role="listbox"
                  aria-label="Watch status"
                  className="absolute right-0 z-30 mt-1.5 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                >
                  {STATUS_OPTIONS.map((option) => {
                    const isActive = option.id === activeStatus
                    return (
                      <li key={option.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onClick={() => selectStatus(option.id)}
                          className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider hover:bg-slate-100 ${option.text}`}
                        >
                          <span className={`size-2 rounded-full bg-current ${isActive ? '' : 'opacity-40'}`} />
                          <span className="flex-1">{option.label}</span>
                          {isActive && <Check size={13} aria-hidden="true" />}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col rounded-lg border border-[#d4d4d4] bg-white p-3">
              <span className="text-[10px] font-bold uppercase tracking-[.08em] text-[#5f6873]">Previous Meter Reading</span>
              <div className="mt-3 flex min-h-14 flex-1 flex-col items-center justify-center rounded-md border border-[#cdd3d8] bg-[#f7f9fa] px-1 py-1">
                <span className="truncate text-3xl font-black tabular-nums leading-none text-[#111820]">
                  {log.meterPrevious.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#7c8994]">HRS</span>
              </div>
            </div>

            <div className="flex flex-col rounded-lg border border-[#d4d4d4] bg-white p-3">
              <span className="text-[10px] font-bold uppercase tracking-[.08em] text-[#5f6873]">Current Meter Reading</span>
              <div className="mt-3 flex flex-1 flex-row items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white">
                <button
                  type="button"
                  aria-label="Decrease current meter reading"
                  onClick={() => bumpMeter(-1)}
                  className="flex w-16 items-center justify-center bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200"
                >
                  <Minus size={24} strokeWidth={3} />
                </button>
                <div className="flex min-w-0 flex-1 flex-col items-center justify-center border-x border-slate-200 p-3 focus-within:border-[#4b718f]">
                  <input
                    type="number"
                    inputMode="decimal"
                    aria-label="Current meter reading"
                    min={0}
                    step={0.1}
                    value={log.meterCurrent}
                    onChange={(event) => {
                      const next = Number(event.target.value)
                      onUpdate({ ...log, meterCurrent: Number.isFinite(next) && next >= 0 ? next : 0 })
                    }}
                    className="no-number-spinner w-full bg-transparent text-center text-3xl font-black tabular-nums leading-none text-[#111820] outline-none"
                  />
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#7c8994]">HRS</span>
                </div>
                <button
                  type="button"
                  aria-label="Increase current meter reading"
                  onClick={() => bumpMeter(1)}
                  className="flex w-16 items-center justify-center bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="flex flex-col rounded-lg border border-[#a8d9bc] bg-green-50 p-3 text-green-800">
              <span className="text-[10px] font-bold uppercase tracking-[.08em]">Hours for this Watch</span>
              <div className="mt-3 flex min-h-14 flex-1 flex-col items-center justify-center rounded-md border border-green-200 bg-white/60 px-1 py-1">
                <strong className="text-3xl font-black tabular-nums leading-none">{watchHours.toFixed(1)}</strong>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-green-700/70">HRS</span>
              </div>
            </div>

            <div className={`flex flex-col rounded-lg border p-3 ${tone.card}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[.08em]">Next Maintenance</span>
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
                  <span className="mt-2 text-[10px] text-slate-500">
                    Elapsed Since Last Service: {sinceOverhaul.toFixed(1)} HRS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <span className="flex items-center gap-2">
            <Fuel size={16} className="text-[#ff4d2f]" aria-hidden="true" />
            <span className="text-[13px] font-extrabold uppercase tracking-[.1em] text-[#152f48]">Fuel R.O.B. (Remaining On Board)</span>
          </span>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col rounded-lg border border-[#d4d4d4] bg-white p-3">
              <span className="text-[10px] font-bold uppercase tracking-[.08em] text-[#5f6873]">ROB Start (L)</span>
              <div className="mt-3 flex min-h-14 flex-1 flex-col items-center justify-center rounded-lg border border-[#cdd3d8] bg-[#f7f9fa] px-1 py-1 focus-within:border-[#4b718f]">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  aria-label="ROB Start"
                  value={log.fuelRobStart}
                  onChange={(event) => {
                    const next = Number(event.target.value)
                    onUpdate({ ...log, fuelRobStart: Number.isFinite(next) && next >= 0 ? next : 0 })
                  }}
                  className="no-number-spinner w-full bg-transparent text-center text-3xl font-black tabular-nums leading-none text-[#111820] outline-none"
                />
                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#7c8994]">L</span>
              </div>
            </div>

            <div className="flex flex-col rounded-lg border border-[#d4d4d4] bg-white p-3">
              <span className="text-[10px] font-bold uppercase tracking-[.08em] text-[#5f6873]">ROB Stop (L)</span>
              <div className="mt-3 flex flex-row items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white">
                <button
                  type="button"
                  aria-label="Decrease ROB stop"
                  onClick={() => bumpRobStop(-1)}
                  className="flex w-16 items-center justify-center bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200"
                >
                  <Minus size={24} strokeWidth={3} />
                </button>
                <div className="flex min-w-0 flex-1 flex-col items-center justify-center border-x border-slate-200 p-3 focus-within:border-[#4b718f]">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={10}
                    aria-label="ROB Stop"
                    value={log.fuelRobStop}
                    onChange={(event) => {
                      const next = Number(event.target.value)
                      onUpdate({ ...log, fuelRobStop: Number.isFinite(next) && next >= 0 ? next : 0 })
                    }}
                    className="no-number-spinner w-full bg-transparent text-center text-3xl font-black tabular-nums leading-none text-[#111820] outline-none"
                  />
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#7c8994]">L</span>
                </div>
                <button
                  type="button"
                  aria-label="Increase ROB stop"
                  onClick={() => bumpRobStop(1)}
                  className="flex w-16 items-center justify-center bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="flex flex-col rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <span className="text-[10px] font-bold uppercase tracking-[.08em]">Fuel Consumed</span>
              <div className="mt-3 flex min-h-14 flex-1 flex-col items-center justify-center rounded-md border border-amber-200 bg-white/60 px-1 py-1">
                <strong className="text-3xl font-black tabular-nums">{consumption.toLocaleString()}</strong>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-amber-700/70">L</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <span className="flex items-center gap-2">
            <Activity size={16} className="text-[#ff4d2f]" aria-hidden="true" />
            <span className="text-[13px] font-extrabold uppercase tracking-[.1em] text-[#152f48]">Engine Parameters</span>
          </span>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <MetricStepper label="RPM" unit="rev/min" value={log.rpm} min={0} max={1000} step={5} onChange={(rpm) => onUpdate({ ...log, rpm })} />
            <MetricStepper label="Oil Pressure" unit="bar" value={log.oilPressure} min={0} max={8} step={0.1} decimals={1} onChange={(oilPressure) => onUpdate({ ...log, oilPressure })} />
            <MetricStepper label="Water Temp" unit="°C" value={log.waterTemp} min={0} max={110} step={1} onChange={(waterTemp) => onUpdate({ ...log, waterTemp })} />
          </div>
        </div>
      </div>
    </section>
  )
}
