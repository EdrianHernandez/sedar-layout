import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardCheck, Clock3, Fuel, Gauge, Wrench } from 'lucide-react'
import { RecentWatchLogsCard } from '../../components/chief-engineer/RecentWatchLogsCard'
import { recentWatchLogs } from '../../data/chiefEngineerMockData'
import { useChiefEngineer } from './chiefEngineerOutlet'
import { computeRunningHours, formatRunningHours } from '../../utils/engineLog'

const summaryCards = [
  { key: 'hours', label: 'Total Running Hours', icon: Clock3 },
  { key: 'fuel', label: 'Fuel R.O.B. Remaining', icon: Fuel },
  { key: 'tasks', label: 'Open PMS Tasks', icon: Wrench },
] as const

export function ChiefEngineerHomePage() {
  const { now, logs, checklists } = useChiefEngineer()

  const runningLog = logs.find((log) => log.timeStart && !log.timeStop) ?? logs[0]
  const runningHours = computeRunningHours(runningLog, now)
  const openTasks = checklists.reduce((total, checklist) => total + checklist.tasks.filter((task) => !task.isDone).length, 0)

  const summaryValues: Record<(typeof summaryCards)[number]['key'], { value: string; detail: string }> = {
    hours: { value: formatRunningHours(runningHours), detail: runningLog ? `${runningLog.label} · engine hours today` : 'No engine running' },
    fuel: { value: runningLog ? runningLog.fuelRobStop.toLocaleString() : '0', detail: runningLog ? `Litres · ${runningLog.label}` : 'Litres' },
    tasks: { value: String(openTasks), detail: 'Across all maintenance intervals' },
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon
          const summary = summaryValues[card.key]
          return (
            <article key={card.key} className="tech-summary-card">
              <div className="tech-card-header">
                <span className="tech-card-label">{card.label}</span>
                <span className="tech-card-icon" style={{ color: '#315d82', background: '#f2f5f8' }}>
                  <Icon size={18} />
                </span>
              </div>
              <strong className="tech-card-value" style={{ color: '#152f48' }}>{summary.value}</strong>
              <span className="tech-card-detail">{summary.detail}</span>
            </article>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/chief-engineer/monitoring" className="tech-panel chief-entry-tile chief-entry-filled group flex min-h-[200px] flex-col p-6">
          <span className="grid size-12 place-items-center rounded-[10px] bg-white/10 text-white">
            <Gauge size={24} aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-white">Daily Engine Monitoring</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            Record start/stop times, RPM, oil pressure, water temperature and fuel R.O.B. for the main and auxiliary engines.
          </p>
          <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-bold uppercase tracking-wider text-white">
            Open module
            <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
          </span>
        </Link>

        <Link to="/chief-engineer/pms" className="tech-panel chief-entry-tile chief-entry-filled group flex min-h-[200px] flex-col p-6">
          <span className="grid size-12 place-items-center rounded-[10px] bg-white/10 text-white">
            <ClipboardCheck size={24} aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-white">PMS Checklist</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            Work through planned maintenance intervals (250H–6000H) with blocky task toggles, progress tracking and defect remarks.
          </p>
          <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-bold uppercase tracking-wider text-white">
            Open module
            <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>

      <RecentWatchLogsCard logs={recentWatchLogs} />
    </>
  )
}
