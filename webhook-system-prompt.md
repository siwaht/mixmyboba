# Prompt: Build a Webhook Event System for Outbound Notifications

## Goal

Build a lightweight webhook event system that fires outbound HTTP POST requests to external URLs (like n8n, Zapier, Make, or any webhook receiver) whenever key business events happen in the app. This enables automated workflows — email confirmations, Slack alerts, inventory warnings, distributor notifications — without adding that logic to the app itself.

## Architecture Overview

The system has 3 parts:

1. **A webhook dispatcher library** — a single utility file that loads config, signs payloads, and delivers HTTP POSTs with retry logic. It exposes one function: `emitWebhookEvent(eventName, data)`. This function is fire-and-forget (non-blocking) so it never slows down API responses.

2. **A JSON config file** at the project root (`webhook-settings.json`) where the admin configures endpoint URLs, which events each endpoint subscribes to, a shared HMAC secret, retry count, and timeout.

3. **Hook calls in existing API routes** — one-liner `emitWebhookEvent(...)` calls added after the main business logic succeeds in each relevant route.

## Webhook Settings File (`webhook-settings.json`)

```json
{
  "enabled": true,
  "secret": "your-hmac-secret-here",
  "endpoints": [
    {
      "id": "n8n-primary",
      "name": "n8n Primary Workflow",
      "url": "https://your-n8n-instance.com/webhook/abc123",
      "events": [
        "customer.registered",
        "order.created",
        "order.status_changed",
        "inventory.low_stock",
        "inventory.out_of_stock",
        "review.created",
        "product.updated"
      ],
      "active": true,
      "headers": {}
    }
  ],
  "lowStockThreshold": 20,
  "retries": 2,
  "timeoutMs": 10000
}
```

- `enabled`: global kill switch
- `secret`: used for HMAC-SHA256 signing (sent as `X-Webhook-Signature` header)
- `endpoints`: array of webhook receivers. Each has an `events` array to subscribe to specific events. `active` toggles individual endpoints.
- `lowStockThreshold`: stock level that triggers `inventory.low_stock`
- `retries`: number of retry attempts on failure (with exponential backoff)
- `timeoutMs`: per-request timeout

## Webhook Dispatcher Library

Create a utility file (e.g. `src/lib/webhooks.ts` or equivalent for your framework). It should:

### Types
- Define a union type of all event names (e.g. `'customer.registered' | 'order.created' | ...`)
- Define interfaces for endpoint config, settings, and payload

### Settings Loader
- Read `webhook-settings.json` from the project root
- Return safe defaults if file is missing or malformed

### HMAC Signing
- Use `crypto.createHmac('sha256', secret)` to sign the JSON body
- Attach as `X-Webhook-Signature: sha256=<hex>` header

### Delivery Function
- POST the JSON payload to the endpoint URL
- Include headers: `Content-Type: application/json`, `X-Webhook-Event: <event_name>`, `X-Webhook-Timestamp: <ISO string>`, plus any custom headers from the endpoint config
- Use `AbortController` for timeout
- On failure, retry with exponential backoff: `2^attempt * 500ms`
- Log failures to console but never throw

### Public API
```
emitWebhookEvent(event: string, data: object): void
```
- This is the only function other files import
- It must be NON-BLOCKING — call the async dispatch but don't await it
- Load settings, find all active endpoints subscribed to this event, deliver to each in parallel
- Swallow all errors (log them, never crash the request)

Also export:
```
getLowStockThreshold(): number
```
- Returns the configured threshold for inventory alerts

## Events to Implement

Wire these events into your existing API routes. Add the `emitWebhookEvent()` call AFTER the main business logic succeeds, right before the response is returned.

### 1. `customer.registered`
**Trigger:** After a new user account is created successfully
**Payload:**
```json
{
  "userId": "...",
  "email": "...",
  "name": "...",
  "registeredAt": "ISO timestamp"
}
```

