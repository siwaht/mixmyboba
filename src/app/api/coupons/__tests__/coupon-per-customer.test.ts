/**
 * Per-customer coupon limits.
 *
 * This file used to assert against a local copy of the route's validation
 * logic, so it could pass while the shipped code was broken. It now imports the
 * real `evaluateCoupon`, which is the same function used by both
 * `/api/coupons/validate` (preview) and `/api/orders` (charge) — the second of
 * which previously skipped the per-customer check entirely, letting a shopper
 * bypass a one-per-customer cap by posting straight to the order endpoint.
 *
 * Validates: Requirements 1.1, 1.3, 2.1, 2.3, 3.1, 3.2, 3.3, 3.4
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { evaluateCoupon, type CouponRule } from '@/lib/pricing'

// ── Test data mirroring the seeded coupons ──

const FIRSTSIP_COUPON: CouponRule = {
  code: 'FIRSTSIP',
  type: 'percent',
  value: 15,
  minOrder: 0,
  maxUses: 500,
  usedCount: 127,
  active: true,
  expiresAt: null,
  maxUsesPerCustomer: 1, // one use per customer
}

const BOBA20_COUPON: CouponRule = {
  code: 'BOBA20',
  type: 'percent',
  value: 20,
  minOrder: 50,
  maxUses: 200,
  usedCount: 89,
  active: true,
  expiresAt: null,
  maxUsesPerCustomer: null,
}

const SAVE10_COUPON: CouponRule = {
  code: 'SAVE10',
  type: 'fixed',
  value: 10,
  minOrder: 40,
  maxUses: null,
  usedCount: 0,
  active: true,
  expiresAt: null,
  maxUsesPerCustomer: null,
}

const INACTIVE_COUPON: CouponRule = {
  code: 'OLDCODE',
  type: 'percent',
  value: 10,
  minOrder: 0,
  maxUses: null,
  usedCount: 0,
  active: false,
  expiresAt: null,
  maxUsesPerCustomer: null,
}

const NULL_PER_CUSTOMER_COUPONS = [BOBA20_COUPON, SAVE10_COUPON]

// ── Per-customer cap ──

describe('FIRSTSIP per-customer usage limit', () => {
  it('rejects the coupon when the customer has already redeemed it', () => {
    /**
     * **Validates: Requirements 1.1, 2.1, 2.3**
     *
     * sarah.c@gmail.com already has a seeded order carrying couponCode
     * "FIRSTSIP". With maxUsesPerCustomer = 1 the code must be refused.
     */
    const result = evaluateCoupon(FIRSTSIP_COUPON, { subtotal: 30, priorCustomerUses: 1 })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('customer_limit_reached')
      expect(result.error).toBeTruthy()
    }
  })

  it('rejects the coupon after repeated redemptions', () => {
    /** **Validates: Requirements 1.1, 2.1** */
    const result = evaluateCoupon(FIRSTSIP_COUPON, { subtotal: 50, priorCustomerUses: 3 })
    expect(result.ok).toBe(false)
  })

  it('accepts the coupon for a first-time customer', () => {
    /** **Validates: Requirements 3.1** */
    const result = evaluateCoupon(FIRSTSIP_COUPON, { subtotal: 30, priorCustomerUses: 0 })

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.discount).toBe(4.5) // 15% of 30
  })

  it('asks for an email before a capped coupon can be evaluated', () => {
    /**
     * **Validates: Requirements 1.3**
     *
     * Prior uses are counted by email, so a capped coupon cannot be honoured
     * anonymously — the checkout surfaces this as a prompt to fill in the email.
     */
    const result = evaluateCoupon(FIRSTSIP_COUPON, { subtotal: 30, hasEmail: false })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('email_required')
  })
})

// ── Preservation: everything else behaves as before ──

describe('Preservation: existing coupon validation unchanged', () => {
  it('property: coupons without a per-customer cap ignore prior uses', () => {
    /** **Validates: Requirements 3.2, 3.4** */
    const couponArb = fc.constantFrom(...NULL_PER_CUSTOMER_COUPONS)
    const subtotalArb = fc.double({ min: 50, max: 500, noNaN: true })
    const priorUsesArb = fc.integer({ min: 0, max: 50 })

    fc.assert(
      fc.property(couponArb, subtotalArb, priorUsesArb, (coupon, subtotal, priorCustomerUses) => {
        if (subtotal < coupon.minOrder) return
        const result = evaluateCoupon(coupon, { subtotal, priorCustomerUses })
        expect(result.ok).toBe(true)
      }),
      { numRuns: 200 }
    )
  })

  it('property: an unknown code always fails with a 404', () => {
    /** **Validates: Requirements 3.3** */
    fc.assert(
      fc.property(fc.double({ min: 0.01, max: 1000, noNaN: true }), subtotal => {
        const result = evaluateCoupon(null, { subtotal })
        expect(result.ok).toBe(false)
        if (!result.ok) {
          expect(result.error).toBe('Invalid coupon code')
          expect(result.status).toBe(404)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('property: inactive coupons always fail', () => {
    /** **Validates: Requirements 3.3** */
    fc.assert(
      fc.property(fc.double({ min: 0.01, max: 1000, noNaN: true }), subtotal => {
        const result = evaluateCoupon(INACTIVE_COUPON, { subtotal })
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error).toBe('Invalid coupon code')
      }),
      { numRuns: 100 }
    )
  })

  it('property: subtotals below minOrder always fail', () => {
    /** **Validates: Requirements 3.3** */
    fc.assert(
      fc.property(fc.double({ min: 0.01, max: 49.99, noNaN: true }), subtotal => {
        const result = evaluateCoupon(BOBA20_COUPON, { subtotal })
        expect(result.ok).toBe(false)
        if (!result.ok) {
          expect(result.reason).toBe('min_order')
          expect(result.error).toContain('Minimum order')
        }
      }),
      { numRuns: 100 }
    )
  })

  it('property: percent discounts scale with subtotal, fixed discounts cap at it', () => {
    /** **Validates: Requirements 3.3** */
    const couponArb = fc.constantFrom(...NULL_PER_CUSTOMER_COUPONS)
    const subtotalArb = fc.double({ min: 50, max: 500, noNaN: true })

    fc.assert(
      fc.property(couponArb, subtotalArb, (coupon, subtotal) => {
        if (subtotal < coupon.minOrder) return
        const result = evaluateCoupon(coupon, { subtotal })
        expect(result.ok).toBe(true)

        const expected =
          coupon.type === 'percent'
            ? Math.round(subtotal * (coupon.value / 100) * 100) / 100
            : Math.round(Math.min(coupon.value, subtotal) * 100) / 100

        if (result.ok) expect(result.discount).toBeCloseTo(expected, 2)
      }),
      { numRuns: 200 }
    )
  })
})
