import type { EngineId, EngineLog, WatchLogHistoryEntry, WatchLogSummary } from '../types/engineLog'
import type { PMSInterval, PMSChecklist } from '../types/pmsChecklist'
import type { Vessel } from '../types/vessel'

export const assignedVessels: Vessel[] = [
  { id: 'sedar-6', name: 'M/TUG SEDAR 6', imo: 'IMO 9482751' },
  { id: 'sedar-8', name: 'M/TUG SEDAR 8', imo: 'IMO 9482762' },
  { id: 'sedar-12', name: 'M/TUG SEDAR 12', imo: 'IMO 9482773' },
]

export const defaultVesselId = assignedVessels[0].id

export const consoleTitle = 'Engine Room Console'

// Kiosk crew roster: each vessel's isolated database carries its own duty engineers,
// designated chief engineer, and the chief's 4-digit authorisation PIN for SUBMIT & LOCK.
export interface VesselCrew {
  chiefEngineer: string
  chiefPin: string
  dutyEngineers: string[]
}

export const crewByVessel: Record<string, VesselCrew> = {
  'sedar-6': {
    chiefEngineer: 'Engr. Ramon Dela Cruz',
    chiefPin: '4821',
    dutyEngineers: ['Engr. Paolo Mabini', 'Engr. Jonas Reyes', 'Engr. Elmer Santos'],
  },
  'sedar-8': {
    chiefEngineer: 'Engr. Arturo Villanueva',
    chiefPin: '7390',
    dutyEngineers: ['Engr. Mark Anthony Lopez', 'Engr. Christian Aguilar'],
  },
  'sedar-12': {
    chiefEngineer: 'Engr. Nestor Baltazar',
    chiefPin: '2654',
    dutyEngineers: ['Engr. Ivan Cortez', 'Engr. Rafael Dimaculangan'],
  },
}

// Engine tabs plus the vessel-level fluids tab (not tied to any single engine).
export type MonitorTabId = EngineId | 'VESSEL-FLUIDS'

interface EngineTab {
  id: MonitorTabId
  label: string
  className: 'main' | 'auxiliary' | 'vessel'
}

export const ENGINE_TABS: EngineTab[] = [
  { id: 'ME-PORT', label: 'M/E PORT', className: 'main' },
  { id: 'ME-STBD', label: 'M/E STBD', className: 'main' },
  { id: 'AUX-1', label: 'GEN 1', className: 'auxiliary' },
  { id: 'AUX-2', label: 'GEN 2', className: 'auxiliary' },
  { id: 'VESSEL-FLUIDS', label: 'VESSEL FLUIDS', className: 'vessel' },
]

export const PMS_INTERVALS: PMSInterval[] = ['250H', '500H', '1000H', '6000H']

export const recentWatchLogs: WatchLogSummary[] = [
  { id: 'wl-1', date: '02 Oct 2026', timeRange: '08:00 - 12:00', preparedBy: '2nd Engineer', status: 'pending' },
  { id: 'wl-2', date: '02 Oct 2026', timeRange: '04:00 - 08:00', preparedBy: 'Oiler', status: 'pending' },
  { id: 'wl-3', date: '01 Oct 2026', timeRange: '00:00 - 04:00', preparedBy: '2nd Engineer', status: 'verified' },
  { id: 'wl-4', date: '01 Oct 2026', timeRange: '20:00 - 00:00', preparedBy: 'Oiler', status: 'verified' },
  { id: 'wl-5', date: '01 Oct 2026', timeRange: '16:00 - 20:00', preparedBy: '2nd Engineer', status: 'pending' },
]

