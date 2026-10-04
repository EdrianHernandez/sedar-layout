import type { EngineLog } from '../../types/engineLog'
import { formatWatchWindow } from '../../utils/engineLog'

interface DailyLogSummaryProps {
  logs: EngineLog[]
  watchStart: string
  watchStop: string
}

interface LogTotals {
  hours: number
  consumed: number
  lube: number
  fw: number
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function watchHoursOf(log: EngineLog): number {
  return Math.max(0, roundTo(log.meterCurrent - log.meterPrevious, 1))
}

function consumedOf(log: EngineLog): number {
  return Math.max(0, log.fuelRobStart - log.fuelRobStop)
}

function sumOf(rows: EngineLog[]): LogTotals {
  return {
    hours: rows.reduce((sum, log) => sum + watchHoursOf(log), 0),
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
  windowLabel: string
  subtotalLabel: string
  totals: LogTotals
}

function WatchLogTable({ rows, windowLabel, subtotalLabel, totals }: WatchLogTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left">
        <thead>
          <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <th scope="col" className="px-5 py-4">Engine</th>
            <th scope="col" className="px-5 py-4">Status</th>
            <th scope="col" className="px-5 py-4">Start – Stop</th>
            <th scope="col" className="px-5 py-4">Meter Prev (HRS)</th>
            <th scope="col" className="px-5 py-4">Meter Current (HRS)</th>
            <th scope="col" className="px-5 py-4">Watch Hours</th>
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
                <td className="px-5 py-4 font-bold tabular-nums text-slate-700">{windowLabel}</td>
                <td className="px-5 py-4 tabular-nums">{log.meterPrevious.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td className="px-5 py-4 font-bold tabular-nums">{log.meterCurrent.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td className="px-5 py-4 font-bold tabular-nums">{watchHoursOf(log).toFixed(1)}</td>
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
          {/* TODO (Validation): cross-check that (WATCH STOP − WATCH START) roughly matches the computed
              "Watch Hours" column (meterCurrent − meterPrevious per engine) and its totals; flag
              discrepancies for review before approval. */}
          <tr className="border-t-2 border-slate-950 bg-slate-50 text-sm font-black uppercase tracking-wide text-[#152f48]">
            <td colSpan={5} className="px-5 py-4 text-right">{subtotalLabel}</td>
            <td className="px-5 py-4 tabular-nums">{totals.hours.toFixed(1)}</td>
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

export function DailyLogSummary({ logs, watchStart, watchStop }: DailyLogSummaryProps) {
  const mainLogs = logs.filter((log) => log.engineClass === 'main')
  const generatorLogs = logs.filter((log) => log.engineClass === 'auxiliary')
  const mainTotals = sumOf(mainLogs)
  const generatorTotals = sumOf(generatorLogs)
  const grandTotals = sumOf(logs)
  // Exact times entered by the user, regardless of each engine's OPERATED / NO OPERATION badge.
  const windowLabel = formatWatchWindow(watchStart, watchStop)

  return (
    <section aria-label="Watch log review summary" className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
      {/* TODO (Print layout): when the Chief clicks "APPROVE, SAVE & PRINT" — or when viewing an approved log —
          format this review view as a printable A4 sheet with signature blocks at the bottom:
          Prepared by: [Name], Approved by: [Name]. */}

      <h3 className="px-5 pt-5 text-sm font-semibold text-slate-700">Main Engines</h3>
      <div className="mt-3">
        <WatchLogTable rows={mainLogs} windowLabel={windowLabel} subtotalLabel="Subtotal (Main Engines)" totals={mainTotals} />
      </div>

      <h3 className="mt-8 px-5 text-sm font-semibold text-slate-700">Auxiliary Generators</h3>
      <div className="mt-3">
        <WatchLogTable rows={generatorLogs} windowLabel={windowLabel} subtotalLabel="Subtotal (Generators)" totals={generatorTotals} />
      </div>

      <div className="mt-6 px-5 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border-2 border-slate-950 bg-slate-50 px-5 py-4">
          <span className="text-sm font-black uppercase tracking-wide text-[#152f48]">Grand Totals (All Equipment)</span>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <GrandCell label="Watch Hours" value={grandTotals.hours.toFixed(1)} unit="HRS" />
            <GrandCell label="Consumed" value={grandTotals.consumed.toLocaleString()} unit="L" />
            <GrandCell label="L.O. Added" value={grandTotals.lube.toLocaleString()} unit="L" />
            <GrandCell label="F.W./C. Added" value={grandTotals.fw.toLocaleString()} unit="L" />
          </div>
        </div>
      </div>
    </section>
  )
}
