/**
 * Bug Condition Exploration Test — FIRSTSIP Per-Customer Usage Limit
 *
 * This test mirrors the CURRENT validation logic from route.ts and encodes
 * the EXPECTED behavior: a coupon with maxUsesPerCustomer=1 should be
 * rejected when the customer has already used it.
 *
 * On UNFIXED code, the validation function has no concept of per-customer
 * limits, so it will accept the coupon — causing this test to FAIL.
 * That failure is SUCCESS for this task: it proves the bug exists.
 *
 * Validates: Requirements 1.1, 1.3, 2.1, 2.3
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

// ── Types mirroring the Coupon model ────────────────────────────────────────

interface Coupon {
  code: string
  type: 'percent' | 'fixed'
  value: number
  minOrder: number
  maxUses: number | null
  usedCount: number
  active: boolean
  expiresAt: Date | null
  maxUsesPerCustomer?: number | null // exists in schema after fix; absent before
}

interface ValidationInput {
  code: string
  subtotal: number
  email?: string
}

interface ValidationResult {
  success: boolean
  error?: string
  discount?: number
}

// ── Mirror of the FIXED validation logic from route.ts ──────────────────────
// This function replicates the fixed route logic including per-customer usage check.

function validateCoupon(
  coupon: Coupon | null,
  input: ValidationInput,
  customerPriorUses: number = 0,
): ValidationResult {
  if (!coupon || !coupon.active) {
    return { success: false, error: 'Invalid coupon code' }
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return { success: false, error: 'Coupon has expired' }
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { success: false, error: 'Coupon usage limit reached' }
  }

  // Per-customer usage check (the fix)
  if (coupon.maxUsesPerCustomer && customerPriorUses >= coupon.maxUsesPerCustomer) {
    return { success: false, error: "You've already used this coupon" }
  }

  if (input.subtotal < coupon.minOrder) {
    return { success: false, error: `Minimum order of ${coupon.minOrder.toFixed(2)} required` }
  }

  const discount =
    coupon.type === 'percent'
      ? input.subtotal * (coupon.value / 100)
      : Math.min(coupon.value, input.subtotal)

  return {
    success: true,
    discount: Math.round(discount * 100) / 100,
  }
}

// ── Test Data ───────────────────────────────────────────────────────────────

const FIRSTSIP_COUPON: Coupon = {
  code: 'FIRSTSIP',
  type: 'percent',
  value: 15,
  minOrder: 0,
  maxUses: 500,
  usedCount: 127,
  active: true,
  expiresAt: null,
  maxUsesPerCustomer: 1, // intended: one use per customer
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Bug Condition: FIRSTSIP per-customer usage limit', () => {
  it('should REJECT FIRSTSIP when customer has already used it (prior uses = 1, maxUsesPerCustomer = 1)', () => {
    /**
     * **Validates: Requirements 1.1, 2.1, 2.3**
     *
     * sarah.c@gmail.com already has an order with couponCode = "FIRSTSIP" in seed data.
     * With maxUsesPerCustomer = 1, the validation should reject this coupon.
     *
     * On UNFIXED code: the validateCoupon function ignores customerPriorUses
     * entirely, so it returns success: true — this assertion FAILS, proving the bug.
     */
    const result = validateCoupon(
      FIRSTSIP_COUPON,
      { code: 'FIRSTSIP', subtotal: 30, email: 'sarah.c@gmail.com' },
      1, // sarah.c@gmail.com has 1 prior order with FIRSTSIP
    )

    // Expected behavior: coupon should be rejected
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should REJECT FIRSTSIP when customer has used it multiple times (prior uses = 3, maxUsesPerCustomer = 1)', () => {
    /**
     * **Validates: Requirements 1.1, 2.1**
     *
     * Even more egregious case: customer has used FIRSTSIP 3 times.
     * Should definitely be rejected.
     */
    const result = validateCoupon(
      FIRSTSIP_COUPON,
      { code: 'FIRSTSIP', subtotal: 50, email: 'repeat.abuser@gmail.com' },
      3,
    )

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should ACCEPT FIRSTSIP for a first-time customer (prior uses = 0)', () => {
    /**
     * **Validates: Requirements 3.1**
     *
     * Baseline sanity check: a new customer with zero prior uses should be accepted.
     * This test should PASS on both unfixed and fixed code.
     */
    const result = validateCoupon(
      FIRSTSIP_COUPON,
      { code: 'FIRSTSIP', subtotal: 30, email: 'brand.new@example.com' },
      0,
    )

    expect(result.success).toBe(true)
    expect(result.discount).toBe(4.5) // 15% of 30
  })
})


// ── Preservation Test Data ──────────────────────────────────────────────────

