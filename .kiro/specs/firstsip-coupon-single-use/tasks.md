# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - FIRSTSIP Repeat Usage Accepted
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the per-customer limit is not enforced
  - **Scoped PBT Approach**: Scope the property to the concrete failing case: `sarah.c@gmail.com` already has an order with `couponCode = "FIRSTSIP"` in seed data. For any valid subtotal, validating FIRSTSIP with her email should be rejected
  - Test: POST `/api/coupons/validate` with `{ code: "FIRSTSIP", subtotal: <any valid amount>, email: "sarah.c@gmail.com" }` — assert the response is an error (non-2xx status) with a message indicating the coupon has already been used
  - Bug condition from design: `isBugCondition(input)` returns true when `coupon.maxUsesPerCustomer` is set AND `COUNT(orders WHERE email = input.email AND couponCode = coupon.code) >= coupon.maxUsesPerCustomer`
  - On UNFIXED code: the endpoint ignores `email`, has no `maxUsesPerCustomer` field, and accepts the coupon — test FAILS (confirms bug exists)
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves the bug exists)
  - Document counterexamples found (e.g., "FIRSTSIP accepted for sarah.c@gmail.com despite existing order with that coupon")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.3, 2.1, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Coupon Validation Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - **Step 1 — Observe on UNFIXED code**:
    - Observe: POST `/api/coupons/validate` with `{ code: "FIRSTSIP", subtotal: 30 }` (no email, first-time-like) returns 200 with discount on unfixed code
    - Observe: POST `/api/coupons/validate` with `{ code: "BOBA20", subtotal: 60 }` returns 200 with 20% discount on unfixed code
    - Observe: POST `/api/coupons/validate` with `{ code: "BOBA20", subtotal: 10 }` returns 400 (minOrder not met) on unfixed code
    - Observe: POST `/api/coupons/validate` with `{ code: "INVALIDCODE", subtotal: 30 }` returns 404 on unfixed code
    - Observe: POST `/api/coupons/validate` with `{ code: "FIRSTSIP", subtotal: 30, email: "brand.new@example.com" }` (new customer, zero prior orders) returns 200 on unfixed code
  - **Step 2 — Write property-based tests capturing observed behavior**:
    - Property: for all coupons with `maxUsesPerCustomer = null` (e.g., BOBA20, SAVE10), any email should be accepted when other checks pass (active, not expired, global limit not reached, minOrder met)
    - Property: for all valid subtotals above minOrder with an active non-expired coupon, the discount calculation equals `subtotal * (value / 100)` for percent type or `min(value, subtotal)` for fixed type
    - Property: for all invalid coupon codes, the response is 404 regardless of email or subtotal
    - Property: for all subtotals below a coupon's minOrder, the response is 400 regardless of email
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Implement per-customer coupon usage limit

  - [x] 3.1 Add `maxUsesPerCustomer` to Prisma schema and run migration
    - Add `maxUsesPerCustomer Int?` field to the `Coupon` model in `prisma/schema.prisma`
    - Run `npx prisma migrate dev --name add-max-uses-per-customer` to create the migration
    - Regenerate Prisma client
    - _Bug_Condition: isBugCondition(input) where coupon.maxUsesPerCustomer is set AND prior order count >= maxUsesPerCustomer_
    - _Expected_Behavior: New field enables per-customer limit storage; null means unlimited_
    - _Preservation: Existing coupons get null by default — no behavior change_
    - _Requirements: 2.2, 2.3_

  - [x] 3.2 Update coupon validation API to accept email and check per-customer usage
    - In `src/app/api/coupons/validate/route.ts`:
    - Destructure `email` from request body alongside `code` and `subtotal`
    - After the existing global `maxUses` check, add per-customer check:
      - If `coupon.maxUsesPerCustomer` is set AND `email` is provided, query `prisma.order.count({ where: { email, couponCode: coupon.code } })`
      - If count `>= coupon.maxUsesPerCustomer`, return error response (e.g., 400 with `"You've already used this coupon"`)
    - If `email` is not provided or `maxUsesPerCustomer` is null, skip the check (preserves existing behavior)
    - _Bug_Condition: isBugCondition(input) where email has >= maxUsesPerCustomer orders with this coupon code_
    - _Expected_Behavior: Reject coupon when per-customer limit reached; accept otherwise_
    - _Preservation: No email or null maxUsesPerCustomer → skip check entirely, identical to original behavior_
    - _Requirements: 1.3, 2.1, 2.3, 3.2, 3.3_

  - [x] 3.3 Update checkout page to send email in coupon validation request
    - In `src/app/checkout/page.tsx`, update the `applyCoupon` function:
    - Change `body: JSON.stringify({ code: couponCode, subtotal })` to `body: JSON.stringify({ code: couponCode, subtotal, email })`
    - The `email` state variable is already available in the component
    - _Bug_Condition: Without email, the validation API cannot check per-customer usage_
    - _Expected_Behavior: Checkout sends email so validation can enforce per-customer limits_
    - _Preservation: All other checkout behavior unchanged — form fields, order submission, UI interactions_
    - _Requirements: 1.3, 2.3_

  - [x] 3.4 Update `createCouponSchema` in validations.ts
    - In `src/lib/validations.ts`, add to `createCouponSchema`:
    - `maxUsesPerCustomer: z.number().int().positive().nullable().optional()`
    - _Preservation: Existing coupon creation without this field continues to work (optional field)_
    - _Requirements: 2.2, 3.4_

  - [x] 3.5 Update admin coupons API to handle `maxUsesPerCustomer`
    - In `src/app/api/admin/coupons/route.ts` POST handler:
    - Destructure `maxUsesPerCustomer` from `parsed.data`
    - Include `maxUsesPerCustomer: maxUsesPerCustomer ?? null` in the `prisma.coupon.create` data object
    - _Preservation: Existing admin coupon CRUD (toggle active, delete) unchanged_
    - _Requirements: 2.2, 3.4_

  - [x] 3.6 Update admin CouponsTab UI with per-customer limit field
    - In `src/app/admin/CouponsTab.tsx`:
    - Add `maxUsesPerCustomer` to the `Coupon` interface and form state
    - Add input field labeled "Max Uses Per Customer (blank = unlimited)" in the coupon creation form grid
    - Include `maxUsesPerCustomer` in the form submission body
    - Display per-customer limit in the coupons table (e.g., new column or appended to Usage column)
    - _Preservation: Existing admin UI layout and coupon management flows unchanged_
    - _Requirements: 2.2_

  - [x] 3.7 Update seed data for FIRSTSIP with `maxUsesPerCustomer: 1`
    - In `prisma/seed.ts`, update the FIRSTSIP coupon entry in the `coupons` array:
    - Add `maxUsesPerCustomer: 1` to enforce single use per customer
    - Other coupons remain without `maxUsesPerCustomer` (null = unlimited per customer)
    - _Expected_Behavior: FIRSTSIP seeded as a one-per-customer coupon_
    - _Preservation: All other seed coupons unchanged_
    - _Requirements: 2.1_

  - [x] 3.8 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - FIRSTSIP Repeat Usage Rejected
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior: FIRSTSIP should be rejected for sarah.c@gmail.com
    - When this test passes, it confirms the per-customer limit is enforced correctly
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.3_

  - [x] 3.9 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Coupon Validation Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all existing validation checks (active, expiration, global maxUses, minOrder) still work
    - Confirm coupons with null maxUsesPerCustomer still allow unlimited per-customer reuse

- [x] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite to confirm everything passes
  - Verify exploration test (Property 1) passes after fix
  - Verify preservation tests (Property 2) pass after fix
  - Ensure no regressions in existing coupon validation behavior
  - Ask the user if questions arise
