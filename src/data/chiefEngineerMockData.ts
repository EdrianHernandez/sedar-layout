import type { EngineId, EngineLog, EngineStatus, WatchLogHistoryEntry, WatchLogSummary } from '../types/engineLog'
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
// designated chief engineer, and the chief's 4-digit authorisation PIN for the Security Check.
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

// The four machinery units the PMS Console can select (the vessel-level fluids tab
// is not tied to an engine and has no odometer, so it is excluded).
export const MACHINERY_TABS = ENGINE_TABS.filter(
  (tab): tab is { id: EngineId; label: string; className: 'main' | 'auxiliary' } => tab.id !== 'VESSEL-FLUIDS',
)

export const PMS_INTERVALS: PMSInterval[] = ['250H', '500H', '1000H', '6000H', '12000H']

// Display titles and required running hours for each maintenance tier — the PMS Console
// derives lock/unlock from these against the active engine's odometer (elapsed since the
// last 12,000-H drydock sign-off) using recurring modulo math. 12000H is the master
// drydocking tier: its sign-off (Chief Engineer PIN) is the ONLY odometer reset.
export const PMS_INTERVAL_LABELS: Record<PMSInterval, string> = {
  '250H': '250-Hour Routine',
  '500H': '500-Hour Routine',
  '1000H': '1000-Hour Routine',
  '6000H': 'Overhaul',
  '12000H': '12,000-Hour Drydocking',
}

export const PMS_INTERVAL_HOURS: Record<PMSInterval, number> = {
  '250H': 250,
  '500H': 500,
  '1000H': 1000,
  '6000H': 6000,
  '12000H': 12000,
}

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

interface LogSeed {
  engineId: EngineId
  engineClass: 'main' | 'auxiliary'
  label: string
  status: EngineStatus
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
  lastDrydockMeter: number
}

