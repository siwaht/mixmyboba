# MixMyBoba Admin MCP Server

Full AI agent control of the MixMyBoba e-commerce site via Model Context Protocol.

## What's New in v4.0.0

- **Structured error handling** — Tool results use `isError: true` for HTTP 4xx/5xx, so AI clients can distinguish success from failure
- **Request timeouts** — 30s timeout prevents hung requests from blocking the server
- **Retry with exponential backoff** — Automatic retries on 429 (rate limit), 502, 503, 504, and network errors (up to 3 retries)
- **Structured logging** — JSON logs to stderr with timestamps, durations, and error context
- **Health check tool** — Verify backend connectivity before batch operations
- **Input validation** — `paymentMethod` and `status` fields use enums instead of free-form strings
- **Pagination support** — `list_products`, `list_orders`, `list_customers`, `list_reviews` accept `page`/`limit`
- **CSV import tools** — `import_products_csv` and `import_customers_csv` for round-trip data management
- **Coupon validation** — `validate_coupon` tool for pre-order coupon checks
- **MCP Resources** — 7 browsable resources plus 3 parameterized resource templates for store overview, inventory, orders, products, customers, and content
- **MCP Prompts** — 5 pre-built workflow templates for content audits, sales reports, restocking, customer insights, and fulfillment

## Quick Setup

The server supports local stdio clients and an authenticated Streamable HTTP endpoint for always-on remote agents.

1. Install dependencies:
   ```bash
   cd mcp-server && npm install
   ```

2. Generate an admin token (with the site running on localhost:5000):
   ```bash
   curl -X POST http://localhost:5000/api/admin/auth/token \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@cellulalabs.com","password":"your-password"}'
   ```

3. Add the token to `.kiro/settings/mcp.json`:

The generated token is an admin credential. Store it only in the client environment configuration; do not commit it to source control.
   ```json
   {
     "mcpServers": {
       "mixmyboba-admin": {
         "command": "node",
         "args": ["mcp-server/index.js"],
         "env": {
           "MIXMYBOBA_BASE_URL": "http://localhost:5000",
           "MIXMYBOBA_ADMIN_TOKEN": "<paste-token-here>"
         }
       }
     }
   }
   ```

## 61 Tools — Full Site Control

### Infrastructure
| Tool | Description |
|------|-------------|
| `health_check` | Verify backend connectivity, response time, and auth status |
| `generate_admin_token` | Get a JWT token for API access |

### Dashboard & Analytics (4 tools)
| Tool | Description |
|------|-------------|
| `get_dashboard_stats` | Revenue, orders, customers, top products, low stock alerts |
| `get_analytics` | Comprehensive analytics: revenue, customers, products, coupons |
| `get_revenue_analytics` | Granular revenue trends by day/week/month, category, payment method |
| `get_customer_ltv` | Customer lifetime value, churn risk, order frequency |

### Products (9 tools)
| Tool | Description |
|------|-------------|
| `list_products` | List all products (with pagination) |
| `get_product` | Get full product details with variants, COAs, reviews |
| `search_products` | Search storefront by name/category |
| `create_product` | Create product with all fields (scientific, batch, etc.) |
| `update_product` | Update any product fields |
| `delete_product` | Delete product permanently |
| `upload_product_image` | Upload image via base64, get public URL |
| `import_products_csv` | Bulk import/update products from CSV data |
| `export_products_csv` | Export all products as CSV |

### Product Variants (4 tools)
| Tool | Description |
|------|-------------|
| `list_product_variants` | List size/dosage variants |
| `create_product_variant` | Add variant (e.g. 5mg, 10mg) |
| `update_product_variant` | Update variant price/stock/label |
| `delete_product_variant` | Remove a variant |

### Certificates of Analysis (3 tools)
| Tool | Description |
|------|-------------|
| `list_product_coas` | List COAs for a product |
| `create_product_coa` | Add a COA with batch/purity/lab info |
| `delete_product_coa` | Remove a COA |

