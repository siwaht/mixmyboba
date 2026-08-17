from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
mcp = (root / "mcp-server" / "index.js").read_text()
route_files = sorted((root / "src" / "app" / "api").rglob("route.ts"))

mcp_paths = sorted(set(re.findall(r'"(/api/[^"`?]+)', mcp)))
admin_routes = []
for file in route_files:
    relative = file.relative_to(root / "src" / "app")
    route = "/" + str(relative.parent).replace("\\", "/")
    route = re.sub(r"/\[([^]]+)\]", r"/{\1}", route)
    admin_routes.append(route)

mcp_tools = re.findall(r'server\.tool\(\s*"([^"]+)"', mcp)
ui_text = (root / "src" / "app" / "admin" / "McpTab.tsx").read_text()
ui_tools = re.findall(r"name: '([^']+)'", ui_text)

print(f"MCP tools: {len(mcp_tools)}")
print(f"Admin UI tools: {len(ui_tools)}")
print("Tools in MCP but missing from admin UI:")
for name in sorted(set(mcp_tools) - set(ui_tools)):
    print(f"  {name}")
print("Tools in admin UI but missing from MCP:")
for name in sorted(set(ui_tools) - set(mcp_tools)):
    print(f"  {name}")
print(f"\nMCP API path literals: {len(mcp_paths)}")
print("MCP paths:")
for path in mcp_paths:
    print(f"  {path}")
print(f"\nActual API route count: {len(admin_routes)}")
print("Admin routes not referenced by an MCP path literal:")
for route in admin_routes:
    if route.startswith("/api/admin") and not any(route == path or re.sub(r"/\{[^}]+\}", "/", route).rstrip("/") in path for path in mcp_paths):
        print(f"  {route}")
print("\nMCP path literals without an exact/parameterized route match:")
for path in mcp_paths:
    normalized = re.sub(r"/[^/]+$", "/{id}", path) if path.count("/") else path
    if not any(path == route or route.rstrip("/") == path.rstrip("/") or ("{" in route and re.sub(r"/\{[^}]+\}", "/", route).rstrip("/") in path) for route in admin_routes):
        print(f"  {path}")
