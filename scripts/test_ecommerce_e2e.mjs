import { Client } from '../mcp-server/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js'
import { StdioClientTransport } from '../mcp-server/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js'

const base = process.env.BASE_URL || 'http://127.0.0.1:5000'
const email = process.env.ADMIN_EMAIL || 'cc@siwaht.com'
const password = process.env.ADMIN_PASSWORD || 'Hola173!'

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, options)
  const text = await response.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path} -> ${response.status}: ${text.slice(0, 400)}`)
  return data
}

const health = await request('/api/health')
const publicProducts = await request('/api/products')
if (!Array.isArray(publicProducts) || publicProducts.length === 0) throw new Error('Public product catalog is empty')
const methods = await request('/api/payment-methods')
if (!Array.isArray(methods)) throw new Error('Payment methods response is not an array')
const tokenResponse = await request('/api/admin/auth/token', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
const token = tokenResponse.token
if (!token) throw new Error('Admin token was not returned')
const authHeaders = { authorization: `Bearer ${token}` }

const adminStats = await request('/api/admin/stats', { headers: authHeaders })
const products = await request('/api/admin/products', { headers: authHeaders })
const customers = await request('/api/admin/customers', { headers: authHeaders })
const orders = await request('/api/admin/orders', { headers: authHeaders })
const inventory = await request('/api/admin/inventory', { headers: authHeaders })
const coupons = await request('/api/admin/coupons', { headers: authHeaders })
const reviews = await request('/api/admin/reviews', { headers: authHeaders })
const siteSettings = await request('/api/admin/settings', { headers: authHeaders })
const pageContent = await request('/api/admin/page-content', { headers: authHeaders })
const paymentSettings = await request('/api/admin/payment-settings', { headers: authHeaders })
const webhooks = await request('/api/admin/webhooks', { headers: authHeaders })
const analytics = await request('/api/admin/analytics?period=7d', { headers: authHeaders })

const product = products.find(p => p.active) || products[0]
const quote = await request('/api/checkout/quote', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ items: [{ productId: product.id, quantity: 1, purchaseType: 'onetime' }] }),
})
if (!quote?.totals || quote.stockIssues?.length) throw new Error('Checkout quote did not price an in-stock product')

const createdOrder = await request('/api/orders', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    email: 'e2e-test@example.com',
    shippingAddress: '123 Test Street, Test City, TS 12345',
    paymentMethod: methods[0]?.value || 'crypto',
    items: [{ productId: product.id, quantity: 1, purchaseType: 'onetime' }],
  }),
})
if (!createdOrder.id) throw new Error('Order was not created')
const cancelledOrder = await request(`/api/orders/${createdOrder.id}`, {
  method: 'PATCH',
  headers: { ...authHeaders, 'content-type': 'application/json' },
  body: JSON.stringify({ status: 'cancelled' }),
})
if (cancelledOrder.status !== 'cancelled') throw new Error('Order cancellation failed')

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['mcp-server/index.js'],
  cwd: process.cwd(),
  env: { ...process.env, MIXMYBOBA_BASE_URL: base, MIXMYBOBA_ADMIN_TOKEN: token },
})
const client = new Client({ name: 'mixmyboba-e2e-test', version: '1.0.0' })
await client.connect(transport)
const mcpHealth = await client.callTool({ name: 'health_check', arguments: {} })
const mcpProducts = await client.callTool({ name: 'list_products', arguments: { limit: 5 } })
const mcpStats = await client.callTool({ name: 'get_dashboard_stats', arguments: {} })
const mcpPayment = await client.callTool({ name: 'get_payment_settings', arguments: {} })
const mcpWebhooks = await client.callTool({ name: 'get_webhook_settings', arguments: {} })
const mcpPageContent = await client.callTool({ name: 'get_page_content', arguments: {} })
for (const [name, result] of Object.entries({ mcpHealth, mcpProducts, mcpStats, mcpPayment, mcpWebhooks, mcpPageContent })) {
  if (result.isError) throw new Error(`MCP ${name} returned isError`)
}
const representativeOrder = orders[0]
const representativeCustomer = customers[0]
const readOnlyCases = [
  ['get_product', { id: product.id }],
  ['list_product_variants', { productId: product.id }],
  ['list_product_coas', { productId: product.id }],
  ['list_orders', { limit: 5 }],
  ['get_order', { id: representativeOrder.id }],
  ['list_customers', { limit: 5 }],
  ['get_customer', { id: representativeCustomer.id }],
  ['get_inventory', {}],
  ['list_coupons', {}],
  ['list_reviews', { productId: product.id, limit: 5 }],
  ['get_site_settings', {}],
  ['get_analytics', { period: '7d' }],
  ['get_revenue_analytics', { period: '7d', groupBy: 'day' }],
  ['get_customer_ltv', {}],
  ['list_product_tags', {}],
  ['get_auto_tag_settings', {}],
  ['get_tag_analytics', {}],
  ['get_recent_activity', { limit: 10 }],
  ['export_products_csv', {}],
  ['export_orders_csv', {}],
  ['export_customers_csv', {}],
]
let mcpReadCaseCount = 6
for (const [name, arguments_] of readOnlyCases) {
  const result = await client.callTool({ name, arguments: arguments_ })
  if (result.isError) throw new Error(`MCP ${name} returned isError`)
  mcpReadCaseCount += 1
}

const readMcpJson = (result, name) => {
  if (result.isError) throw new Error(`MCP ${name} returned isError`)
  const text = result.content?.find(item => item.type === 'text')?.text
  if (!text) throw new Error(`MCP ${name} returned no text payload`)
  return JSON.parse(text)
}
const unique = Date.now().toString(36)
const tempProduct = readMcpJson(await client.callTool({
  name: 'create_product',
  arguments: {
    slug: `e2e-temp-${unique}`,
    name: 'E2E Temporary Boba',
    price: 1.23,
    description: 'Temporary product for automated MCP verification.',
    imageUrl: '/test/e2e.png',
    category: 'Test',
    servings: '1 Serving',
    stock: 2,
    active: true,
  },
}), 'create_product')
if (!tempProduct.id) throw new Error('MCP create_product did not return an id')
const updatedTempProduct = readMcpJson(await client.callTool({
  name: 'update_product',
  arguments: { id: tempProduct.id, name: 'E2E Temporary Boba Updated', stock: 3 },
}), 'update_product')
if (updatedTempProduct.name !== 'E2E Temporary Boba Updated') throw new Error('MCP update_product did not update the product')
const deletedTempProduct = await client.callTool({ name: 'delete_product', arguments: { id: tempProduct.id } })
if (deletedTempProduct.isError) throw new Error('MCP delete_product returned isError')

const couponCode = `E2E${unique}`.slice(0, 20).toUpperCase()
const tempCoupon = readMcpJson(await client.callTool({
  name: 'create_coupon',
  arguments: { code: couponCode, type: 'percent', value: 10, maxUses: 1 },
}), 'create_coupon')
if (!tempCoupon.id) throw new Error('MCP create_coupon did not return an id')
const toggledCoupon = await client.callTool({ name: 'toggle_coupon', arguments: { id: tempCoupon.id, active: false } })
if (toggledCoupon.isError) throw new Error('MCP toggle_coupon returned isError')
const deletedCoupon = await client.callTool({ name: 'delete_coupon', arguments: { id: tempCoupon.id } })
if (deletedCoupon.isError) throw new Error('MCP delete_coupon returned isError')

await client.close().catch(() => {})
await transport.close().catch(() => {})

console.log(JSON.stringify({
  healthStatus: health.status || 'ok',
  publicProductCount: publicProducts.length,
  paymentMethodCount: methods.length,
  adminProductCount: products.length,
  adminCustomerCount: customers.length,
  adminOrderCount: orders.length,
  inventoryCount: inventory.length,
  couponCount: coupons.length,
  reviewCount: reviews.length,
  hasSiteSettings: Boolean(siteSettings),
  hasPageContent: Boolean(pageContent),
  hasPaymentSettings: Boolean(paymentSettings),
  hasWebhookSettings: Boolean(webhooks),
  hasAnalytics: Boolean(analytics),
  quotedProductId: product.id,
  createdAndCancelledOrder: createdOrder.id,
  mcpReadToolsPassed: 6 + 21,
  mcpWriteOperationsPassed: 6,
}))
