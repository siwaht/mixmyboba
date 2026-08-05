/**
 * Single source of truth for every money calculation in the store.
 *
 * Both the checkout UI and the order API price a cart through this module so a
 * customer can never be shown one total and charged another. Nothing here
 * touches the filesystem, the database, or `window`, so it is safe to import
 * from server routes, client components, and tests alike.
 */

export type PurchaseType = 'subscribe' | 'onetime'

/**
 * Purchase options and their promotional discount.
 *
 * `label` and `badge` are consumed directly by the product card, the PDP
 * add-to-cart selector, the compare page, and the social-proof strip, so the
 * copy lives here rather than being repeated per surface.
 */
export const DISCOUNTS: Record<PurchaseType, { label: string; pct: number; badge: string }> = {
  subscribe: { label: 'Subscribe and Save', pct: 40, badge: 'Save 40%' },
  onetime: { label: 'One-time purchase', pct: 20, badge: 'Save 20%' },
}

/** Discount percentage by purchase option, derived from `DISCOUNTS`. */
export const PURCHASE_DISCOUNT_PCT: Record<PurchaseType, number> = {
  subscribe: DISCOUNTS.subscribe.pct,
  onetime: DISCOUNTS.onetime.pct,
}

export const DEFAULT_PURCHASE_TYPE: PurchaseType = 'onetime'

export function isPurchaseType(value: unknown): value is PurchaseType {
  return value === 'subscribe' || value === 'onetime'
}

export function toPurchaseType(value: unknown): PurchaseType {
  return isPurchaseType(value) ? value : DEFAULT_PURCHASE_TYPE
}

/** Discount percentage (0–100) for a purchase option. */
export function discountPct(purchaseType: PurchaseType = DEFAULT_PURCHASE_TYPE): number {
  return DISCOUNTS[purchaseType].pct
}

// ─── Store-wide pricing configuration ───

export interface PricingConfig {
  /** Subtotal at or above which shipping is free. */
  freeShippingThreshold: number
  /** Flat shipping charge applied below the threshold. */
  shippingRate: number
  /** Sales tax as a percentage, e.g. `8.25` for 8.25%. */
  taxRate: number
  currency: string
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  freeShippingThreshold: 50,
  shippingRate: 5.99,
  taxRate: 0,
  currency: 'USD',
}

/**
 * Round to whole cents. Applied after every arithmetic step so float drift
 * cannot accumulate into a total that disagrees with the sum of its lines.
 */
