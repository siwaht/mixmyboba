# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - COD Phone Label Missing Required Indicator
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to `paymentMethod === 'cod'` — for this input, the phone label text must contain "(required)"
  - Render the checkout page with `paymentMethod` set to `'cod'` and assert the phone label contains "(required)" (from Bug Condition in design: `isBugCondition(input)` where `input.paymentMethod === 'cod'` AND label does NOT contain a required indicator)
  - Expected behavior assertion: label text matches "Phone Number (required)" (from `expectedBehavior` in design)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves the bug exists because the label renders "Phone Number" with no indicator)
  - Document counterexample: `paymentMethod='cod'` → label text is "Phone Number" instead of "Phone Number (required)"
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 2.1_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-COD Phone Label Shows Optional
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: render with `paymentMethod='crypto'` → label reads "Phone Number (optional)" on unfixed code
  - Observe: render with `paymentMethod='card'` → label reads "Phone Number (optional)" on unfixed code
  - Observe: render with `paymentMethod='ach'` → label reads "Phone Number (optional)" on unfixed code
  - Observe: render with `paymentMethod='paypal'` → label reads "Phone Number (optional)" on unfixed code
  - Write property-based test: _for all_ `paymentMethod` values in `['crypto', 'ach', 'card', 'paypal']` (i.e., where `paymentMethod !== 'cod'`), the phone label text contains "(optional)" (from Preservation Requirements in design)
  - Verify test passes on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 3. Fix COD phone label to show "(required)"

  - [x] 3.1 Implement the fix
    - In `src/app/checkout/page.tsx` line 205, change the COD branch of the ternary from `''` to `'(required)'`
    - Before: `Phone Number {paymentMethod === 'cod' ? '' : '(optional)'}`
    - After: `Phone Number {paymentMethod === 'cod' ? '(required)' : '(optional)'}`
    - _Bug_Condition: isBugCondition(input) where input.paymentMethod === 'cod' AND label contains no required indicator_
    - _Expected_Behavior: When paymentMethod === 'cod', phone label displays "Phone Number (required)"_
    - _Preservation: Non-COD methods continue to display "Phone Number (optional)"_
    - _Requirements: 1.1, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - COD Phone Label Shows Required Indicator
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior — when it passes, the bug is confirmed fixed
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-COD Phone Label Shows Optional
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all non-COD labels still show "(optional)" after fix

- [x] 4. Checkpoint — Ensure all tests pass
  - Run full test suite to confirm no regressions
  - Ensure all tests pass, ask the user if questions arise
