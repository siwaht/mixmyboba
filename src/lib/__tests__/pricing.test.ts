/**
 * Guards the arithmetic behind every amount the store displays or charges.
 *
 * The bug these tests exist to prevent: the checkout page used to compute its
 * own discounted total while the order API recomputed the subtotal from raw
 * catalogue prices, so customers were charged more than the figure they
 * approved. Everything now routes through this module, and the invariant tests
 * below fail if a second, divergent pricing path is ever reintroduced.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  DEFAULT_PRICING_CONFIG,
  PURCHASE_DISCOUNT_PCT,
  buildCartItemId,
  calcTotals,
  evaluateCoupon,
  money,
  parseCartItemId,
  toPurchaseType,
  unitPrice,
  type CouponRule,
  type PricedLine,
  type PurchaseType,
} from '../pricing'

// ─── Helpers ───

const priceArb = fc.double({ min: 0.5, max: 500, noNaN: true, noDefaultInfinity: true })
const qtyArb = fc.integer({ min: 1, max: 20 })
const purchaseTypeArb = fc.constantFrom<PurchaseType>('subscribe', 'onetime')

function lineFrom(basePrice: number, quantity: number, purchaseType: PurchaseType): PricedLine {
  return { basePrice: money(basePrice), quantity, unitPrice: unitPrice(basePrice, purchaseType) }
}

const lineArb = fc
  .tuple(priceArb, qtyArb, purchaseTypeArb)
  .map(([price, qty, type]) => lineFrom(price, qty, type))

function coupon(overrides: Partial<CouponRule> = {}): CouponRule {
  return {
    code: 'TESTCODE',
    type: 'percent',
    value: 10,
    minOrder: 0,
    maxUses: null,
    usedCount: 0,
    maxUsesPerCustomer: null,
    active: true,
    expiresAt: null,
    ...overrides,
  }
}

// ─── money ───

describe('money', () => {
  it('rounds to whole cents', () => {
    expect(money(24.994)).toBe(24.99)
    expect(money(24.995)).toBe(25)
    expect(money(0.1 + 0.2)).toBe(0.3)
  })

  it('returns 0 for non-finite input rather than propagating NaN into a total', () => {
    expect(money(Number.NaN)).toBe(0)
    expect(money(Number.POSITIVE_INFINITY)).toBe(0)
  })

  it('property: output is always a whole number of cents', () => {
    fc.assert(
      fc.property(fc.double({ min: -1e6, max: 1e6, noNaN: true }), value => {
        const cents = money(value) * 100
        expect(Math.abs(cents - Math.round(cents))).toBeLessThan(1e-6)
      })
    )
  })
})

// ─── unitPrice ───

describe('unitPrice', () => {
  it('applies the advertised discount for each purchase option', () => {
    expect(PURCHASE_DISCOUNT_PCT.onetime).toBe(20)
    expect(PURCHASE_DISCOUNT_PCT.subscribe).toBe(40)
    expect(unitPrice(24.99, 'onetime')).toBe(19.99)
    expect(unitPrice(24.99, 'subscribe')).toBe(14.99)
  })

  it('never charges more than the catalogue price', () => {
    fc.assert(
      fc.property(priceArb, purchaseTypeArb, (price, type) => {
        expect(unitPrice(price, type)).toBeLessThanOrEqual(money(price))
        expect(unitPrice(price, type)).toBeGreaterThanOrEqual(0)
      })
    )
  })

  it('subscribing is never more expensive than a one-time purchase', () => {
    fc.assert(
      fc.property(priceArb, price => {
        expect(unitPrice(price, 'subscribe')).toBeLessThanOrEqual(unitPrice(price, 'onetime'))
      })
    )
  })

  /**
   * The regression guard for the overcharging bug. The storefront prices a cart
   * line with `unitPrice` and so does the order API, so for any catalogue price
   * and purchase option the two must agree exactly — no rounding drift, no
   * second formula.
   */
  it('is the single formula shared by cart preview and order charge', () => {
    fc.assert(
      fc.property(priceArb, qtyArb, purchaseTypeArb, (price, qty, type) => {
        const cartPreviewLineTotal = money(unitPrice(price, type) * qty)
        const chargedLineTotal = money(calcTotals([lineFrom(price, qty, type)]).subtotal)
        expect(chargedLineTotal).toBe(cartPreviewLineTotal)
      })
    )
  })
})

