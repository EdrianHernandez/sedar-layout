import type { Quotation, QuotationLineItem } from '../types/quotation'

const cents = (value: number) => Math.round(value * 100)
const money = (value: number) => value / 100

export function getQuotationLineItems(quotation: Quotation): QuotationLineItem[] {
  if (quotation.lineItems?.length) return quotation.lineItems
  const summaries = quotation.lineItemSummaries.length ? quotation.lineItemSummaries : ['Commercial service']
  const subtotalCents = cents(quotation.subtotal)
  const base = Math.floor(subtotalCents / summaries.length)
  return summaries.map((description, index) => {
    const unitRate = money(base + (index === summaries.length - 1 ? subtotalCents - base * summaries.length : 0))
    return { id: `${quotation.id}-LINE-${index + 1}`, name: index === 0 ? quotation.serviceType ?? 'Marine Service' : `Service Item ${index + 1}`, description, quantity: 1, unit: 'service', unitRate, discountAmount: 0, taxRate: quotation.vatRate, totalAmount: unitRate, source: index === 0 ? 'Operations' : 'Marketing', editableByMarketing: index !== 0 }
  })
}

export function calculateQuotationTotals(lineItems: QuotationLineItem[], quotationDiscount = 0, additionalCharges = 0) {
  const lineSubtotalCents = lineItems.reduce((sum, item) => sum + cents(item.quantity * item.unitRate * (item.duration ?? 1)), 0)
  const lineDiscountCents = lineItems.reduce((sum, item) => sum + cents(item.discountAmount), 0)
  const quotationDiscountCents = cents(quotationDiscount)
  const additionalCents = cents(additionalCharges)
  const beforeTaxCents = Math.max(0, lineSubtotalCents - lineDiscountCents - quotationDiscountCents + additionalCents)
  const taxCents = lineItems.length ? Math.round(beforeTaxCents * lineItems[0].taxRate) : 0
  return { subtotal: money(lineSubtotalCents), lineItemDiscounts: money(lineDiscountCents), quotationDiscount: money(quotationDiscountCents), amountBeforeTax: money(beforeTaxCents), tax: money(taxCents), additionalCharges: money(additionalCents), grandTotal: money(beforeTaxCents + taxCents) }
}
