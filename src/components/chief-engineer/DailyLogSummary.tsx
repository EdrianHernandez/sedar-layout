import type { EngineLog } from '../../types/engineLog'
import { computeRunningHours, formatTimeOnly } from '../../utils/engineLog'

interface DailyLogSummaryProps {
  logs: EngineLog[]
}

interface LogTotals {
  consumed: number
  lube: number
  fw: number
}

function consumedOf(log: EngineLog): number {
  return Math.max(0, log.fuelRobStart - log.fuelRobStop)
}

function sumOf(rows: EngineLog[]): LogTotals {
  return {
    consumed: rows.reduce((sum, log) => sum + consumedOf(log), 0),
    lube: rows.reduce((sum, log) => sum + log.lubeOilAdded, 0),
    fw: rows.reduce((sum, log) => sum + log.fwCoolantAdded, 0),
  }
}

const STATUS_META = {
  running: { label: 'Operated', chip: 'bg-green-100 text-green-800' },
  stopped: { label: 'No Operation', chip: 'bg-amber-100 text-amber-800' },
  standby: { label: 'Standby', chip: 'bg-slate-100 text-slate-700' },
} as const

function statusOf(log: EngineLog): keyof typeof STATUS_META {
  if (!log.timeStart) return 'standby'
  return log.timeStop ? 'stopped' : 'running'
}

interface WatchLogTableProps {
  rows: EngineLog[]
  subtotalLabel: string
  totals: LogTotals
}

