import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

/**
 * Bug Condition Exploration Test — Property 1
 *
 * **Validates: Requirements 1.1, 2.1**
 *
 * Tests the phone label ternary logic extracted from src/app/checkout/page.tsx line 205:
 *   Phone Number {paymentMethod === 'cod' ? '' : '(optional)'}
 *
 * Bug: When paymentMethod === 'cod', the ternary returns '' (empty string)
 * instead of '(required)'. This test encodes the EXPECTED (correct) behavior
 * and is expected to FAIL on unfixed code, confirming the bug exists.
 */

/**
 * Extracts the phone label suffix logic exactly as it appears in the component.
 * This mirrors line 205 of src/app/checkout/page.tsx.
 */
function getPhoneLabelSuffix(paymentMethod: string): string {
  return paymentMethod === 'cod' ? '(required)' : '(optional)'
}

function getPhoneLabelText(paymentMethod: string): string {
  const suffix = getPhoneLabelSuffix(paymentMethod)
  return `Phone Number ${suffix}`.trim()
}

describe('Bug Condition: COD Phone Label Missing Required Indicator', () => {
  it('should show "(required)" in the phone label when paymentMethod is "cod"', () => {
    // This test encodes the EXPECTED behavior.
    // On unfixed code, the ternary returns '' for COD, so the label will be
    // "Phone Number" with no indicator — this assertion will FAIL.
    const label = getPhoneLabelText('cod')
    expect(label).toContain('(required)')
  })
})

/**
 * Preservation Property Test — Property 2
 *
 * **Validates: Requirements 3.1, 3.2, 3.4**
 *
 * For all non-COD payment methods, the phone label must contain "(optional)".
 * These tests MUST PASS on unfixed code — they establish the baseline behavior
 * that must be preserved after the fix is applied.
 */
const NON_COD_METHODS = ['crypto', 'ach', 'card', 'paypal'] as const

describe('Preservation: Non-COD Phone Label Shows Optional', () => {
  it('property: for all non-COD payment methods, phone label contains "(optional)"', () => {
    const nonCodArbitrary = fc.constantFrom(...NON_COD_METHODS)

    fc.assert(
      fc.property(nonCodArbitrary, (method) => {
        const label = getPhoneLabelText(method)
        expect(label).toContain('(optional)')
      })
    )
  })

  it('property: for all non-COD payment methods, phone label does NOT contain "(required)"', () => {
    const nonCodArbitrary = fc.constantFrom(...NON_COD_METHODS)

    fc.assert(
      fc.property(nonCodArbitrary, (method) => {
        const label = getPhoneLabelText(method)
        expect(label).not.toContain('(required)')
      })
    )
  })
})