/**
 * Fixed expected values for a realistic basket. These pin the numbers rather
 * than re-deriving them, so a change to the promotion percentages, the shipping
 * rule, or the rounding strategy shows up as a failing assertion instead of
 * silently changing what customers are charged.
 */
describe('golden scenario: two bags of Classic Milk Tea', () => {
  const REGULAR = 24.99 // catalogue price of the Regular (250g) variant
  const BULK = 74.99 // catalogue price of the Bulk (1kg) variant
  const config = { ...DEFAULT_PRICING_CONFIG, freeShippingThreshold: 50, shippingRate: 5.99 }

  it('prices a small one-time order with paid shipping', () => {
    const totals = calcTotals([lineFrom(REGULAR, 2, 'onetime')], { config })
    expect(totals.baseSubtotal).toBe(49.98)
    expect(totals.subtotal).toBe(39.98) // 19.99 x 2
    expect(totals.promoDiscount).toBe(10)
    expect(totals.shipping).toBe(5.99)
    expect(totals.total).toBe(45.97)
  })

  it('prices a bulk subscription with free shipping and a coupon', () => {
    const totals = calcTotals([lineFrom(BULK, 1, 'subscribe')], {
      config,
      couponDiscount: 4.5,
    })
    expect(totals.baseSubtotal).toBe(74.99)
    expect(totals.subtotal).toBe(44.99) // 40% off
    expect(totals.shipping).toBe(5.99) // 44.99 is under the $50 threshold
    expect(totals.discount).toBe(4.5)
    expect(totals.total).toBe(46.48)
  })

  it('prices a mixed basket that clears the free-shipping threshold', () => {
    const totals = calcTotals(
      [lineFrom(REGULAR, 2, 'onetime'), lineFrom(BULK, 1, 'onetime')],
      { config }
    )
    expect(totals.subtotal).toBe(99.97) // 39.98 + 59.99
    expect(totals.shipping).toBe(0)
    expect(totals.total).toBe(99.97)
  })
})

describe('toPurchaseType', () => {
  it('defaults unknown values to a one-time purchase', () => {
    expect(toPurchaseType('subscribe')).toBe('subscribe')
    expect(toPurchaseType('onetime')).toBe('onetime')
    expect(toPurchaseType('SUBSCRIBE')).toBe('onetime')
    expect(toPurchaseType(undefined)).toBe('onetime')
    expect(toPurchaseType(null)).toBe('onetime')
    expect(toPurchaseType(42)).toBe('onetime')
  })
})

// ─── Cart item identity ───

describe('cart item ids', () => {
  it('round-trips a product with and without a variant', () => {
    expect(parseCartItemId(buildCartItemId('prod_1', 'var_9'))).toEqual({
      productId: 'prod_1',
      variantId: 'var_9',
    })
    expect(parseCartItemId(buildCartItemId('prod_1'))).toEqual({
      productId: 'prod_1',
      variantId: null,
    })
    expect(parseCartItemId(buildCartItemId('prod_1', null))).toEqual({
      productId: 'prod_1',
      variantId: null,
    })
  })

  it('property: parsing a built id recovers both halves', () => {
    // Alphanumeric ids can't contain the `__` separator, matching cuid format.
    const idArb = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: 4,
        maxLength: 20,
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(idArb, fc.option(idArb, { nil: null }), (productId, variantId) => {
        expect(parseCartItemId(buildCartItemId(productId, variantId))).toEqual({
          productId,
          variantId,
        })
      })
    )
  })
})

// ─── calcTotals ───

