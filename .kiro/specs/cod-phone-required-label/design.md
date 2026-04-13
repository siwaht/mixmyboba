# COD Phone Required Label Bugfix Design

## Overview

The Phone Number label on the checkout page uses a ternary that evaluates to an empty string when COD is selected, instead of showing a required indicator. The fix changes the empty string `''` to `'(required)'` on line 205 of `src/app/checkout/page.tsx`. This is a single-character-class label text fix with no logic changes.

## Glossary

- **Bug_Condition (C)**: The payment method is set to `'cod'` — the label ternary produces an empty string instead of a required indicator
- **Property (P)**: When COD is selected, the phone label displays "(required)" to communicate the field is mandatory
- **Preservation**: When a non-COD method is selected, the label continues to display "(optional)"
- **paymentMethod**: React state variable in `CheckoutPage` that holds the selected payment method string
- **Phone label ternary**: The expression `paymentMethod === 'cod' ? '' : '(optional)'` on line 205

## Bug Details

### Bug Condition

The bug manifests when the user selects "Cash on Delivery" as their payment method. The label ternary evaluates the COD branch to an empty string, providing no visual indication that the phone field is required despite the `<input>` having `required={paymentMethod === 'cod'}`.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { paymentMethod: string }
  OUTPUT: boolean

  RETURN input.paymentMethod === 'cod'
         AND renderedLabelText(input) === 'Phone Number'
         AND NOT labelContainsRequiredIndicator(input)
END FUNCTION
```

### Examples

- User selects COD → label reads "Phone Number" with no indicator → user doesn't know it's required → **BUG**
- User selects Credit Card → label reads "Phone Number (optional)" → correct behavior
- User selects Crypto → label reads "Phone Number (optional)" → correct behavior
- User selects COD, leaves phone blank, submits → native browser error with no prior visual cue → **BUG (consequence)**

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Non-COD payment methods must continue to show "Phone Number (optional)"
- Form submission without phone must continue to succeed for non-COD methods
- Form submission with a valid phone for COD must continue to succeed
- Switching from COD to non-COD must revert the label to "(optional)"
- The `required` HTML attribute behavior (`required={paymentMethod === 'cod'}`) must remain unchanged
- Inline validation in `handleSubmit` for COD + empty phone must remain unchanged

**Scope:**
Only the label text for the COD branch of the ternary is affected. No validation logic, form submission behavior, or non-COD label text changes.

## Hypothesized Root Cause

The root cause is a simple typo/omission in the ternary expression on line 205:

```tsx
Phone Number {paymentMethod === 'cod' ? '' : '(optional)'}
```

The COD branch returns `''` (empty string) instead of `'(required)'`. The developer likely intended to add a required indicator but left the string empty.

This is the only root cause — no deeper logic issue exists. The HTML `required` attribute and `handleSubmit` validation are both correctly implemented.

## Correctness Properties

Property 1: Bug Condition - COD Phone Label Shows Required Indicator

_For any_ render state where `paymentMethod === 'cod'`, the Phone Number label SHALL contain the text "(required)" to visually communicate that the field is mandatory.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Non-COD Phone Label Shows Optional

_For any_ render state where `paymentMethod !== 'cod'`, the Phone Number label SHALL contain the text "(optional)", preserving the existing behavior for all non-COD payment methods.

**Validates: Requirements 3.1, 3.2, 3.4**

## Fix Implementation

### Changes Required

**File**: `src/app/checkout/page.tsx`

**Line**: 205

**Specific Changes**:
1. **Replace empty string with "(required)"**: Change the COD branch of the ternary from `''` to `'(required)'`

Before:
```tsx
Phone Number {paymentMethod === 'cod' ? '' : '(optional)'}
```

After:
```tsx
Phone Number {paymentMethod === 'cod' ? '(required)' : '(optional)'}
```

No other files require changes.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause is the empty string in the ternary.

**Test Plan**: Render the checkout component with `paymentMethod` set to `'cod'` and assert the phone label text. Run on UNFIXED code to observe the missing indicator.

**Test Cases**:
1. **COD Label Test**: Render with COD selected, assert label contains "(required)" (will fail on unfixed code)
2. **COD Label Text Content**: Check the exact rendered text of the phone label when COD is active (will show "Phone Number" with no indicator)

**Expected Counterexamples**:
- Label text is "Phone Number" instead of "Phone Number (required)" when COD is selected

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed label displays the required indicator.

**Pseudocode:**
```
FOR ALL state WHERE state.paymentMethod === 'cod' DO
  renderedLabel := renderPhoneLabel(state)
  ASSERT renderedLabel CONTAINS '(required)'
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the label continues to display "(optional)".

**Pseudocode:**
```
FOR ALL state WHERE state.paymentMethod !== 'cod' DO
  ASSERT renderPhoneLabel(state) CONTAINS '(optional)'
END FOR
```

**Testing Approach**: Property-based testing can generate random non-COD payment method values to verify the label always shows "(optional)" for those cases.

**Test Cases**:
1. **Non-COD Label Preservation**: Verify each non-COD method (crypto, ach, card, paypal) shows "(optional)"
2. **Method Switching Preservation**: Verify switching from COD to non-COD reverts label to "(optional)"
3. **Form Submission Preservation**: Verify non-COD submissions without phone continue to succeed

### Unit Tests

- Test label text when `paymentMethod === 'cod'` shows "(required)"
- Test label text for each non-COD method shows "(optional)"
- Test label updates when switching between payment methods

### Property-Based Tests

- Generate random payment method values from the enum and verify the label matches: "(required)" for COD, "(optional)" for all others
- Generate random sequences of payment method switches and verify the label is always correct after each switch

### Integration Tests

- Test full checkout flow with COD selected, verifying the label and successful submission with phone provided
- Test full checkout flow with non-COD method, verifying "(optional)" label and successful submission without phone
