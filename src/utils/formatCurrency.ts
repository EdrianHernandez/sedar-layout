const phpFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatCurrency(value: number): string {
  return phpFormatter.format(Number.isFinite(value) ? value : 0)
}

export const formatPHP = formatCurrency