describe('calcTotals', () => {
  it('charges nothing and ships nothing for an empty cart', () => {
    const totals = calcTotals([])
    expect(totals.subtotal).toBe(0)
    expect(totals.shipping).toBe(0)
    expect(totals.total).toBe(0)
  })

  it('reports the saving from the purchase-option promotion', () => {
    const totals = calcTotals([lineFrom(50, 2, 'subscribe')])
    expect(totals.baseSubtotal).toBe(100)
    expect(totals.subtotal).toBe(60)
    expect(totals.promoDiscount).toBe(40)
  })

  it('waives shipping at the configured threshold', () => {
    const config = { ...DEFAULT_PRICING_CONFIG, freeShippingThreshold: 50, shippingRate: 5.99 }

    // The threshold is measured against what the customer actually pays, not the
    // catalogue price: a $60 bag discounted to $48 has not earned free shipping.
    const under = calcTotals([lineFrom(60, 1, 'onetime')], { config })
    expect(under.subtotal).toBe(48)
    expect(under.shipping).toBe(5.99)

    const exactlyAt = calcTotals([lineFrom(62.5, 1, 'onetime')], { config })
    expect(exactlyAt.subtotal).toBe(50)
    expect(exactlyAt.shipping).toBe(0)

    const over = calcTotals([lineFrom(100, 1, 'onetime')], { config })
    expect(over.subtotal).toBe(80)
    expect(over.shipping).toBe(0)
  })

  it('measures free shipping before the coupon, so a coupon cannot revoke it', () => {
    const config = { ...DEFAULT_PRICING_CONFIG, freeShippingThreshold: 50, shippingRate: 5.99 }
    const lines = [lineFrom(75, 1, 'onetime')] // subtotal 60
    const withoutCoupon = calcTotals(lines, { config })
    const withCoupon = calcTotals(lines, { config, couponDiscount: 30 })
    expect(withoutCoupon.shipping).toBe(0)
    expect(withCoupon.shipping).toBe(0)
  })

  it('never lets a coupon exceed the subtotal or push the total negative', () => {
    const totals = calcTotals([lineFrom(10, 1, 'onetime')], { couponDiscount: 999 })
    expect(totals.discount).toBe(totals.subtotal)
    expect(totals.total).toBeGreaterThanOrEqual(0)
  })

  it('applies tax to the discounted subtotal', () => {
    const config = { ...DEFAULT_PRICING_CONFIG, taxRate: 10, freeShippingThreshold: 0 }
    const totals = calcTotals([lineFrom(125, 1, 'onetime')], { config, couponDiscount: 50 })
    expect(totals.subtotal).toBe(100)
    expect(totals.discount).toBe(50)
    expect(totals.tax).toBe(5) // 10% of (100 - 50)
    expect(totals.total).toBe(55)
  })

  it('reports how much more is needed for free shipping', () => {
    const config = { ...DEFAULT_PRICING_CONFIG, freeShippingThreshold: 50 }
    const totals = calcTotals([lineFrom(50, 1, 'onetime')], { config }) // subtotal 40
    expect(totals.amountToFreeShipping).toBe(10)
    expect(calcTotals([lineFrom(100, 1, 'onetime')], { config }).amountToFreeShipping).toBe(0)
  })

  it('property: total always equals subtotal - discount + shipping + tax', () => {
    fc.assert(
      fc.property(
        fc.array(lineArb, { minLength: 1, maxLength: 8 }),
        fc.double({ min: 0, max: 200, noNaN: true }),
        fc.double({ min: 0, max: 25, noNaN: true }),
        (lines, couponDiscount, taxRate) => {
          const config = { ...DEFAULT_PRICING_CONFIG, taxRate }
          const t = calcTotals(lines, { config, couponDiscount })
          expect(t.total).toBe(money(t.subtotal - t.discount + t.shipping + t.tax))
          expect(t.total).toBeGreaterThanOrEqual(0)
          expect(t.discount).toBeLessThanOrEqual(t.subtotal)
          expect(t.subtotal).toBeLessThanOrEqual(t.baseSubtotal)
        }
      )
    )
  })

  it('property: pricing the same cart twice yields an identical total', () => {
    fc.assert(
      fc.property(
        fc.array(lineArb, { minLength: 1, maxLength: 8 }),
        fc.double({ min: 0, max: 100, noNaN: true }),
        (lines, couponDiscount) => {
          const first = calcTotals(lines, { couponDiscount })
          const second = calcTotals(lines, { couponDiscount })
          expect(second).toEqual(first)
        }
      )
    )
  })

  it('property: line order does not change the total', () => {
    fc.assert(
      fc.property(fc.array(lineArb, { minLength: 2, maxLength: 6 }), lines => {
        const forwards = calcTotals(lines).total
        const backwards = calcTotals([...lines].reverse()).total
        expect(backwards).toBeCloseTo(forwards, 2)
      })
    )
  })
})