// STATUS is explicit per row (operated / no-operation / standby) instead of being derived from
// the times, so typing a cut-off time on an Operated row never flips its chip. Non-operated rows
// carry NO times (null / null → "—" cells, TOTAL 0.0): the time inputs are disabled for standby
// and no-operation, so the seeds stay blank like the form enforces at runtime. GEN 2 seeds
// standby; an operated row is created by selecting Operated on the form.
// R.O.B. figures reflect the Service Tank (Day Tank) feeding each engine — the Daily Engine
// Monitoring form tracks day-tank levels, not master/bunker storage (that lives in the
// masterRobByVessel ledger below).
const engineLogSeeds: LogSeed[] = [
  { engineId: 'ME-PORT', engineClass: 'main', label: 'M/E PORT', status: 'no-operation', timeStart: null, timeStop: null, rpm: 0, oilPressure: 4.2, waterTemp: 82, fuelRobStart: 850, fuelRobStop: 850, lubeOilAdded: 0, fwCoolantAdded: 0, meterPrevious: 14500.0, meterCurrent: 14500.0, lastDrydockMeter: 14100 },
  { engineId: 'ME-STBD', engineClass: 'main', label: 'M/E STBD', status: 'no-operation', timeStart: null, timeStop: null, rpm: 0, oilPressure: 4.1, waterTemp: 84, fuelRobStart: 850, fuelRobStop: 850, lubeOilAdded: 0, fwCoolantAdded: 0, meterPrevious: 14462.5, meterCurrent: 14462.5, lastDrydockMeter: 14200 },
  { engineId: 'AUX-1', engineClass: 'auxiliary', label: 'GEN 1', status: 'no-operation', timeStart: null, timeStop: null, rpm: 0, oilPressure: 3.8, waterTemp: 74, fuelRobStart: 450, fuelRobStop: 450, lubeOilAdded: 0, fwCoolantAdded: 0, meterPrevious: 6420.0, meterCurrent: 6420.0, lastDrydockMeter: 6000 },
  { engineId: 'AUX-2', engineClass: 'auxiliary', label: 'GEN 2', status: 'standby', timeStart: null, timeStop: null, rpm: 0, oilPressure: 0, waterTemp: 26, fuelRobStart: 450, fuelRobStop: 450, lubeOilAdded: 0, fwCoolantAdded: 0, meterPrevious: 5110.3, meterCurrent: 5110.3, lastDrydockMeter: 5000 },
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

// Received during the watch (bunkering / drum deliveries) — editable on the Vessel Fluids tab.
export const robReceivedByVessel: Record<string, MasterRob> = Object.fromEntries(
  assignedVessels.map((vessel) => [vessel.id, { fuelOil: 1200, lubeOil: 0, hydraulicOil: 0, freshWater: 500 }]),
)

export function createInitialEngineLogs(vessel: Vessel): EngineLog[] {
  const date = today()
  return engineLogSeeds.map((seed) => ({ id: `log-${vessel.id}-${seed.engineId.toLowerCase()}`, date, ...seed }))
}

// Interval task templates per machinery class: main engines and generators share an
// interval cadence but run different hardware, so each class carries its own tasks.
const mainEngineTasks: Record<PMSInterval, string[]> = {
  '250H': [
    'Drain and inspect lube oil suction strainer',
    'Check cylinder head nuts and hold-down bolts',
    'Inspect turbocharger suction filter',
    'Record exhaust temperatures per cylinder',
    'Test low lube oil pressure alarm',
  ],
  '500H': [
    'Change main engine lube oil filter elements',
    'Check fuel injection valve atomisation',
    'Check cooling water pump gland packing',
    'Clean and inspect oil cooler core',
    'Verify emergency stop linkage function',
  ],
  '1000H': [
    'Inspect exhaust valve spindles and seats',
    'Measure piston ring gap at bottom dead centre',
    'Overhaul fuel injection pumps',
    'Check turbocharger bearing clearances',
    'Sample lube oil for laboratory analysis',
    'Inspect sea water strainer and clean',
  ],
  '6000H': [
    'General overhaul of cylinder liners',
    'Renew piston rings all cylinders',
    'Grind exhaust and inlet valves',
    'Inspect connecting rod big end bearings',
    'Calibrate all pressure and temperature sensors',
    'Renew jacket water pump impeller',
  ],
  '12000H': [
    'Undergo drydocking scope inspection with class surveyor',
    'Inspect propeller shaft, seals, and stern tube',
    'Check rudder stock, bearings, and steering gear',
    'Renew sacrificial anodes (hull and propeller)',
    'Pressure test sea chests and overboard valves',
    'Main engine internal inspection and clearance checks',
  ],
}

const auxiliaryTasks: Record<PMSInterval, string[]> = {
  '250H': [
    'Check and top up cooling water level',
    'Inspect generator air filter and clean',
    'Test high water temperature alarm',
    'Check battery charger output voltage',
    'Record exhaust temperature per cylinder',
  ],
  '500H': [
    'Change generator lube oil and filter elements',
    'Clean and inspect fuel injector nozzles',
    'Inspect alternator terminals and tighten',
    'Test overspeed trip function',
    'Drain sediment from fuel day tank',
  ],
  '1000H': [
    'Overhaul cylinder heads and valves',
    'Inspect turbocharger bearings',
    'Renew jacket water pump seal',
    'Sample lube oil for laboratory analysis',
    'Calibrate safety shut-down sensors',
    'Inspect exhaust silencer and flexible joints',
  ],
  '6000H': [
    'General overhaul of alternator bearings',
    'Renew piston rings and inspect liners',
    'Grind intake and exhaust valves',
    'Inspect crankshaft main bearings',
    'Recalibrate all gauges and transmitters',
    'Renew all flexible hoses and gaskets',
  ],
  '12000H': [
    'Undergo drydocking scope inspection with class surveyor',
    'Inspect propulsion shaft line and stern tube seals',
    'Check rudder stock, bearings, and steering gear',
    'Renew sacrificial anodes (hull and propeller)',
    'Pressure test sea chests and overboard valves',
    'Alternator and switchboard insulation resistance test',
  ],
}

function buildChecklist(vessel: Vessel, engineId: EngineId, interval: PMSInterval, labels: string[]): PMSChecklist {
  const id = `pms-${vessel.id}-${engineId.toLowerCase()}-${interval.toLowerCase()}`
  return {
    id,
    interval,
    engineId,
    engineScope: ENGINE_TABS.find((tab) => tab.id === engineId)?.label ?? engineId,
    isDone: false,
    tasks: labels.map((label, index) => ({ id: `${id}-task-${index}`, label, condition: 'pending' })),
  }
}

// One checklist set per ENGINE (not per vessel): each machinery unit ages on its own
// odometer, so its 250H routine unlocking must not unlock its neighbour's.
export function createInitialPmsChecklists(vessel: Vessel): PMSChecklist[] {
  const engines: EngineId[] = ['ME-PORT', 'ME-STBD', 'AUX-1', 'AUX-2']
  return engines.flatMap((engineId) => {
    const templates = engineId.startsWith('ME') ? mainEngineTasks : auxiliaryTasks
    return PMS_INTERVALS.map((interval) => buildChecklist(vessel, engineId, interval, templates[interval]))
  })
}
