// Single source of truth for purchase-type discounts.
// Used by product cards, the PDP add-to-cart button, the compare page,
// and the cart store so pricing can never drift between surfaces.

export type PurchaseType = 'subscribe' | 'onetime'

export const DISCOUNTS: Record<PurchaseType, { label: string; pct: number; badge: string }> = {
  subscribe: { label: 'Subscribe and Save', pct: 40, badge: 'Save 40%' },
  onetime: { label: 'One-time purchase', pct: 20, badge: 'Save 20%' },
}

/** Returns the discounted price (rounded to cents) for a given base price and purchase type. */
export function discountedPrice(basePrice: number, purchaseType: PurchaseType = 'onetime'): number {
  const pct = DISCOUNTS[purchaseType].pct
  return +(basePrice * (1 - pct / 100)).toFixed(2)
}

/** Discount percentage (0–100) for a purchase type. */
export function discountPct(purchaseType: PurchaseType = 'onetime'): number {
  return DISCOUNTS[purchaseType].pct
}