// ─── evaluateCoupon ───

describe('evaluateCoupon', () => {
  it('rejects an unknown or inactive code', () => {
    expect(evaluateCoupon(null, { subtotal: 50 })).toMatchObject({ ok: false, reason: 'not_found', status: 404 })
    expect(evaluateCoupon(coupon({ active: false }), { subtotal: 50 })).toMatchObject({
      ok: false,
      reason: 'not_found',
    })
  })

  it('rejects an expired code', () => {
    const result = evaluateCoupon(coupon({ expiresAt: new Date('2020-01-01') }), { subtotal: 50 })
    expect(result).toMatchObject({ ok: false, reason: 'expired', status: 410 })
  })

  it('rejects a code that has hit its global usage cap', () => {
    const result = evaluateCoupon(coupon({ maxUses: 10, usedCount: 10 }), { subtotal: 50 })
    expect(result).toMatchObject({ ok: false, reason: 'limit_reached', status: 410 })
  })

  it('rejects a subtotal below the minimum order', () => {
    const result = evaluateCoupon(coupon({ minOrder: 50 }), { subtotal: 49.99 })
    expect(result).toMatchObject({ ok: false, reason: 'min_order', status: 400 })
  })

  it('enforces the per-customer cap, which order submission previously skipped', () => {
    const firstSip = coupon({ code: 'FIRSTSIP', value: 15, maxUsesPerCustomer: 1 })

    expect(evaluateCoupon(firstSip, { subtotal: 30, priorCustomerUses: 0 })).toMatchObject({ ok: true })
    expect(evaluateCoupon(firstSip, { subtotal: 30, priorCustomerUses: 1 })).toMatchObject({
      ok: false,
      reason: 'customer_limit_reached',
    })
    expect(evaluateCoupon(firstSip, { subtotal: 30, priorCustomerUses: 5 })).toMatchObject({
      ok: false,
      reason: 'customer_limit_reached',
    })
  })

  it('requires an email before a per-customer cap can be checked', () => {
    const result = evaluateCoupon(coupon({ maxUsesPerCustomer: 1 }), { subtotal: 30, hasEmail: false })
    expect(result).toMatchObject({ ok: false, reason: 'email_required', status: 400 })
  })

  it('ignores prior uses when there is no per-customer cap', () => {
    const result = evaluateCoupon(coupon({ maxUsesPerCustomer: null }), {
      subtotal: 100,
      priorCustomerUses: 99,
    })
    expect(result).toMatchObject({ ok: true })
  })

  it('computes percent and fixed discounts', () => {
    expect(evaluateCoupon(coupon({ type: 'percent', value: 15 }), { subtotal: 30 })).toMatchObject({
      ok: true,
      discount: 4.5,
    })
    expect(evaluateCoupon(coupon({ type: 'fixed', value: 10 }), { subtotal: 30 })).toMatchObject({
      ok: true,
      discount: 10,
    })
  })

  it('property: an accepted discount never exceeds the subtotal', () => {
    const couponArb = fc.record({
      type: fc.constantFrom('percent', 'fixed'),
      value: fc.double({ min: 1, max: 500, noNaN: true }),
    })

    fc.assert(
      fc.property(couponArb, priceArb, ({ type, value }, subtotal) => {
        const result = evaluateCoupon(coupon({ type, value }), { subtotal })
        if (result.ok) {
          expect(result.discount).toBeLessThanOrEqual(money(subtotal))
          expect(result.discount).toBeGreaterThanOrEqual(0)
        }
      })
    )
  })
})
