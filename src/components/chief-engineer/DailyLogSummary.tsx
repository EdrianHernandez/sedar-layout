import type { EngineLog } from '../../types/engineLog'
import type { MasterRob } from '../../data/chiefEngineerMockData'
import type { WatchLogSignoff } from '../../context/engineRoomStore'
import { computeRunningHours, formatTimeOnly } from '../../utils/engineLog'

interface DailyLogSummaryProps {
  logs: EngineLog[]
  hydraulicOilAdded: number
  masterRob: MasterRob
  signoff?: WatchLogSignoff | null
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
              time window. The consumable sums in this row are per-group subtotals; vessel-wide
              balances live in the Vessel R.O.B. table. */}
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

export function DailyLogSummary({ logs, hydraulicOilAdded, masterRob, signoff = null }: DailyLogSummaryProps) {
  const mainLogs = logs.filter((log) => log.engineClass === 'main')
  const generatorLogs = logs.filter((log) => log.engineClass === 'auxiliary')
  const mainTotals = sumOf(mainLogs)
  const generatorTotals = sumOf(generatorLogs)
  const grandTotals = sumOf(logs)

  // Physical report's bottom-left R.O.B. box: the master-inventory ledger for the watch —
  // every consumable (fuel, lube, hydraulic, fresh water) = master stock less refills
  // recorded per engine (fuel / L.O. / F.W.) and on the vessel tab (hydraulic oil).
  const robRows = [
    { label: 'Fuel Oil', grade: 'Diesel', master: masterRob.fuelOil, consumed: grandTotals.consumed },
    { label: 'Lube Oil', grade: 'SA40 / 15W-40', master: masterRob.lubeOil, consumed: grandTotals.lube },
    { label: 'Hydraulic Oil', grade: '68 / 100 / 46', master: masterRob.hydraulicOil, consumed: hydraulicOilAdded },
    { label: 'Fresh Water (F.W.)', grade: null, master: masterRob.freshWater, consumed: grandTotals.fw },
  ]

  return (
    <section aria-label="Watch log review summary" className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
      {/* TODO (Print layout): format this review view as a printable A4 sheet. The Prepared By /
          Verified By strip at the foot is filled from the Sign-off modal's kiosk record
          (prepared by duty engineer, verified by the vessel's chief, PIN-authorized). */}

      <h3 className="px-5 pt-5 text-sm font-semibold text-slate-700">Main Engines</h3>
      <div className="mt-3">
        <WatchLogTable rows={mainLogs} subtotalLabel="Subtotal (Main Engines)" totals={mainTotals} />
      </div>

      <h3 className="mt-8 px-5 text-sm font-semibold text-slate-700">Auxiliary Generators</h3>
      <div className="mt-3">
        <WatchLogTable rows={generatorLogs} subtotalLabel="Subtotal (Generators)" totals={generatorTotals} />
      </div>

      <div className="mt-6 px-5 pb-5">
        {/* Vessel R.O.B. box (physical report bottom-left): the master-inventory ledger for the
            watch — a 4-column table of fluid, starting master stock, refills consumed, and the
            computed remaining balance. It replaces the old Grand Totals card: every consumable
            (fuel, lube, hydraulic, fresh water) is consolidated here. The title shares one
            continuous header band with the column labels so the figures sit closer to it. */}
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left">
            <colgroup>
              <col className="w-[42%]" />
              <col className="w-[18%]" />
              <col className="w-[16%]" />
              <col className="w-[24%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th colSpan={4} scope="col" className="px-5 py-3 text-sm font-black uppercase tracking-wide text-[#152f48]">
                  Vessel R.O.B. (Remaining On Board)
                </th>
              </tr>
              <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-5 py-2.5">Fluid / Lubricant</th>
                <th scope="col" className="px-5 py-2.5 text-right">Master Inventory</th>
                <th scope="col" className="px-5 py-2.5 text-right">Consumed</th>
                <th scope="col" className="px-5 py-2.5 text-right">Final R.O.B.</th>
              </tr>
            </thead>
            <tbody>
              {robRows.map((row) => (
                <tr key={row.label} className="border-t border-slate-200 text-sm">
                  <td className="px-5 py-3 font-bold text-slate-800">
                    {row.label}
                    {row.grade && <span className="font-semibold text-slate-500"> ({row.grade})</span>}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                    {row.master.toLocaleString()} <span className="text-[11px] font-semibold text-slate-500">L</span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                    {row.consumed.toLocaleString()} <span className="text-[11px] font-semibold text-slate-500">L</span>
                  </td>
                  <td className="bg-slate-50 px-5 py-3 text-right font-black tabular-nums text-[#152f48]">
                    {Math.max(0, row.master - row.consumed).toLocaleString()}{' '}
                    <span className="text-[11px] font-semibold text-slate-500">L</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {signoff && (
        <div className="grid gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:grid-cols-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[.1em] text-slate-500">Prepared By</span>
            <strong className="mt-1 block text-sm font-bold text-slate-800">{signoff.preparedBy}</strong>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[.1em] text-slate-500">Verified By</span>
            <strong className="mt-1 block text-sm font-bold text-slate-800">{signoff.verifiedBy}</strong>
            <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">
              Signed{' '}
              {new Date(signoff.signedAt).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
