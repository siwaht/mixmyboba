# FIRSTSIP Coupon Per-Customer Usage Limit — Bugfix Design

## Overview

The FIRSTSIP coupon is advertised as a first-order-only discount (15% off), but the system has no mechanism to enforce per-customer usage limits. The Coupon model lacks a `maxUsesPerCustomer` field, the validation API doesn't receive or check the customer's email against past orders, and the checkout page doesn't send the email when validating coupons. The fix adds a nullable `maxUsesPerCustomer` column to the Coupon model and updates the validation pipeline to query the Order table for prior uses of the coupon by the same email address.

## Glossary

- **Bug_Condition (C)**: A coupon with `maxUsesPerCustomer` set is applied by a customer whose email already has `>= maxUsesPerCustomer` orders using that coupon code — the system incorrectly accepts it
- **Property (P)**: When the bug condition holds, the validation API SHALL reject the coupon with an appropriate error message
- **Preservation**: All existing coupon validation behavior (active check, expiration, global maxUses, minOrder) and coupons without a per-customer limit must continue to work identically
- **`/api/coupons/validate` (POST)**: The route in `src/app/api/coupons/validate/route.ts` that validates a coupon code against business rules and returns the discount
- **`maxUsesPerCustomer`**: A new nullable integer field on the Coupon model — when set, limits how many times a single email address can use this coupon across orders
- **Order table**: The `Order` model in `prisma/schema.prisma` which stores `email` and `couponCode` per order, used to count prior coupon usage

## Bug Details

### Bug Condition

The bug manifests when a customer applies a coupon that has a per-customer usage limit (like FIRSTSIP, intended for first orders only) on a repeat order. The `/api/coupons/validate` endpoint does not receive the customer's email, does not query the Order table for prior usage, and the Coupon model has no `maxUsesPerCustomer` field to enforce the limit.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { code: string, email: string }
  OUTPUT: boolean

  coupon := findCouponByCode(input.code)
  IF coupon IS NULL OR coupon.maxUsesPerCustomer IS NULL THEN
    RETURN false
  END IF

  priorUses := COUNT(orders WHERE order.email = input.email
                                AND order.couponCode = coupon.code)

  RETURN priorUses >= coupon.maxUsesPerCustomer
