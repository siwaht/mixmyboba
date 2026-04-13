# Bugfix Requirements Document

## Introduction

The FIRSTSIP coupon code is marketed as a first-order-only discount ("use code FIRSTSIP for 15% off your first order"), but the system does not enforce any per-customer usage limit. Customers can reuse FIRSTSIP on every order, resulting in repeated discounts that were intended to be one-time only. The Coupon model lacks a `maxUsesPerCustomer` field, and the coupon validation endpoint only checks global usage caps — never whether a specific customer has already used the code.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a customer applies the FIRSTSIP coupon code on a repeat order (having already used it on a previous order) THEN the system accepts the coupon and applies the 15% discount again

1.2 WHEN an admin views the FIRSTSIP coupon in the Admin → Coupons panel THEN the system shows no per-customer usage limit field — only a global max uses cap of 500

1.3 WHEN the coupon validation API receives a coupon code and subtotal THEN the system only checks active status, expiration, global maxUses, and minOrder — it does not check whether the customer's email has already used this coupon

### Expected Behavior (Correct)

2.1 WHEN a customer applies the FIRSTSIP coupon code on a repeat order (having already used it on a previous order) THEN the system SHALL reject the coupon with an error message "This code is valid for first orders only"

2.2 WHEN an admin creates or edits a coupon in the Admin → Coupons panel THEN the system SHALL allow setting a per-customer usage limit (maxUsesPerCustomer) alongside the existing global max uses

2.3 WHEN the coupon validation API receives a coupon code and subtotal along with a customer email THEN the system SHALL check the number of past orders placed by that email using this coupon code and reject the coupon if the per-customer limit has been reached

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a customer applies FIRSTSIP for the very first time THEN the system SHALL CONTINUE TO accept the coupon and apply the 15% discount

3.2 WHEN a customer applies a coupon that has no per-customer usage limit (maxUsesPerCustomer is null) THEN the system SHALL CONTINUE TO allow unlimited reuse per customer as long as the global usage cap is not exceeded

3.3 WHEN the coupon validation API checks a coupon's active status, expiration date, global maxUses cap, and minOrder threshold THEN the system SHALL CONTINUE TO enforce all of these existing validations unchanged

3.4 WHEN an admin creates a coupon without specifying a per-customer limit THEN the system SHALL CONTINUE TO treat the coupon as having no per-customer restriction (unlimited per customer)