### 2. `order.created`
**Trigger:** After a new order is created (both customer checkout and admin-created orders)
**Payload:**
```json
{
  "orderId": "...",
  "email": "...",
  "total": 99.99,
  "subtotal": 109.99,
  "discount": 10.00,
  "shipping": 0,
  "paymentMethod": "card",
  "status": "pending",
  "couponCode": "SAVE10",
  "items": [
    {
      "productId": "...",
      "productName": "Product Name",
      "quantity": 2,
      "price": 54.99,
      "variantLabel": "10mg"
    }
  ],
  "shippingAddress": "...",
  "source": "customer or admin",
  "createdAt": "ISO timestamp"
}
```

### 3. `order.status_changed`
**Trigger:** When an order's status is updated (e.g. pending -> paid -> shipped -> delivered -> cancelled)
**Important:** Fetch the current status BEFORE updating, so you can include both old and new status.
**Payload:**
```json
{
  "orderId": "...",
  "email": "...",
  "oldStatus": "pending",
  "newStatus": "shipped",
  "total": 99.99,
  "paymentMethod": "card",
  "items": [{ "productName": "...", "quantity": 1, "price": 49.99 }],
  "updatedAt": "ISO timestamp"
}
```

### 4. `inventory.low_stock`
**Trigger:** After an order is created, check each ordered product's updated stock. If stock is above 0 but at or below the configured threshold, fire this event.
**Payload:**
```json
{
  "productId": "...",
  "productName": "...",
  "slug": "...",
  "stock": 5,
  "threshold": 20,
  "category": "..."
}
```

### 5. `inventory.out_of_stock`
**Trigger:** Same check as above, but fires when stock hits 0 or below.
**Payload:**
```json
{
  "productId": "...",
  "productName": "...",
  "slug": "...",
  "stock": 0,
  "category": "..."
}
```

### 6. `review.created`
**Trigger:** After a customer submits a product review
**Payload:**
```json
{
  "reviewId": "...",
  "productId": "...",
  "productName": "...",
  "rating": 5,
  "title": "Great product",
  "body": "Review text...",
  "verified": true,
  "displayName": "John",
  "userId": "...",
  "createdAt": "ISO timestamp"
}
```

### 7. `product.updated`
**Trigger:** When an admin updates a product (price change, stock adjustment, activation/deactivation)
**Important:** Fetch the product's current values BEFORE updating, so you can include previous values for comparison.
**Payload:**
```json
{
  "productId": "...",
  "productName": "...",
  "slug": "...",
  "changes": { "price": 29.99, "stock": 50 },
  "previousValues": { "stock": 100, "price": 24.99, "active": true },
  "currentStock": 50,
  "currentPrice": 29.99,
  "active": true,
  "updatedAt": "ISO timestamp"
}
```

## Admin API for Managing Webhooks

Create an admin-only API endpoint (e.g. `/api/admin/webhooks`) with:

- **GET** — Return current settings (mask the secret for display, e.g. replace with masked characters)
- **PUT** — Update settings. If the secret value is the masked string, keep the existing secret.
- **POST** — Accept an `endpointId` and fire a test `order.created` event with dummy data so the admin can verify their n8n/Zapier connection works.

## Key Design Principles

1. **Non-blocking:** `emitWebhookEvent` must never slow down the API response. Fire and forget.
2. **Fail-safe:** If webhooks are misconfigured, unreachable, or error out, the main business logic is unaffected. Log errors, never throw.
3. **No new dependencies:** Use native `fetch`, `crypto`, and `fs`. No event bus libraries needed.
4. **Security:** HMAC-SHA256 signatures so the receiver can verify payloads are authentic.
5. **Idempotent payloads:** Include timestamps and IDs so receivers can deduplicate if they receive the same event twice (from retries).

## How the Receiver (n8n) Uses This

The receiving workflow tool (n8n, Zapier, Make) creates a "Webhook" trigger node that gives a URL. That URL goes into `webhook-settings.json`. Every event arrives as a POST with this structure:

```json
{
  "event": "order.created",
  "timestamp": "2026-04-14T12:00:00.000Z",
  "data": { ... event-specific payload ... }
}
```

The workflow can branch on `event` to handle different scenarios — send confirmation emails, notify on Slack, alert distributors, update spreadsheets, etc.
