import type { EngineId, EngineLog } from '../types/engineLog'
import type { PMSInterval, PMSChecklist } from '../types/pmsChecklist'
import type { Vessel } from '../types/vessel'

export const assignedVessels: Vessel[] = [
  { id: 'sedar-6', name: 'M/TUG SEDAR 6', imo: 'IMO 9482751' },
  { id: 'sedar-8', name: 'M/TUG SEDAR 8', imo: 'IMO 9482762' },
  { id: 'sedar-12', name: 'M/TUG SEDAR 12', imo: 'IMO 9482773' },
]

export const defaultVesselId = assignedVessels[0].id

interface EngineTab {
  id: EngineId
  label: string
  className: 'main' | 'auxiliary'
}

export const ENGINE_TABS: EngineTab[] = [
  { id: 'ME-PORT', label: 'M/E PORT', className: 'main' },
  { id: 'ME-STBD', label: 'M/E STBD', className: 'main' },
  { id: 'AUX-1', label: 'GEN 1', className: 'auxiliary' },
  { id: 'AUX-2', label: 'GEN 2', className: 'auxiliary' },
]

export const PMS_INTERVALS: PMSInterval[] = ['250H', '500H', '1000H', '6000H']

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
}

const engineLogSeeds: LogSeed[] = [
  { engineId: 'ME-PORT', engineClass: 'main', label: 'M/E PORT', timeStart: todayAt(6, 0), timeStop: null, rpm: 720, oilPressure: 4.2, waterTemp: 82, fuelRobStart: 18450, fuelRobStop: 18150 },
  { engineId: 'ME-STBD', engineClass: 'main', label: 'M/E STBD', timeStart: todayAt(6, 0), timeStop: null, rpm: 715, oilPressure: 4.1, waterTemp: 84, fuelRobStart: 18320, fuelRobStop: 18065 },
  { engineId: 'AUX-1', engineClass: 'auxiliary', label: 'GEN 1', timeStart: todayAt(5, 30), timeStop: todayAt(11, 45), rpm: 1500, oilPressure: 3.8, waterTemp: 74, fuelRobStart: 4200, fuelRobStop: 3980 },
  { engineId: 'AUX-2', engineClass: 'auxiliary', label: 'GEN 2', timeStart: null, timeStop: null, rpm: 0, oilPressure: 0, waterTemp: 26, fuelRobStart: 4150, fuelRobStop: 4150 },
]

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
