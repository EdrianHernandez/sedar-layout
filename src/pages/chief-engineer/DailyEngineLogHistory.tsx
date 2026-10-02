import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, History } from 'lucide-react'
import { watchLogHistory } from '../../data/chiefEngineerMockData'
import type { WatchLogStatus } from '../../types/engineLog'
import { useChiefEngineer } from './chiefEngineerOutlet'

function formatDisplayDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_LABELS: Record<WatchLogStatus, string> = {
  verified: 'Verified',
  pending: 'Pending Verification',
}

const STATUS_STYLES: Record<WatchLogStatus, string> = {
  verified: 'bg-[#39ff14] text-slate-900',
  pending: 'bg-[#fbbf24] text-slate-900',
}

const CONTROL_CLS =
  'h-12 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#315d82] focus:ring-2 focus:ring-[#315d82]/10 placeholder:text-slate-400'

const LABEL_CLS = 'text-xs font-semibold uppercase tracking-wider text-slate-500'

export function DailyEngineLogHistory() {
  const { activeVessel } = useChiefEngineer()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | WatchLogStatus>('')

  const filtersActive = Boolean(searchQuery || dateFilter || statusFilter)

  const clearFilters = () => {
    setSearchQuery('')
    setDateFilter('')
    setStatusFilter('')
  }

  const filtered = useMemo(
    () =>
      watchLogHistory.filter((entry) => {
        if (dateFilter && entry.dateISO !== dateFilter) return false
        if (statusFilter && entry.status !== statusFilter) return false
        if (searchQuery) {
          const haystack = [
            entry.preparedBy,
            formatDisplayDate(entry.dateISO),
            entry.timeRange,
            STATUS_LABELS[entry.status],
          ]
            .join(' ')
            .toLowerCase()
          if (!haystack.includes(searchQuery.trim().toLowerCase())) return false
        }
        return true
      }),
    [searchQuery, dateFilter, statusFilter],
  )

  const openLog = () => navigate('/chief-engineer/monitoring')

  return (
    <>
      <div className="tech-dashboard-header">
        <div className="tech-header-text">
          <span className="tech-header-kicker">{activeVessel.name}</span>
          <h1>Daily Engine Monitoring History</h1>
        </div>
      </div>

      <section aria-label="Watch log records" className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
        <div className="flex flex-wrap items-end gap-6 border-b border-slate-200 px-5 py-4">
          <input
            type="text"
            aria-label="Search logs"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className={`w-64 ${CONTROL_CLS}`}
          />

          <div className="ml-auto flex flex-wrap items-end gap-6">
            <div className="grid gap-1.5">
              <label htmlFor="wlh-date" className={LABEL_CLS}>
                Select Date
              </label>
              <input
                id="wlh-date"
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className={CONTROL_CLS}
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="wlh-status" className={LABEL_CLS}>
                Status
              </label>
              <select
                id="wlh-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as '' | WatchLogStatus)}
                className={`min-w-52 ${CONTROL_CLS}`}
              >
                <option value="">All</option>
                <option value="pending">Pending Verification</option>
                <option value="verified">Verified</option>
              </select>
            </div>

            {filtersActive && (
              <button type="button" className="button button-secondary button-lg" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-5 py-4">Watch Date &amp; Time</th>
                  <th scope="col" className="px-5 py-4">Prepared By</th>
                  <th scope="col" className="px-5 py-4">Total Running Hours</th>
                  <th scope="col" className="px-5 py-4">Fuel Consumed (Litres)</th>
                  <th scope="col" className="px-5 py-4">Status</th>
                  <th scope="col" className="px-5 py-4 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={openLog}
                    className="group cursor-pointer border-t border-slate-200 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-sm font-bold text-slate-900">
                      {formatDisplayDate(entry.dateISO)}, {entry.timeRange}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{entry.preparedBy}</td>
                    <td className="px-5 py-4 text-sm tabular-nums text-slate-900">
                      {entry.totalRunningHours.toFixed(1)} hrs
                    </td>
                    <td className="px-5 py-4 text-sm tabular-nums text-slate-900">
                      {entry.fuelConsumed.toLocaleString()} L
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${STATUS_STYLES[entry.status]}`}
                      >
                        {STATUS_LABELS[entry.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        aria-label={`View log from ${formatDisplayDate(entry.dateISO)}, ${entry.timeRange}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          openLog()
                        }}
                        className="inline-grid size-9 place-items-center rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-[#ff4d2f] group-hover:text-white"
                      >
                        <ChevronRight size={20} strokeWidth={2.5} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
            <History size={32} className="text-slate-400" aria-hidden="true" />
            <strong className="text-sm text-slate-900">No watch logs match the selected filters.</strong>
            <button type="button" className="button button-secondary button-lg" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        )}

        <footer className="border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
          Showing {filtered.length} of {watchLogHistory.length} logs
        </footer>
      </section>
    </>
  )
}
