import { Minus, Play, Plus, Square, Fuel, Gauge, Droplets, Thermometer, Timer } from 'lucide-react'
import type { EngineLog } from '../../types/engineLog'
import { computeRunningHours, formatClock, formatRunningHours } from '../../utils/engineLog'
import { ENGINE_TABS } from '../../data/chiefEngineerMockData'

interface DailyEngineMonitorCardProps {
  log: EngineLog
  now: Date
  onEngineChange: (engineId: EngineLog['engineId']) => void
  onUpdate: (log: EngineLog) => void
}

interface MetricStepperProps {
  label: string
  unit: string
  icon: typeof Gauge
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

function MetricStepper({ label, unit, icon: Icon, value, min, max, step, decimals = 0, onChange }: MetricStepperProps) {
  const bump = (direction: 1 | -1) => {
    onChange(roundTo(clamp(value + step * direction, min, max), decimals))
  }

  return (
    <div className="rounded-lg border border-[#d4d4d4] bg-white p-3">
      <div className="flex items-center gap-2 text-[#5f6873]">
        <Icon size={15} aria-hidden="true" />
        <span className="text-[10px] font-bold uppercase tracking-[.08em]">{label}</span>
      </div>
      <div className="mt-3 flex items-stretch gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => bump(-1)}
          className="grid size-14 shrink-0 place-items-center rounded-md border border-[#cdd3d8] bg-white text-[#283746] transition hover:bg-[#f4f6f7] active:bg-[#eceff1]"
        >
          <Minus size={22} strokeWidth={3} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-md border border-[#cdd3d8] bg-[#f7f9fa] px-1">
          <span className="truncate text-3xl font-black tabular-nums leading-none text-[#111820]">
            {decimals > 0 ? value.toFixed(decimals) : value}
          </span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#7c8994]">{unit}</span>
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => bump(1)}
          className="grid size-14 shrink-0 place-items-center rounded-md border border-[#cdd3d8] bg-white text-[#283746] transition hover:bg-[#f4f6f7] active:bg-[#eceff1]"
        >
          <Plus size={22} strokeWidth={3} />
        </button>
      </div>
      <input
        type="range"
        aria-label={`${label} slider`}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(roundTo(clamp(Number(event.target.value), min, max), decimals))}
        className="mt-3 h-9 w-full cursor-pointer"
      />
    </div>
  )
}

interface RobFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
}

function RobField({ label, value, onChange }: RobFieldProps) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#5f6873]">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(event) => onChange(Math.max(0, Number(event.target.value)))}
        className="h-14 w-full rounded-md border border-[#cdd3d8] bg-white px-3 text-right text-2xl font-black tabular-nums text-[#111820] outline-none focus:border-[#4b718f]"
      />
    </label>
  )
}

