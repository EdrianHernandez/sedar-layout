import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight } from 'lucide-react'
import type { WatchLogStatus, WatchLogSummary } from '../../types/engineLog'

interface RecentWatchLogsCardProps {
  logs: WatchLogSummary[]
}

const statusStyles: Record<WatchLogStatus, string> = {
  verified: 'bg-[#39ff14] text-slate-950',
  pending: 'bg-[#fbbf24] text-slate-950',
}

const statusLabels: Record<WatchLogStatus, string> = {
  verified: 'Verified',
  pending: 'Pending Verification',
}

export function RecentWatchLogsCard({ logs }: RecentWatchLogsCardProps) {
  return (
    <section
      aria-labelledby="recent-watch-logs-title"
      className="rounded-[10px] border-2 border-slate-950 bg-slate-900 p-5 text-white"
    >
      <header className="flex items-center justify-between gap-3">
        <h2 id="recent-watch-logs-title" className="text-lg font-bold">
          Recent Watch Logs
        </h2>
        <div className="flex shrink-0 items-center gap-3">
          <span className="rounded-full border border-slate-600 px-3 py-1 text-xs font-bold text-slate-300">
            {logs.length} entries
          </span>
          <Link
            to="/chief-engineer/monitoring/history"
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-300 transition hover:text-white"
          >
            View all
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <ul className="mt-4 max-h-[340px] overflow-y-auto divide-y-2 divide-slate-800 pr-1">
        {logs.map((log) => (
          <li key={log.id}>
            <Link
              to="/chief-engineer/monitoring"
              className="group flex items-center gap-3 rounded-md px-2 py-3.5 transition hover:bg-slate-800 active:bg-slate-700"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">
                  {log.date}
                  <span className="font-medium text-slate-400">, {log.timeRange}</span>
                </p>
                <p className="mt-1 truncate text-xs text-slate-400">
                  Prepared By: <span className="font-bold text-white">{log.preparedBy}</span>
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${statusStyles[log.status]}`}
              >
                {statusLabels[log.status]}
              </span>

              <ChevronRight
                size={26}
                strokeWidth={2.5}
                aria-hidden="true"
                className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-white"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
