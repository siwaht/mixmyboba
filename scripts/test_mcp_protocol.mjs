import { Client } from '../mcp-server/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js'
import { StdioClientTransport } from '../mcp-server/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js'

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['mcp-server/index.js'],
  cwd: process.cwd(),
  env: { ...process.env, MIXMYBOBA_BASE_URL: 'http://127.0.0.1:59999' },
})
const client = new Client({ name: 'mixmyboba-protocol-test', version: '1.0.0' })

try {
  await client.connect(transport)
  const tools = await client.listTools()
  const resources = await client.listResources()
  const resourceTemplates = await client.listResourceTemplates()
  const prompts = await client.listPrompts()
  const names = new Set(tools.tools.map(tool => tool.name))
  const required = [
    'health_check',
    'list_products',
    'create_product',
    'create_order',
    'update_payment_settings',
    'get_page_content',
    'update_page_content',
    'get_revenue_analytics',
    'import_products_csv',
  ]
  const missing = required.filter(name => !names.has(name))
  if (missing.length) throw new Error(`Missing required tools: ${missing.join(', ')}`)
  console.log(JSON.stringify({
    tools: tools.tools.length,
    resources: resources.resources.length,
    resourceTemplates: resourceTemplates.resourceTemplates.length,
    prompts: prompts.prompts.length,
    requiredToolsPresent: true,
  }))
} finally {
  await client.close().catch(() => {})
  await transport.close().catch(() => {})
}
