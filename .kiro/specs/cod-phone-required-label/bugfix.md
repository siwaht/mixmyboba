# Bugfix Requirements Document

## Introduction

The Phone Number field on the `/checkout` page is silently required when "Cash on Delivery" (COD) is selected as the payment method, but the label does not visually indicate this. The `<input>` element correctly has `required={paymentMethod === 'cod'}`, and the label shows "(optional)" when a non-COD method is selected, but when COD is selected the label simply reads "Phone Number" with no required indicator. Users only discover the field is mandatory when they submit the form and receive a native browser validation error. The label text should clearly communicate the required state when COD is active.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the payment method is set to "Cash on Delivery" (COD) THEN the Phone Number label displays "Phone Number" with no required indicator (the ternary expression evaluates to an empty string)

1.2 WHEN the payment method is set to "Cash on Delivery" (COD) and the user leaves the Phone Number field blank and submits the form THEN the user receives an unexpected native browser validation error ("Please fill out this field") with no prior visual indication that the field was mandatory

### Expected Behavior (Correct)

2.1 WHEN the payment method is set to "Cash on Delivery" (COD) THEN the system SHALL display the Phone Number label as "Phone Number (required)" or with an equivalent visual required indicator (e.g., a red asterisk) so the user knows the field is mandatory before submitting

2.2 WHEN the payment method is set to "Cash on Delivery" (COD) and the user leaves the Phone Number field blank THEN the system SHALL show a clear inline validation error message before or upon form submission, consistent with how other required fields (Email, Shipping Address) display their errors

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the payment method is NOT "Cash on Delivery" (e.g., Credit Card, Crypto, ACH, PayPal) THEN the system SHALL CONTINUE TO display the Phone Number label as "Phone Number (optional)"

3.2 WHEN the payment method is NOT "Cash on Delivery" and the user leaves the Phone Number field blank THEN the system SHALL CONTINUE TO allow form submission without a phone number validation error

3.3 WHEN the payment method is "Cash on Delivery" and the user provides a valid phone number THEN the system SHALL CONTINUE TO accept the form submission successfully

3.4 WHEN the user switches the payment method from COD to a non-COD method THEN the system SHALL CONTINUE TO update the Phone Number label back to "Phone Number (optional)" and remove the required constraint
