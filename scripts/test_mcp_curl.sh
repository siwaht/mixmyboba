#!/usr/bin/env bash
set -euo pipefail

STORE_URL="${STORE_URL:-http://127.0.0.1:5000}"
MCP_URL="${MCP_URL:-http://127.0.0.1:8799/mcp}"
MCP_TOKEN="${MCP_TOKEN:-curl-test-agent-token}"
MCP_LOG="${MCP_LOG:-/tmp/mixmyboba-mcp-curl.log}"
MCP_PID=""

cleanup() {
  if [[ -n "$MCP_PID" ]]; then
    kill "$MCP_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

admin_token_json=$(curl -fsS -X POST "$STORE_URL/api/admin/auth/token" \
  -H 'Content-Type: application/json' \
  --data '{"email":"cc@siwaht.com","password":"Hola173!"}')
admin_token=$(printf '%s' "$admin_token_json" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
[[ -n "$admin_token" ]] || { echo 'admin token generation failed' >&2; exit 1; }

MCP_TRANSPORT=http MCP_HOST=127.0.0.1 MCP_PORT=8799 \
MIXMYBOBA_BASE_URL="$STORE_URL" MIXMYBOBA_ADMIN_TOKEN="$admin_token" \
MIXMYBOBA_MCP_ACCESS_TOKEN="$MCP_TOKEN" \
node mcp-server/index.js > "$MCP_LOG" 2>&1 &
MCP_PID=$!
sleep 1

unauth_status=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$MCP_URL" \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl-test","version":"1.0.0"}}}')
[[ "$unauth_status" == "401" ]] || { echo "expected 401, got $unauth_status" >&2; exit 1; }

init_headers=$(mktemp)
init_body=$(mktemp)
trap 'rm -f "$init_headers" "$init_body"; cleanup' EXIT
curl -fsS -D "$init_headers" -o "$init_body" -X POST "$MCP_URL" \
  -H "Authorization: Bearer $MCP_TOKEN" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl-test","version":"1.0.0"}}}'
session_id=$(awk 'BEGIN{IGNORECASE=1} /^mcp-session-id:/ {gsub("\r", "", $2); print $2}' "$init_headers")
[[ -n "$session_id" ]] || { echo 'missing MCP session id' >&2; exit 1; }

tools_body=$(curl -fsS -X POST "$MCP_URL" \
  -H "Authorization: Bearer $MCP_TOKEN" \
  -H "Mcp-Session-Id: $session_id" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}')
printf '%s' "$tools_body" | grep -q 'health_check' || { echo 'tools/list missing health_check' >&2; exit 1; }
printf '%s' "$tools_body" | grep -q 'update_webhook_settings' || { echo 'tools/list missing webhook control' >&2; exit 1; }

health_body=$(curl -fsS -X POST "$MCP_URL" \
  -H "Authorization: Bearer $MCP_TOKEN" \
  -H "Mcp-Session-Id: $session_id" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"health_check","arguments":{}}}')
printf '%s' "$health_body" | grep -q 'healthy' && ! printf '%s' "$health_body" | grep -q 'unhealthy' || { echo 'health_check did not return a healthy MCP result' >&2; exit 1; }

printf '{"unauthenticated_status":%s,"initialize_status":200,"session_id_present":true,"tools_list_status":200,"health_check_status":200}\n' "$unauth_status"