END FUNCTION
```

### Examples

- **Repeat FIRSTSIP usage**: Customer `sarah.c@gmail.com` already has an order with `couponCode = "FIRSTSIP"`. She applies FIRSTSIP on a new order → system accepts it (bug). Expected: rejection with error message.
- **Third use of a 2-per-customer coupon**: A coupon with `maxUsesPerCustomer = 2` is applied by an email that already has 2 orders with that coupon code → system accepts it (bug). Expected: rejection.
- **First-time FIRSTSIP usage**: Customer `newcustomer@gmail.com` has zero orders with FIRSTSIP → system accepts it. Expected: accepted (not a bug).
- **Coupon without per-customer limit**: BOBA20 has `maxUsesPerCustomer = null`. Any customer reuses it → system accepts it. Expected: accepted (not a bug, unlimited per customer).

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Coupon active status check must continue to reject inactive coupons
- Coupon expiration check must continue to reject expired coupons
- Global `maxUses` / `usedCount` check must continue to reject globally exhausted coupons
- Minimum order (`minOrder`) check must continue to reject orders below the threshold
- Discount calculation (percent vs fixed) must remain identical
- Rate limiting on the validate endpoint must remain unchanged
- Coupons with `maxUsesPerCustomer = null` must allow unlimited per-customer reuse
- Admin coupon CRUD (create, toggle active, delete) must continue to work
- Checkout flow for orders without coupons must be completely unaffected

**Scope:**
All inputs where `maxUsesPerCustomer` is null or the customer has not yet reached the per-customer limit should be completely unaffected by this fix. This includes:
- All coupon validations for coupons without a per-customer limit
- First-time usage of any coupon with a per-customer limit
- Mouse/UI interactions on the checkout page unrelated to coupon validation
- Admin operations on coupons that don't involve the new field

## Hypothesized Root Cause

Based on the bug description and code analysis, the root causes are:

1. **Missing schema field**: The `Coupon` model in `prisma/schema.prisma` has no `maxUsesPerCustomer` column, so there is no way to store a per-customer limit for any coupon.

2. **Validation API ignores customer identity**: The `/api/coupons/validate` POST handler destructures only `{ code, subtotal }` from the request body. It never receives the customer's email and therefore cannot check per-customer usage.

3. **Checkout page omits email in coupon validation**: The `applyCoupon` function in `src/app/checkout/page.tsx` sends `{ code: couponCode, subtotal }` to the validate endpoint but does not include the `email` field that is already available in component state.

4. **No Order table query in validation**: Even if the email were available, the validation route has no logic to query `prisma.order.count()` for prior orders matching the email and coupon code.

5. **Admin and seed data gaps**: The `createCouponSchema` in `validations.ts`, the `CouponsTab` admin UI, the admin coupons API route, and the seed data all lack any concept of `maxUsesPerCustomer`.

## Correctness Properties

Property 1: Bug Condition — Per-Customer Limit Enforcement

_For any_ coupon validation request where the coupon has `maxUsesPerCustomer` set (non-null) and the customer's email has already been used on `>= maxUsesPerCustomer` orders with that coupon code, the fixed validation API SHALL reject the coupon with an error message indicating the per-customer limit has been reached.

**Validates: Requirements 2.1, 2.3**

Property 2: Preservation — Existing Validation and Unlimited Coupons

_For any_ coupon validation request where either (a) the coupon has `maxUsesPerCustomer = null`, or (b) the customer's email has fewer prior uses than `maxUsesPerCustomer`, the fixed validation API SHALL produce the same acceptance/rejection result as the original code for all other validation checks (active, expiration, global maxUses, minOrder), preserving all existing coupon validation behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `prisma/schema.prisma`

**Model**: `Coupon`

**Specific Changes**:
1. **Add `maxUsesPerCustomer` field**: Add `maxUsesPerCustomer Int?` to the Coupon model. Nullable so existing coupons default to unlimited per-customer usage. Run a Prisma migration.

**File**: `src/app/api/coupons/validate/route.ts`

**Function**: `POST` handler

**Specific Changes**:
2. **Accept `email` parameter**: Destructure `email` from the request body alongside `code` and `subtotal`.
3. **Add per-customer usage check**: After the existing global `maxUses` check, if `coupon.maxUsesPerCustomer` is set and `email` is provided, query `prisma.order.count({ where: { email, couponCode: coupon.code } })`. If the count `>= coupon.maxUsesPerCustomer`, return a 400/410 error with message like `"You've already used this coupon"`.

**File**: `src/app/checkout/page.tsx`

**Function**: `applyCoupon`

**Specific Changes**:
4. **Include email in validation request**: Update the `fetch('/api/coupons/validate', ...)` call body from `{ code: couponCode, subtotal }` to `{ code: couponCode, subtotal, email }`, using the `email` state variable already present in the component.

**File**: `src/lib/validations.ts`

**Schema**: `createCouponSchema`

**Specific Changes**:
5. **Add `maxUsesPerCustomer` to schema**: Add `maxUsesPerCustomer: z.number().int().positive().nullable().optional()` to the `createCouponSchema` object.

**File**: `src/app/api/admin/coupons/route.ts`

**Function**: `POST` handler

**Specific Changes**:
6. **Persist `maxUsesPerCustomer` on create**: Destructure `maxUsesPerCustomer` from `parsed.data` and include `maxUsesPerCustomer: maxUsesPerCustomer ?? null` in the `prisma.coupon.create` data object.

**File**: `src/app/admin/CouponsTab.tsx`

**Specific Changes**:
7. **Add form field for per-customer limit**: Add a `maxUsesPerCustomer` field to the form state and render an input labeled "Max Uses Per Customer (blank = unlimited)" in the admin coupon creation form. Include the field in the table display.

**File**: `prisma/seed.ts`

**Specific Changes**:
8. **Set FIRSTSIP per-customer limit in seed data**: Update the FIRSTSIP coupon seed entry to include `maxUsesPerCustomer: 1`.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Call the `/api/coupons/validate` endpoint with a coupon code and email of a customer who has already used that coupon. On unfixed code, the endpoint doesn't accept `email` at all, so the coupon will be accepted regardless of prior usage — confirming the bug.

**Test Cases**:
1. **Repeat FIRSTSIP Test**: Validate FIRSTSIP with `sarah.c@gmail.com` (who has an existing order with FIRSTSIP in seed data) — will succeed on unfixed code (bug confirmed)
2. **No Email Sent Test**: Validate FIRSTSIP without sending email — will succeed on unfixed code (confirms email is not checked)
3. **New Customer Test**: Validate FIRSTSIP with a brand-new email — will succeed on unfixed code (baseline, expected to succeed after fix too)
4. **Global Limit Still Works Test**: Validate a coupon that has hit its global `maxUses` — should fail on unfixed code (confirms existing checks work)

**Expected Counterexamples**:
- The validation endpoint accepts FIRSTSIP for `sarah.c@gmail.com` despite her having a prior order with that coupon
- Possible causes: no `email` parameter accepted, no Order table query, no `maxUsesPerCustomer` field

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := validateCoupon_fixed(input.code, input.subtotal, input.email)
  ASSERT result.status IS error
  ASSERT result.error CONTAINS "already used" OR "first order"
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT validateCoupon_original(input.code, input.subtotal)
       = validateCoupon_fixed(input.code, input.subtotal, input.email)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many combinations of coupon configurations (null vs set maxUsesPerCustomer, various maxUses, minOrder values) and customer states (0 to N prior orders)
- It catches edge cases like email with zero prior uses, coupons with null maxUsesPerCustomer, and boundary conditions
- It provides strong guarantees that all existing validation logic is unchanged for non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for coupons without per-customer limits and first-time users, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Null maxUsesPerCustomer Preservation**: Verify that coupons with `maxUsesPerCustomer = null` continue to allow unlimited per-customer reuse after the fix
2. **First-Time User Preservation**: Verify that a customer with zero prior uses of a coupon with `maxUsesPerCustomer = 1` is still accepted
3. **Existing Validation Preservation**: Verify that active/expiration/global maxUses/minOrder checks produce identical results before and after the fix
4. **No Email Graceful Handling**: Verify that if email is not provided (e.g., edge case), the per-customer check is skipped and existing behavior is preserved

### Unit Tests

- Test the per-customer usage count query logic with various order counts (0, 1, 2, N)
- Test edge cases: null `maxUsesPerCustomer`, missing email in request, email with no prior orders
- Test that the error message is appropriate for per-customer limit violations
- Test admin coupon creation with and without `maxUsesPerCustomer`

### Property-Based Tests

- Generate random coupon configurations (varying maxUsesPerCustomer: null, 1, 2, 5) and random prior order counts, verify the validation correctly accepts or rejects
- Generate random inputs without per-customer limits and verify all existing validation checks produce identical results to the original code
- Generate random email/coupon pairs and verify the Order count query returns correct counts

### Integration Tests

- Test full checkout flow: apply FIRSTSIP on first order (accepted), place order, apply FIRSTSIP on second order (rejected)
- Test admin flow: create coupon with `maxUsesPerCustomer = 2`, verify it appears in the admin table, verify enforcement on the third use
- Test that the checkout page correctly sends email to the validation endpoint and displays the rejection error