export function DailyEngineMonitorCard({ log, now, onEngineChange, onUpdate }: DailyEngineMonitorCardProps) {
  const isRunning = Boolean(log.timeStart) && !log.timeStop
  const hasStarted = Boolean(log.timeStart)
  const runningHours = computeRunningHours(log, now)
  const consumption = Math.max(0, log.fuelRobStart - log.fuelRobStop)

  const handleStart = () => {
    onUpdate({ ...log, timeStart: new Date().toISOString(), timeStop: null })
  }

  const handleStop = () => {
    if (!log.timeStart) return
    onUpdate({ ...log, timeStop: new Date().toISOString() })
  }

  const statusChip = isRunning
    ? 'border-[#a8d9bc] bg-[#d9f1e3] text-[#116437]'
    : hasStarted
      ? 'border-[#efd181] bg-[#fff0bd] text-[#775000]'
      : 'border-[#c9d1d7] bg-[#edf0f2] text-[#4f5d68]'
  const statusLabel = isRunning ? 'Running' : hasStarted ? 'Stopped' : 'Standby'

  return (
    <section className="tech-panel" aria-labelledby="engine-monitor-title">
      <header className="tech-panel-header">
        <div>
          <h2 id="engine-monitor-title">Daily Engine Monitor</h2>
          <p>
            {log.label} · {log.date} · {log.engineClass === 'main' ? 'Main Engine' : 'Auxiliary Engine'}
          </p>
        </div>
        <span className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3.5 text-[11px] font-bold uppercase tracking-wider ${statusChip}`}>
          <span className={`size-2 rounded-full ${isRunning ? 'animate-pulse bg-current' : 'bg-current opacity-50'}`} />
          {statusLabel}
        </span>
      </header>

      <div className="grid gap-4 p-4 sm:p-5">
        <div className="profile-tabs" role="tablist" aria-label="Engine selector">
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

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleStart}
            disabled={isRunning}
            className={`button button-xl w-full disabled:opacity-50 ${isRunning ? 'button-secondary' : 'button-primary'}`}
          >
            <Play size={20} fill="currentColor" strokeWidth={0} aria-hidden="true" />
            Start Engine
          </button>
          <button
            type="button"
            onClick={handleStop}
            disabled={!isRunning}
            className={`button button-xl w-full disabled:opacity-50 ${isRunning ? 'button-primary' : 'button-secondary'}`}
          >
            <Square size={18} fill="currentColor" strokeWidth={0} aria-hidden="true" />
            Stop Engine
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[#d4d4d4] bg-white p-3">
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#5f6873]">
              <Play size={12} aria-hidden="true" /> Time Start
            </span>
            <strong className="mt-2 block text-xl font-black tabular-nums text-[#177342]">{formatClock(log.timeStart)}</strong>
          </div>
          <div className="rounded-lg border border-[#d4d4d4] bg-white p-3">
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#5f6873]">
              <Square size={11} aria-hidden="true" /> Time Stop
            </span>
            <strong className="mt-2 block text-xl font-black tabular-nums text-[#9a5700]">{formatClock(log.timeStop)}</strong>
          </div>
          <div className="rounded-lg border border-[#a8d9bc] bg-[#d9f1e3] p-3">
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#116437]">
              <Timer size={13} aria-hidden="true" /> Total Running Hours
            </span>
            <strong className="mt-2 block text-xl font-black tabular-nums text-[#116437]">
              {formatRunningHours(runningHours)} <span className="text-xs text-[#177342]/70">HRS</span>
            </strong>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <MetricStepper label="RPM" unit="rev/min" icon={Gauge} value={log.rpm} min={0} max={1000} step={5} onChange={(rpm) => onUpdate({ ...log, rpm })} />
          <MetricStepper label="Oil Pressure" unit="bar" icon={Droplets} value={log.oilPressure} min={0} max={8} step={0.1} decimals={1} onChange={(oilPressure) => onUpdate({ ...log, oilPressure })} />
          <MetricStepper label="Water Temp" unit="°C" icon={Thermometer} value={log.waterTemp} min={0} max={110} step={1} onChange={(waterTemp) => onUpdate({ ...log, waterTemp })} />
        </div>

        <div className="rounded-lg border border-[#d4d4d4] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#5f6873]">
              <Fuel size={16} className="text-[#d68910]" aria-hidden="true" />
              Fuel R.O.B. (Remaining On Board)
            </span>
            <span className="rounded-md border border-[#f4d7c2] bg-[#fff8e6] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#78550d] tabular-nums">
              Used: {consumption.toLocaleString()} L
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <RobField label="ROB Start (L)" value={log.fuelRobStart} onChange={(fuelRobStart) => onUpdate({ ...log, fuelRobStart })} />
            <RobField label="ROB Stop (L)" value={log.fuelRobStop} onChange={(fuelRobStop) => onUpdate({ ...log, fuelRobStop })} />
            <div className="flex min-h-14 flex-1 flex-col justify-center rounded-md border border-[#a8d9bc] bg-[#d9f1e3] px-4 py-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#116437]">ROB Remaining</span>
              <strong className="text-2xl font-black tabular-nums text-[#116437]">{log.fuelRobStop.toLocaleString()} L</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