export function money(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Per-unit price after the purchase-option promotion. */
export function unitPrice(
  basePrice: number,
  purchaseType: PurchaseType = DEFAULT_PURCHASE_TYPE
): number {
  const pct = PURCHASE_DISCOUNT_PCT[purchaseType] ?? 0
  return money(basePrice * (1 - pct / 100))
}

/**
 * Alias of `unitPrice`, kept because the storefront components call it by this
 * name. One implementation, two names — never two implementations.
 */
export const discountedPrice = unitPrice

// ─── Cart item identity ───
//
// The cart keys variant selections as `<productId>__<variantId>` so the same
// product can sit in the cart at two different sizes. Order submission needs
// both halves, so parsing lives here rather than being re-derived per caller.

export const CART_ID_SEPARATOR = '__'

export function buildCartItemId(productId: string, variantId?: string | null): string {
  return variantId ? `${productId}${CART_ID_SEPARATOR}${variantId}` : productId
}

export function parseCartItemId(cartItemId: string): {
  productId: string
  variantId: string | null
} {
  const [productId, variantId] = cartItemId.split(CART_ID_SEPARATOR)
  return { productId, variantId: variantId || null }
}

// ─── Coupons ───

export interface CouponRule {
  code: string
  type: string
  value: number
  minOrder: number
  maxUses: number | null
  usedCount: number
  maxUsesPerCustomer: number | null
  active: boolean
  expiresAt: Date | null
}

export type CouponRejectionReason =
  | 'not_found'
  | 'expired'
  | 'limit_reached'
  | 'email_required'
  | 'customer_limit_reached'
  | 'min_order'

export type CouponEvaluation =
  | { ok: true; code: string; type: string; value: number; discount: number }
  | { ok: false; reason: CouponRejectionReason; error: string; status: number }

export interface CouponContext {
  /** Pre-coupon subtotal the discount is measured against. */
  subtotal: number
  /** How many times this customer has already redeemed the code. */
  priorCustomerUses?: number
  /** Whether an email was supplied — required for per-customer limits. */
  hasEmail?: boolean
}

/**
 * Decide whether a coupon applies and how much it is worth.
 *
 * Used by both `/api/coupons/validate` (to preview) and `/api/orders` (to
 * charge), so a code that previews as valid cannot be silently dropped at
 * order time, and a per-customer limit cannot be bypassed by posting straight
 * to the order endpoint.
 */
export function evaluateCoupon(
  coupon: CouponRule | null | undefined,
  { subtotal, priorCustomerUses = 0, hasEmail = true }: CouponContext
): CouponEvaluation {
  if (!coupon || !coupon.active) {
    return { ok: false, reason: 'not_found', error: 'Invalid coupon code', status: 404 }
  }

  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
    return { ok: false, reason: 'expired', error: 'Coupon has expired', status: 410 }
  }

  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, reason: 'limit_reached', error: 'Coupon usage limit reached', status: 410 }
  }

  if (coupon.maxUsesPerCustomer != null) {
    if (!hasEmail) {
      return {
        ok: false,
        reason: 'email_required',
        error: 'Email is required to use this coupon',
        status: 400,
      }
    }
    if (priorCustomerUses >= coupon.maxUsesPerCustomer) {
      return {
        ok: false,
        reason: 'customer_limit_reached',
        error: "You've already used this coupon",
        status: 400,
      }
    }
  }

  if (subtotal < coupon.minOrder) {
    return {
      ok: false,
      reason: 'min_order',
      error: `Minimum order of $${coupon.minOrder.toFixed(2)} required`,
      status: 400,
    }
  }

  const raw =
    coupon.type === 'percent'
      ? subtotal * (coupon.value / 100)
      : Math.min(coupon.value, subtotal)

  return {
    ok: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount: money(Math.min(raw, subtotal)),
  }
}

// ─── Totals ───

export interface PricedLine {
  quantity: number
  /** Promotional price actually charged per unit. */
  unitPrice: number
  /** Catalogue price before the purchase-option promotion. */
  basePrice: number
}

export interface OrderTotals {
  /** Sum of promotional line prices, before coupon, shipping, and tax. */
  subtotal: number
  /** Sum of catalogue prices — used to show "you saved X". */
  baseSubtotal: number
  /** Savings from the purchase-option promotion. */
  promoDiscount: number
  /** Savings from a coupon code. */
  discount: number
  shipping: number
  tax: number
  total: number
  freeShippingThreshold: number
  /** How much more the customer must spend to earn free shipping. */
  amountToFreeShipping: number
}

/**
 * Compose line prices into the final amount charged.
 *
 * The free-shipping test deliberately runs against the pre-coupon subtotal:
 * a coupon should not claw back a shipping benefit the customer already earned.
 */
export function calcTotals(
  lines: PricedLine[],
  {
    config = DEFAULT_PRICING_CONFIG,
    couponDiscount = 0,
  }: { config?: PricingConfig; couponDiscount?: number } = {}
): OrderTotals {
  const subtotal = money(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0))
  const baseSubtotal = money(lines.reduce((sum, l) => sum + l.basePrice * l.quantity, 0))
  const discount = money(Math.min(Math.max(couponDiscount, 0), subtotal))
  const discountedSubtotal = money(subtotal - discount)

  const threshold = config.freeShippingThreshold
  const shipping =
    lines.length === 0 || subtotal >= threshold ? 0 : money(config.shippingRate)

  const tax = money(discountedSubtotal * (config.taxRate / 100))

  return {
    subtotal,
    baseSubtotal,
    promoDiscount: money(baseSubtotal - subtotal),
    discount,
    shipping,
    tax,
    total: money(discountedSubtotal + shipping + tax),
    freeShippingThreshold: threshold,
    amountToFreeShipping: subtotal >= threshold ? 0 : money(threshold - subtotal),
  }
}