function WatchLogTable({ rows, subtotalLabel, totals }: WatchLogTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-left">
        {/* Percentage widths keep the operational columns (per-engine times, running hours,
            consumables) readable and evenly balanced at any viewport width. */}
        <colgroup>
          <col className="w-[10%]" />
          <col className="w-[8%]" />
          <col className="w-[8%]" />
          <col className="w-[8%]" />
          <col className="w-[8%]" />
          <col className="w-[8%]" />
          <col className="w-[8%]" />
          <col className="w-[9%]" />
          <col className="w-[9%]" />
          <col className="w-[9%]" />
          <col className="w-[5%]" />
          <col className="w-[5%]" />
          <col className="w-[5%]" />
        </colgroup>
        <thead>
          <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <th scope="col" className="px-5 py-4">Engine</th>
            <th scope="col" className="px-5 py-4">Status</th>
            <th scope="col" className="px-5 py-4">Time Start</th>
            <th scope="col" className="px-5 py-4">Time Stop</th>
            <th scope="col" className="px-5 py-4">Running Hours</th>
            <th scope="col" className="px-5 py-4">R.O.B. Start (L)</th>
            <th scope="col" className="px-5 py-4">R.O.B. Stop (L)</th>
            <th scope="col" className="px-5 py-4">Consumed (L)</th>
            <th scope="col" className="px-5 py-4">L.O. Added (L)</th>
            <th scope="col" className="px-5 py-4">F.W./C. (L)</th>
            <th scope="col" className="px-5 py-4">RPM</th>
            <th scope="col" className="px-5 py-4">Oil (bar)</th>
            <th scope="col" className="px-5 py-4">Water (°C)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((log) => {
            const status = STATUS_META[statusOf(log)]
            return (
              <tr key={log.id} className="border-t border-slate-200 text-sm text-slate-900">
                <td className="px-5 py-4 font-bold">{log.label}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${status.chip}`}>
                    {status.label}
                  </span>
                </td>
                <td className="px-5 py-4 font-bold tabular-nums text-slate-700">{formatTimeOnly(log.timeStart)}</td>
                <td className="px-5 py-4 font-bold tabular-nums text-slate-700">
                  {formatTimeOnly(log.timeStop, log.timeStart ? 'ongoing' : '—')}
                </td>
                <td className="px-5 py-4 font-bold tabular-nums">{(computeRunningHours(log) ?? 0).toFixed(1)}</td>
                <td className="px-5 py-4 tabular-nums">{log.fuelRobStart.toLocaleString()}</td>
                <td className="px-5 py-4 tabular-nums">{log.fuelRobStop.toLocaleString()}</td>
                <td className="px-5 py-4 font-bold tabular-nums">{consumedOf(log).toLocaleString()}</td>
                <td className="px-5 py-4 tabular-nums">{log.lubeOilAdded.toLocaleString()}</td>
                <td className="px-5 py-4 tabular-nums">{log.fwCoolantAdded.toLocaleString()}</td>
                <td className="px-5 py-4 tabular-nums">{log.rpm.toLocaleString()}</td>
                <td className="px-5 py-4 tabular-nums">{log.oilPressure.toFixed(1)}</td>
                <td className="px-5 py-4 tabular-nums">{log.waterTemp}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          {/* TODO (Validation): cross-check that (TIME STOP − TIME START) roughly matches the computed
              "Running Hours" column (per-engine, from the time columns) and its totals; flag
              discrepancies for review before approval. */}
          <tr className="border-t-2 border-slate-950 bg-slate-50 text-sm font-black uppercase tracking-wide text-[#152f48]">
            {/* Meter columns are intentionally omitted here so the digital summary matches the
                physical daily report format; the readings remain on the monitoring card. */}
            <td colSpan={4} className="px-5 py-4 text-right">{subtotalLabel}</td>
            {/* Running Hours is intentionally blank: running hours are concurrent, per-machine values
                used for maintenance tracking — summing them across engines would misrepresent the
                time window. Consumable totals below remain vessel-wide. */}
            <td className="px-5 py-4" />
            <td colSpan={2} className="px-5 py-4" />
            <td className="px-5 py-4 tabular-nums">{totals.consumed.toLocaleString()}</td>
            <td className="px-5 py-4 tabular-nums">{totals.lube.toLocaleString()}</td>
            <td className="px-5 py-4 tabular-nums">{totals.fw.toLocaleString()}</td>
            <td colSpan={3} className="px-5 py-4" />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function GrandCell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="text-right">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
      <strong className="text-lg font-black tabular-nums text-[#152f48]">
        {value} <span className="text-[11px] font-bold text-slate-500">{unit}</span>
      </strong>
    </div>
  )
}

export function DailyLogSummary({ logs }: DailyLogSummaryProps) {
  const mainLogs = logs.filter((log) => log.engineClass === 'main')
  const generatorLogs = logs.filter((log) => log.engineClass === 'auxiliary')
  const mainTotals = sumOf(mainLogs)
  const generatorTotals = sumOf(generatorLogs)
  const grandTotals = sumOf(logs)

  return (
    <section aria-label="Watch log review summary" className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
      {/* TODO (Print layout): when the Chief clicks "APPROVE, SAVE & PRINT" — or when viewing an approved log —
          format this review view as a printable A4 sheet with signature blocks at the bottom:
          Prepared by: [Name], Approved by: [Name]. */}

      <h3 className="px-5 pt-5 text-sm font-semibold text-slate-700">Main Engines</h3>
      <div className="mt-3">
        <WatchLogTable rows={mainLogs} subtotalLabel="Subtotal (Main Engines)" totals={mainTotals} />
      </div>

      <h3 className="mt-8 px-5 text-sm font-semibold text-slate-700">Auxiliary Generators</h3>
      <div className="mt-3">
        <WatchLogTable rows={generatorLogs} subtotalLabel="Subtotal (Generators)" totals={generatorTotals} />
      </div>

      <div className="mt-6 px-5 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border-2 border-slate-950 bg-slate-50 px-5 py-4">
          <span className="text-sm font-black uppercase tracking-wide text-[#152f48]">Grand Totals (All Equipment)</span>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <GrandCell label="Consumed" value={grandTotals.consumed.toLocaleString()} unit="L" />
            <GrandCell label="L.O. Added" value={grandTotals.lube.toLocaleString()} unit="L" />
            <GrandCell label="F.W./C. Added" value={grandTotals.fw.toLocaleString()} unit="L" />
          </div>
        </div>
      </div>
    </section>
  )
}