export const watchLogHistory: WatchLogHistoryEntry[] = [
  { id: 'wlh-1', dateISO: '2026-10-02', timeRange: '08:00 - 12:00', preparedBy: '2nd Engineer', totalRunningHours: 7.6, fuelConsumed: 415, status: 'pending' },
  { id: 'wlh-2', dateISO: '2026-10-02', timeRange: '04:00 - 08:00', preparedBy: 'Oiler', totalRunningHours: 8.0, fuelConsumed: 388, status: 'pending' },
  { id: 'wlh-3', dateISO: '2026-10-01', timeRange: '20:00 - 00:00', preparedBy: 'Chief Engineer', totalRunningHours: 9.2, fuelConsumed: 512, status: 'verified' },
  { id: 'wlh-4', dateISO: '2026-10-01', timeRange: '16:00 - 20:00', preparedBy: '2nd Engineer', totalRunningHours: 8.4, fuelConsumed: 467, status: 'verified' },
  { id: 'wlh-5', dateISO: '2026-10-01', timeRange: '12:00 - 16:00', preparedBy: 'Oiler', totalRunningHours: 7.9, fuelConsumed: 354, status: 'pending' },
  { id: 'wlh-6', dateISO: '2026-09-30', timeRange: '20:00 - 00:00', preparedBy: '2nd Engineer', totalRunningHours: 8.8, fuelConsumed: 601, status: 'verified' },
  { id: 'wlh-7', dateISO: '2026-09-30', timeRange: '08:00 - 12:00', preparedBy: 'Chief Engineer', totalRunningHours: 9.5, fuelConsumed: 823, status: 'verified' },
  { id: 'wlh-8', dateISO: '2026-09-29', timeRange: '16:00 - 20:00', preparedBy: 'Oiler', totalRunningHours: 7.3, fuelConsumed: 312, status: 'pending' },
  { id: 'wlh-9', dateISO: '2026-09-29', timeRange: '04:00 - 08:00', preparedBy: '2nd Engineer', totalRunningHours: 8.1, fuelConsumed: 445, status: 'verified' },
  { id: 'wlh-10', dateISO: '2026-09-28', timeRange: '12:00 - 16:00', preparedBy: 'Chief Engineer', totalRunningHours: 7.7, fuelConsumed: 376, status: 'pending' },
]

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function todayAt(hour: number, minute: number): string {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

interface LogSeed {
  engineId: EngineId
  engineClass: 'main' | 'auxiliary'
  label: string
  timeStart: string | null
  timeStop: string | null
  rpm: number
  oilPressure: number
  waterTemp: number
  fuelRobStart: number
  fuelRobStop: number
  lubeOilAdded: number
  fwCoolantAdded: number
  meterPrevious: number
  meterCurrent: number
  lastOverhaulMeter: number
}

// Distinct per-engine windows demonstrate that TIME START / TIME STOP are independent per row
// (not one global watch window); GEN 2 stays standby (null / null → "—" cells).
// R.O.B. figures reflect the Service Tank (Day Tank) feeding each engine — the Daily Engine
// Monitoring form tracks day-tank levels, not master/bunker storage (that lives in the
// masterRobByVessel ledger below). Stop mirrors start because the seeded engines carry both
// time fields: NO OPERATION status implies zero consumption (stop = start).
const engineLogSeeds: LogSeed[] = [
  { engineId: 'ME-PORT', engineClass: 'main', label: 'M/E PORT', timeStart: todayAt(14, 0), timeStop: todayAt(15, 0), rpm: 0, oilPressure: 4.2, waterTemp: 82, fuelRobStart: 850, fuelRobStop: 850, lubeOilAdded: 0, fwCoolantAdded: 0, meterPrevious: 14500.0, meterCurrent: 14500.0, lastOverhaulMeter: 14100 },
  { engineId: 'ME-STBD', engineClass: 'main', label: 'M/E STBD', timeStart: todayAt(15, 0), timeStop: todayAt(16, 30), rpm: 0, oilPressure: 4.1, waterTemp: 84, fuelRobStart: 850, fuelRobStop: 850, lubeOilAdded: 0, fwCoolantAdded: 0, meterPrevious: 14462.5, meterCurrent: 14462.5, lastOverhaulMeter: 14200 },
  { engineId: 'AUX-1', engineClass: 'auxiliary', label: 'GEN 1', timeStart: todayAt(8, 0), timeStop: todayAt(16, 0), rpm: 0, oilPressure: 3.8, waterTemp: 74, fuelRobStart: 450, fuelRobStop: 450, lubeOilAdded: 0, fwCoolantAdded: 0, meterPrevious: 6420.0, meterCurrent: 6420.0, lastOverhaulMeter: 6000 },
  { engineId: 'AUX-2', engineClass: 'auxiliary', label: 'GEN 2', timeStart: null, timeStop: null, rpm: 0, oilPressure: 0, waterTemp: 26, fuelRobStart: 450, fuelRobStop: 450, lubeOilAdded: 0, fwCoolantAdded: 0, meterPrevious: 5110.3, meterCurrent: 5110.3, lastOverhaulMeter: 5000 },
]

// Master (vessel-wide) fluid inventory at the start of the watch — the physical report's
// bottom-left R.O.B. box. The summary deducts the refills recorded per engine during the watch.
export interface MasterRob {
  fuelOil: number
  lubeOil: number
  hydraulicOil: number
  freshWater: number
}

export const masterRobByVessel: Record<string, MasterRob> = Object.fromEntries(
  assignedVessels.map((vessel) => [vessel.id, { fuelOil: 5000, lubeOil: 1500, hydraulicOil: 400, freshWater: 2000 }]),
)

export function createInitialEngineLogs(vessel: Vessel): EngineLog[] {
  const date = today()
  return engineLogSeeds.map((seed) => ({ id: `log-${vessel.id}-${seed.engineId.toLowerCase()}`, date, ...seed }))
}

function buildChecklist(vessel: Vessel, interval: PMSInterval, engineScope: string, labels: string[]): PMSChecklist {
  const id = `pms-${vessel.id}-${interval.toLowerCase()}`
  return {
    id,
    interval,
    engineScope,
    isDone: false,
    tasks: labels.map((label, index) => ({ id: `${id}-task-${index}`, label, isDone: false })),
  }
}

export function createInitialPmsChecklists(vessel: Vessel): PMSChecklist[] {
  return [
    buildChecklist(vessel, '250H', 'M/E PORT & STBD', [
      'Drain and inspect lube oil suction strainer',
      'Check cylinder head nuts and hold-down bolts',
      'Inspect turbocharger suction filter',
      'Record exhaust temperatures per cylinder',
      'Test low lube oil pressure alarm',
    ]),
    buildChecklist(vessel, '500H', 'M/E PORT & STBD', [
      'Change main engine lube oil filter elements',
      'Check fuel injection valve atomisation',
      'Check cooling water pump gland packing',
      'Clean and inspect oil cooler core',
      'Verify emergency stop linkage function',
    ]),
    buildChecklist(vessel, '1000H', 'M/E PORT & STBD', [
      'Inspect exhaust valve spindles and seats',
      'Measure piston ring gap at bottom dead centre',
      'Overhaul fuel injection pumps',
      'Check turbocharger bearing clearances',
      'Sample lube oil for laboratory analysis',
      'Inspect sea water strainer and clean',
    ]),
    buildChecklist(vessel, '6000H', 'M/E PORT & STBD', [
      'General overhaul of cylinder liners',
      'Renew piston rings all cylinders',
      'Grind exhaust and inlet valves',
      'Inspect connecting rod big end bearings',
      'Calibrate all pressure and temperature sensors',
      'Renew jacket water pump impeller',
    ]),
  ]
}
