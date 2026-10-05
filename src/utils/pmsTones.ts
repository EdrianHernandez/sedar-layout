// Shared PMS urgency tones (critical / warning / normal) used by the Daily Engine
// Monitor card's donut and the PMS Console's next-interval progress bar.
// Kept in a standalone module (not a component file) so react-refresh stays happy.
export const PMS_TONES = {
  critical: {
    accent: 'border-t-red-500',
    track: 'text-red-100',
    ring: 'text-red-600',
    percent: 'text-red-600',
    chip: 'border-red-300 bg-red-100 text-red-700',
    value: 'text-red-700',
    label: 'text-red-700/80',
    helper: 'text-red-800/70',
    barTrack: 'bg-red-100',
    barFill: 'bg-red-600',
  },
  warning: {
    accent: 'border-t-amber-500',
    track: 'text-amber-100',
    ring: 'text-amber-500',
    percent: 'text-amber-600',
    chip: 'border-amber-300 bg-amber-100 text-amber-800',
    value: 'text-amber-700',
    label: 'text-amber-700/80',
    helper: 'text-amber-800/70',
    barTrack: 'bg-amber-100',
    barFill: 'bg-amber-500',
  },
  normal: {
    accent: 'border-t-blue-500',
    track: 'text-blue-100',
    ring: 'text-blue-600',
    percent: 'text-blue-600',
    chip: 'border-blue-300 bg-blue-100 text-blue-700',
    value: 'text-blue-900',
    label: 'text-blue-700/70',
    helper: 'text-blue-800/70',
    barTrack: 'bg-blue-100',
    barFill: 'bg-blue-600',
  },
} as const

export type PmsTone = keyof typeof PMS_TONES
