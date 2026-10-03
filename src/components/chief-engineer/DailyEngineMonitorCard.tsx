import { Minus, Plus, Fuel, Clock, Activity } from 'lucide-react'
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
  const isRunning = Boolean(log.timeStart) && !log.timeStop
  const hasStarted = Boolean(log.timeStart)
  const consumption = Math.max(0, log.fuelRobStart - log.fuelRobStop)
  const watchHours = Math.max(0, roundTo(log.meterCurrent - log.meterPrevious, 1))

  const sinceOverhaul = Math.max(0, roundTo(log.meterCurrent - log.lastOverhaulMeter, 1))
  const nextInterval: PMSInterval = PMS_INTERVALS.find((interval) => Number(interval.replace('H', '')) > sinceOverhaul) ?? '6000H'
  const intervalHours = Number(nextInterval.replace('H', ''))
  const pmsRemaining = Math.max(0, roundTo(intervalHours - sinceOverhaul, 1))
  const pmsProgress = clamp((sinceOverhaul / intervalHours) * 100, 0, 100)

  const bumpMeter = (direction: 1 | -1) => {
    onUpdate({ ...log, meterCurrent: roundTo(clamp(log.meterCurrent + 0.1 * direction, 0, 999999), 1) })
  }

  const bumpRobStop = (direction: 1 | -1) => {
    onUpdate({ ...log, fuelRobStop: clamp(log.fuelRobStop + 10 * direction, 0, 999999) })
  }

  const statusChip = isRunning
    ? 'border-[#a8d9bc] bg-[#d9f1e3] text-[#116437]'
    : hasStarted
      ? 'border-[#efd181] bg-[#fff0bd] text-[#775000]'
      : 'border-[#c9d1d7] bg-[#edf0f2] text-[#4f5d68]'
  const statusLabel = isRunning ? 'Running' : hasStarted ? 'Stopped' : 'Standby'

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
            <span className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3.5 text-[11px] font-bold uppercase tracking-wider ${statusChip}`}>
              <span className={`size-2 rounded-full ${isRunning ? 'animate-pulse bg-current' : 'bg-current opacity-50'}`} />
              {statusLabel}
            </span>
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

            <div className="flex flex-col rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-900">
              <span className="text-[10px] font-bold uppercase tracking-[.08em]">Next PMS: {nextInterval} Routine</span>
              <div className="mt-3 flex min-h-14 flex-1 flex-col items-center justify-center rounded-md border border-blue-200 bg-white/60 px-1 py-1">
                <strong className="text-3xl font-black tabular-nums leading-none">{pmsRemaining.toFixed(1)}</strong>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-blue-700/70">Hrs Remaining</span>
              </div>
              <span className="mt-2 text-center text-[10px] text-blue-800/80">
                Current Interval: {sinceOverhaul.toFixed(1)} / {intervalHours.toFixed(1)} Hrs
              </span>
              <div
                role="progressbar"
                aria-label={`${nextInterval} routine progress`}
                aria-valuenow={Math.round(pmsProgress)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-100"
              >
                <div
                  className="h-full rounded-full bg-blue-500 transition-[width] duration-300"
                  style={{ width: `${pmsProgress}%` }}
                />
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