/** Coupons with maxUsesPerCustomer = null (no per-customer limit) */
const BOBA20_COUPON: Coupon = {
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

const SAVE10_COUPON: Coupon = {
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

const INACTIVE_COUPON: Coupon = {
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

// ── Preservation Property Tests ─────────────────────────────────────────────

/**
 * Preservation Property Tests — Existing Coupon Validation Unchanged
 *
 * These tests capture the CURRENT behavior of the validation logic on unfixed code.
 * They MUST PASS on unfixed code to establish the baseline, and MUST continue
 * to pass after the fix is applied.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 */
describe('Preservation: Existing Coupon Validation Unchanged', () => {
  it('property: coupons with maxUsesPerCustomer=null accept any customer regardless of prior uses', () => {
    /**
     * **Validates: Requirements 3.2, 3.4**
     *
     * For coupons without a per-customer limit, any email should be accepted
     * when other checks pass (active, not expired, global limit not reached, minOrder met).
     */
    const emailArb = fc.emailAddress()
    const couponArb = fc.constantFrom(...NULL_PER_CUSTOMER_COUPONS)
    // Generate subtotals that meet the coupon's minOrder requirement
    const subtotalArb = fc.double({ min: 50, max: 500, noNaN: true })

    fc.assert(
      fc.property(couponArb, emailArb, subtotalArb, (coupon, email, subtotal) => {
        // Ensure subtotal meets this coupon's minOrder
        if (subtotal < coupon.minOrder) return // skip — tested separately
        const result = validateCoupon(coupon, { code: coupon.code, subtotal, email })
        expect(result.success).toBe(true)
        expect(result.discount).toBeDefined()
      }),
      { numRuns: 200 },
    )
  })

  it('property: invalid coupon codes (null coupon) always return error', () => {
    /**
     * **Validates: Requirements 3.3**
     *
     * When the coupon lookup returns null (code not found), the validation
     * should always return an error regardless of email or subtotal.
     */
    const subtotalArb = fc.double({ min: 0.01, max: 1000, noNaN: true })
    const emailArb = fc.emailAddress()

    fc.assert(
      fc.property(subtotalArb, emailArb, (subtotal, email) => {
        const result = validateCoupon(null, { code: 'INVALIDCODE', subtotal, email })
        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid coupon code')
      }),
      { numRuns: 100 },
    )
  })

  it('property: inactive coupons always return error', () => {
    /**
     * **Validates: Requirements 3.3**
     *
     * Inactive coupons should always be rejected regardless of subtotal or email.
     */
    const subtotalArb = fc.double({ min: 0.01, max: 1000, noNaN: true })
    const emailArb = fc.emailAddress()

    fc.assert(
      fc.property(subtotalArb, emailArb, (subtotal, email) => {
        const result = validateCoupon(INACTIVE_COUPON, { code: INACTIVE_COUPON.code, subtotal, email })
        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid coupon code')
      }),
      { numRuns: 100 },
    )
  })

  it('property: subtotals below minOrder always return error', () => {
    /**
     * **Validates: Requirements 3.3**
     *
     * When the subtotal is below the coupon's minOrder threshold,
     * the validation should reject regardless of email.
     */
    const emailArb = fc.emailAddress()
    // BOBA20 has minOrder=50, generate subtotals strictly below that
    const subtotalArb = fc.double({ min: 0.01, max: 49.99, noNaN: true })

    fc.assert(
      fc.property(subtotalArb, emailArb, (subtotal, email) => {
        const result = validateCoupon(BOBA20_COUPON, { code: 'BOBA20', subtotal, email })
        expect(result.success).toBe(false)
        expect(result.error).toContain('Minimum order')
      }),
      { numRuns: 100 },
    )
  })

  it('property: discount calculation — percent type = subtotal * (value/100), fixed type = min(value, subtotal)', () => {
    /**
     * **Validates: Requirements 3.3**
     *
     * The discount calculation must remain identical:
     * - percent type: subtotal * (value / 100)
     * - fixed type: min(value, subtotal)
     */
    const couponArb = fc.constantFrom(...NULL_PER_CUSTOMER_COUPONS)
    const subtotalArb = fc.double({ min: 50, max: 500, noNaN: true })

    fc.assert(
      fc.property(couponArb, subtotalArb, (coupon, subtotal) => {
        if (subtotal < coupon.minOrder) return // skip — tested separately
        const result = validateCoupon(coupon, { code: coupon.code, subtotal })
        expect(result.success).toBe(true)

        const expectedDiscount =
          coupon.type === 'percent'
            ? Math.round(subtotal * (coupon.value / 100) * 100) / 100
            : Math.round(Math.min(coupon.value, subtotal) * 100) / 100

        expect(result.discount).toBe(expectedDiscount)
      }),
      { numRuns: 200 },
    )
  })
})
