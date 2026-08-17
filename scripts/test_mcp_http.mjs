const base = process.env.MCP_TEST_URL || 'http://127.0.0.1:8799/mcp'
const token = process.env.MCP_TEST_TOKEN || 'test-access-token'

const unauth = await fetch(base, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1.0.0' } } }),
})
if (unauth.status !== 401) throw new Error(`Expected 401 for unauthenticated request, got ${unauth.status}`)

const init = await fetch(base, {
  method: 'POST',
  headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1.0.0' } } }),
})
if (!init.ok) throw new Error(`Initialize failed: ${init.status} ${await init.text()}`)
const sessionId = init.headers.get('mcp-session-id')
if (!sessionId) throw new Error('Initialize response did not include mcp-session-id')

const list = await fetch(base, {
  method: 'POST',
  headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-session-id': sessionId },
  body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
})
const text = await list.text()
if (!list.ok) throw new Error(`tools/list failed: ${list.status} ${text}`)
if (!text.includes('health_check') || !text.includes('update_payment_settings')) throw new Error('tools/list response is missing required tools')
console.log(JSON.stringify({ unauthenticatedStatus: unauth.status, initializeStatus: init.status, toolsListStatus: list.status, sessionIdPresent: true }))