### Orders (5 tools)
| Tool | Description |
|------|-------------|
| `list_orders` | List/filter/search orders (with pagination) |
| `get_order` | Full order details with line items |
| `update_order_status` | Change status (pending→paid→shipped→delivered) |
| `create_order` | Create manual/phone/wholesale order |
| `export_orders_csv` | Export all orders as CSV |

### Customers (5 tools)
| Tool | Description |
|------|-------------|
| `list_customers` | List/search customers (with pagination) |
| `get_customer` | Full customer profile with orders & reviews |
| `update_customer_role` | Promote/demote customer↔admin |
| `import_customers_csv` | Bulk import/update customers from CSV data |
| `export_customers_csv` | Export all customers as CSV |

### Inventory (3 tools)
| Tool | Description |
|------|-------------|
| `get_inventory` | Stock levels sorted by lowest first |
| `update_stock` | Update single product stock |
| `bulk_update_stock` | Update multiple products at once |

### Coupons (5 tools)
| Tool | Description |
|------|-------------|
| `list_coupons` | List all coupons |
| `create_coupon` | Create percent/fixed discount |
| `toggle_coupon` | Enable/disable coupon |
| `delete_coupon` | Delete coupon |
| `validate_coupon` | Validate coupon code against a subtotal |

### Reviews (3 tools)
| Tool | Description |
|------|-------------|
| `list_reviews` | List/filter reviews by product (with pagination) |
| `update_review` | Toggle verified status |
| `delete_review` | Remove a review (moderation) |

### Site Content (2 tools)
| Tool | Description |
|------|-------------|
| `get_site_settings` | Get hero, badges, announcement |
| `update_site_settings` | Update hero text, CTAs, badges, banner |

### Payment Settings (2 tools)
| Tool | Description |
|------|-------------|
| `get_payment_settings` | Get Stripe/PayPal/Crypto/ACH/COD config |
| `update_payment_settings` | Configure gateways, tax, shipping rate, and free-shipping threshold |

### Activity Feed (1 tool)
| Tool | Description |
|------|-------------|
| `get_recent_activity` | Real-time feed of store events (last 24h default) |

### Webhooks (3 tools)
| Tool | Description |
|------|-------------|
| `get_webhook_settings` | Read webhook settings and endpoints |
| `update_webhook_settings` | Update webhook settings |
| `test_webhook` | Send a sample event to an endpoint |

### Remote HTTP mode

For an always-on remote agent, run the server on a protected host with `MCP_TRANSPORT=http`, `MCP_HOST=0.0.0.0`, `MCP_PORT=8787`, `MIXMYBOBA_BASE_URL=https://your-store.example`, `MIXMYBOBA_ADMIN_TOKEN=<admin-token>`, and `MIXMYBOBA_MCP_ACCESS_TOKEN=<agent-access-token>`. Reverse proxy `/mcp` through HTTPS and pass the access token as `Authorization: Bearer <agent-access-token>`. The HTTP mode maintains one stateful MCP session at a time; use separate processes or a session-aware deployment when multiple agents are required.

## 7 Resources + 3 Resource Templates — Browsable Data

| Resource URI | Description |
|---|---|
| `cellula://store/overview` | Live store stats (revenue, orders, customers, alerts) |
| `cellula://inventory/low-stock` | Products with ≤ 10 units in stock |
| `cellula://coupons/active` | All currently active coupons |
| `cellula://orders/recent` | 20 most recent orders |
| `cellula://products/catalog` | Full product catalog |
| `cellula://products/{productId}` | Individual product details |
| `cellula://orders/{orderId}` | Individual order details |
| `cellula://customers/{customerId}` | Individual customer profile |

## 4 Prompts — Workflow Templates

| Prompt | Description |
|---|---|
| `weekly-sales-report` | Generate a formatted sales report with revenue, trends, and insights |
| `restock-recommendation` | Analyze inventory and recommend restocking quantities by urgency |
| `customer-insights` | Deep-dive into a customer's history, preferences, and LTV |
| `order-fulfillment-check` | Review pending/paid orders and flag fulfillment issues |
