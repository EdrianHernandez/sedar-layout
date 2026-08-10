const phpFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatCurrency(value: number, currency: 'PHP' | 'USD' = 'PHP'): string {
  if (currency === 'PHP') return phpFormatter.format(Number.isFinite(value) ? value : 0)
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0)
}

export const formatPHP = formatCurrency
