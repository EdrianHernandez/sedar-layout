import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, LockKeyhole, LockKeyholeOpen, RotateCcw } from 'lucide-react'
import type { EngineId } from '../../types/engineLog'
import {
  consoleTitle,
  MACHINERY_TABS,
  PMS_INTERVALS,
  PMS_INTERVAL_HOURS,
  PMS_INTERVAL_LABELS,
} from '../../data/chiefEngineerMockData'
import { isRoutineDue, nextDueHours, pmsOdometer, remainingToDue } from '../../utils/engineLog'
import { PMS_TONES } from '../../utils/pmsTones'
import { useChiefEngineer } from './chiefEngineerOutlet'

const HOURS_CLS = 'text-2xl font-black tabular-nums leading-none'
const DONUT_CIRCUMFERENCE = 2 * Math.PI * 34

export function ChiefEngineerPmsPage() {
  const { activeVessel, logs, checklists } = useChiefEngineer()
  const navigate = useNavigate()
  const [activeEngineId, setActiveEngineId] = useState<EngineId>('ME-PORT')

  const log = logs.find((item) => item.engineId === activeEngineId)
  const odometer = log ? pmsOdometer(log) : 0
  const engineChecklists = checklists.filter((item) => item.engineId === activeEngineId)

  const executeUrl = (interval: string) =>
    `/chief-engineer/pms/execute/${activeEngineId.toLowerCase()}/${interval.toLowerCase()}`

  // Recurring (modulo) due state per tier: due once the odometer has crossed a multiple
  // of X hours since that routine's last sign-off (never-completed counts from epoch 0).
  const tiers = PMS_INTERVALS.map((interval) => {
    const hours = PMS_INTERVAL_HOURS[interval]
    const checklist = engineChecklists.find((item) => item.interval === interval)
    return {
      interval,
      hours,
      label: PMS_INTERVAL_LABELS[interval],
      checklist,
      due: isRoutineDue(odometer, hours, checklist?.completedOdometer),
      nextDue: nextDueHours(hours, checklist?.completedOdometer),
      remaining: remainingToDue(odometer, hours, checklist?.completedOdometer),
    }
  })

  const dueTiers = tiers
    .filter((tier) => tier.due)
    // Most urgent first: the routine furthest past its due point (smallest next due).
    .sort((a, b) => a.nextDue - b.nextDue)
  const overdueTier = dueTiers[0]
  const overdueBy = overdueTier ? Math.max(0, Math.round((odometer - overdueTier.nextDue) * 10) / 10) : 0
  const dueCount = dueTiers.length
  const upcoming = tiers
    .filter((tier) => !tier.due && tier.nextDue > odometer)
    .sort((a, b) => a.nextDue - b.nextDue)[0]
  const progress = upcoming ? Math.min(100, (odometer / upcoming.nextDue) * 100) : 100
  const remaining = upcoming ? Math.max(0, Math.round((upcoming.nextDue - odometer) * 10) / 10) : 0
  // A due/overdue routine always wins the card — never show a calm blue while one is waiting.
  const tone = overdueTier
    ? PMS_TONES.critical
    : PMS_TONES[!upcoming || remaining < 10 ? 'critical' : remaining < 50 ? 'warning' : 'normal']

  return (
    <>
      <div className="tech-dashboard-header">
        <div className="tech-header-text">
          <span className="tech-header-kicker">{consoleTitle} · Planned Maintenance</span>
          <h1>PMS Console</h1>
          <p>
            {activeVessel.name} · Recurring odometer-driven intervals — each routine re-arms at the next multiple of its
            hours after sign-off.
          </p>
        </div>
        <div className="tech-header-actions">
          <Link to="/chief-engineer" className="button button-secondary button-lg">
            <ArrowLeft size={15} aria-hidden="true" /> Back to Console
          </Link>
        </div>
      </div>

      <section className="tech-panel" aria-label="PMS Console">
        <div
          className="profile-tabs"
          role="tablist"
          aria-label="Machinery selector"
          style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
        >
          {MACHINERY_TABS.map((tab) => {
            const active = tab.id === activeEngineId
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveEngineId(tab.id)}
                className={
                  active ? 'active flex flex-col items-center justify-center' : 'flex flex-col items-center justify-center'
                }
              >
                {tab.label}
                <span className="text-[9px] font-semibold opacity-70">{tab.className === 'main' ? 'MAIN' : 'AUX'}</span>
              </button>
            )
          })}
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          {/* Stat cards — odometer metrics and the most urgent maintenance action. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Card 1 — current PMS cycle elapsed (post-drydock odometer). */}
            <div className="flex h-full flex-col rounded-lg border border-[#d4d4d4] bg-white p-3 sm:p-4">
              <span className="text-[10px] font-bold uppercase tracking-[.08em] text-[#5f6873]">
                PMS Odometer (Elapsed)
              </span>
              <div className="flex flex-1 flex-col items-center justify-center py-2">
                <strong className="text-5xl font-black tabular-nums leading-none text-[#111820]">
                  {odometer.toFixed(1)}
                  <span className="ml-2 text-sm font-black uppercase tracking-widest text-[#7c8994]">HRS</span>
                </strong>
              </div>
            </div>

            {/* Card 2 — ACTION REQUIRED when any routine is due (most urgent first),
                otherwise progress toward the nearest upcoming routine. */}
            <div className={`flex h-full flex-col rounded-lg border border-[#d4d4d4] border-t-2 ${tone.accent} bg-white p-3 sm:p-4`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-[.08em] ${
                    overdueTier ? 'text-red-700' : 'text-[#5f6873]'
                  }`}
                >
                  {overdueTier ? 'Action Required' : 'Next Scheduled PMS'}
                </span>
                {overdueTier && (
                  <span className="tech-status-badge tech-status-overdue inline-flex items-center gap-1.5">
                    <AlertTriangle size={12} aria-hidden="true" /> {dueCount} Overdue
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-row items-center gap-3.5">
                <div
                  role="progressbar"
                  aria-label={
                    overdueTier
                      ? `${overdueTier.label} overdue`
                      : upcoming
                        ? `${upcoming.label} progress`
                        : 'Maintenance progress'
                  }
                  aria-valuenow={overdueTier ? 100 : Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="relative size-20 shrink-0"
                >
                  <svg viewBox="0 0 80 80" className="size-20 -rotate-90" aria-hidden="true">
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      strokeWidth="10"
                      className={`stroke-current ${overdueTier ? 'text-red-100' : tone.track}`}
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      strokeWidth="10"
                      strokeLinecap="round"
                      className={`stroke-current transition-[stroke-dashoffset] duration-500 ${
                        overdueTier ? 'text-red-600' : tone.ring
                      }`}
                      strokeDasharray={DONUT_CIRCUMFERENCE}
                      strokeDashoffset={DONUT_CIRCUMFERENCE * (1 - (overdueTier ? 100 : progress) / 100)}
                    />
                  </svg>
                  <span
                    className={`absolute inset-0 grid place-items-center text-[9px] font-black tabular-nums tracking-wide ${
                      overdueTier ? 'text-red-600 uppercase' : tone.percent
                    }`}
                  >
                    {overdueTier ? 'Overdue' : upcoming ? `${Math.round(odometer)} / ${upcoming.nextDue}` : '—'}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  {overdueTier ? (
                    <>
                      <strong className="truncate text-5xl font-black tabular-nums leading-none text-red-700">
                        {overdueBy.toFixed(1)}
                      </strong>
                      <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-red-700/80">
                        Hrs Overdue · {overdueTier.interval} Routine
                      </span>
                    </>
                  ) : (
                    <>
                      {/* Primary: the routine itself — the countdown is deliberately demoted. */}
                      <strong className="break-words text-3xl font-black uppercase leading-[1.05] tracking-tight text-[#111820]">
                        {upcoming ? upcoming.label : 'All Tiers Due'}
                      </strong>
                      {upcoming && (
                        <span
                          className={`mt-2 inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${tone.chip}`}
                        >
                          {remaining.toFixed(1)} Hrs Remaining
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interval cards — unlocked when due (modulo), locked with remaining hours otherwise. */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {tiers.map((tier) => {
              const signedOff = tier.checklist?.isDone ?? false
              const completedAt = tier.checklist?.completedOdometer

              if (!tier.due) {
                const completedShell = signedOff && completedAt !== undefined
                return (
                  <div
                    key={tier.interval}
                    aria-disabled={completedShell ? undefined : 'true'}
                    className={`flex select-none flex-col gap-2 rounded-lg border p-4 ${
                      completedShell
                        ? 'border-[#a8d9bc] bg-[#eefaf3] opacity-90'
                        : 'cursor-not-allowed border-[#e2e7ea] bg-[#eef1f4] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[.08em] text-[#7c8994]">
                        Maintenance Interval
                      </span>
                      {completedShell ? (
                        <RotateCcw size={16} className="shrink-0 text-[#177342]" aria-hidden="true" />
                      ) : (
                        <LockKeyhole size={16} className="shrink-0 text-[#9aa5ae]" aria-hidden="true" />
                      )}
                    </div>
                    <strong className={`${HOURS_CLS} ${completedShell ? 'text-[#116437]' : 'text-[#5f6873]'}`}>
                      {tier.hours.toLocaleString('en-US')}
                      <span className="ml-1 text-[11px] font-black uppercase tracking-widest text-[#7c8994]">HRS</span>
                    </strong>
                    {completedShell ? (
                      <>
                        <p className="mt-auto text-[11px] font-bold leading-snug text-[#116437]">
                          Completed at{' '}
                          {completedAt.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
                          H · next due at {tier.nextDue.toLocaleString('en-US')} H.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate(executeUrl(tier.interval))}
                          className="mt-1 inline-flex items-center justify-center rounded-md border border-[#152f48] bg-white px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[#152f48] transition hover:bg-[#f0f5f8]"
                        >
                          View Checklist
                        </button>
                      </>
                    ) : (
                      <p className="mt-auto text-[11px] font-bold leading-snug text-[#7c8994]">
                        Requires {tier.remaining.toFixed(1)} more hours to unlock.
                      </p>
                    )}
                  </div>
                )
              }

              // Past the due point → overdue styling urges immediate action; exactly on
              // the due point still reads as a calm green "Due now".
              const overdue = odometer > tier.nextDue

              return (
                <button
                  key={tier.interval}
                  type="button"
                  onClick={() => navigate(executeUrl(tier.interval))}
                  className={`group flex flex-col gap-2 rounded-lg border-2 bg-white p-4 text-left transition ${
                    overdue
                      ? 'border-red-500 hover:shadow-[0_4px_14px_rgba(220,38,38,.18)]'
                      : 'border-[#152f48] hover:shadow-[0_4px_14px_rgba(21,47,72,.12)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-[.08em] ${
                        overdue ? 'text-red-700' : 'text-[#152f48]'
                      }`}
                    >
                      Maintenance Interval
                    </span>
                    <LockKeyholeOpen
                      size={16}
                      className={overdue ? 'text-red-600' : 'text-[#116437]'}
                      aria-hidden="true"
                    />
                  </div>
                  <strong className={`${HOURS_CLS} text-[#111820]`}>
                    {tier.hours.toLocaleString('en-US')}
                    <span className="ml-1 text-[11px] font-black uppercase tracking-widest text-[#7c8994]">HRS</span>
                  </strong>
                  <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-[#5f6873]">
                    <span className="text-xs font-black">
                      {tier.checklist
                        ? tier.checklist.tasks.filter((task) => task.condition !== 'pending').length
                        : 0}
                      /{tier.checklist?.tasks.length ?? 0} tasks
                    </span>
                    {overdue ? (
                      <span className="tech-status-badge tech-status-overdue">Overdue</span>
                    ) : (
                      <span className="text-[#116437]">Due now</span>
                    )}
                  </div>
                  <span
                    className={`mt-1 inline-flex items-center justify-center rounded-md px-3 py-2 text-[11px] font-black uppercase tracking-wider text-white transition ${
                      overdue ? 'bg-red-600 group-hover:bg-red-700' : 'bg-[#152f48]'
                    }`}
                  >
                    Start Checklist
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
