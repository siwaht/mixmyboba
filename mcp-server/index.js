#!/usr/bin/env node
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const BASE_URL = process.env.CELLULA_BASE_URL || "http://localhost:5000";
const ADMIN_TOKEN = process.env.CELLULA_ADMIN_TOKEN || "";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

// ═══════════════════════════════════════════════════════════════════
// LOGGING (stderr — stdout is reserved for MCP stdio transport)
// ═══════════════════════════════════════════════════════════════════

function log(level, message, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...meta,
  };
  process.stderr.write(JSON.stringify(entry) + "\n");
}

// ═══════════════════════════════════════════════════════════════════
// API HELPER — with timeout, retries, structured errors
// ═══════════════════════════════════════════════════════════════════

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    ...(options.isFormData ? {} : { "Content-Type": "application/json" }),
    ...(ADMIN_TOKEN ? { Cookie: `auth-token=${ADMIN_TOKEN}` } : {}),
    ...options.headers,
  };
  const fetchOpts = { ...options, headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) };
  delete fetchOpts.isFormData;

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const start = Date.now();
      const res = await fetch(url, fetchOpts);
      const duration = Date.now() - start;

      // Handle rate limiting with retry-after
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("retry-after") || "5", 10);
        log("warn", "Rate limited", { path, retryAfter, attempt });
        if (attempt < MAX_RETRIES) {
          await sleep(retryAfter * 1000);
          continue;
        }
      }

      // Retry on transient server errors (502, 503, 504)
      if ([502, 503, 504].includes(res.status) && attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        log("warn", "Transient error, retrying", { path, status: res.status, attempt, delay });
        await sleep(delay);
        continue;
      }

      const contentType = res.headers.get("content-type") || "";
      let data;
      let isCsv = false;

      if (contentType.includes("text/csv")) {
        data = await res.text();
        isCsv = true;
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      log("info", "API call", { path, method: options.method || "GET", status: res.status, duration });
      return { status: res.status, data, isCsv };
    } catch (err) {
      lastError = err;
      if (err.name === "TimeoutError" || err.name === "AbortError") {
        log("error", "Request timeout", { path, attempt, timeout: REQUEST_TIMEOUT_MS });
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
          continue;
        }
      } else {
        log("error", "Request failed", { path, attempt, error: err.message });
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
          continue;
        }
      }
    }
  }

  // All retries exhausted
  return {
    status: 0,
    data: { error: `Request failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message || "unknown error"}` },
    isCsv: false,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════
// RESULT HELPERS — structured success/error responses
// ═══════════════════════════════════════════════════════════════════

function result(apiResponse) {
  const text = typeof apiResponse.data === "string"
    ? apiResponse.data
    : JSON.stringify(apiResponse.data, null, 2);

  if (apiResponse.status >= 400 || apiResponse.status === 0) {
    return { content: [{ type: "text", text }], isError: true };
  }
  return { content: [{ type: "text", text }] };
}

function successResult(data) {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text", text }] };
}

function errorResult(message) {
  return { content: [{ type: "text", text: message }], isError: true };
}

// ═══════════════════════════════════════════════════════════════════
// SERVER INIT
// ═══════════════════════════════════════════════════════════════════

const server = new McpServer({
  name: "cellulalabs-admin",
  version: "4.0.0",
  description:
    "Full admin control of the CellulaLabs e-commerce site. Manage products, orders, customers, inventory, coupons, reviews, site content, page content (navbar, homepage, about, FAQ, policies, footer, SEO), payment settings, analytics, and data import/export.",
});

// ═══════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "health_check",
  "Check connectivity to the CellulaLabs backend. Returns status, response time, and server info. Use this to verify the MCP server can reach the backend before running batch operations.",
  {},
  async () => {
    const start = Date.now();
    try {
      const r = await api("/api/admin/stats");
      const duration = Date.now() - start;
      return successResult({
        status: r.status < 400 ? "healthy" : "unhealthy",
        responseTimeMs: duration,
        backendUrl: BASE_URL,
        authenticated: !!ADMIN_TOKEN,
        httpStatus: r.status,
      });
    } catch (err) {
      return errorResult(
        JSON.stringify({
          status: "unreachable",
          backendUrl: BASE_URL,
          error: err.message,
          responseTimeMs: Date.now() - start,
        }, null, 2)
      );
    }
  }
);

// ═══════════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "generate_admin_token",
  "Generate an admin auth token for MCP API access. Use this first if CELLULA_ADMIN_TOKEN is not set. Returns a JWT token you can use.",
  {
    email: z.string().describe("Admin user email"),
    password: z.string().describe("Admin user password"),
  },
  async (args) => {
    const r = await api("/api/admin/auth/token", {
      method: "POST",
      body: JSON.stringify(args),
    });
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "get_dashboard_stats",
  "Get full dashboard statistics: total revenue, confirmed revenue, order counts by status, customer count, product count, low stock alerts, top 5 products by revenue, and 10 most recent orders.",
  {},
  async () => {
    const r = await api("/api/admin/stats");
    return result(r);
  }
);


// ═══════════════════════════════════════════════════════════════════
// PRODUCTS — Full CRUD + search
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "list_products",
  "List all products in the store with their id, slug, name, price, category, purity, stock, active status, and image URL. Supports optional pagination.",
  {
    page: z.number().optional().describe("Page number (1-based). Omit to get all products."),
    limit: z.number().optional().describe("Items per page (default 50, max 200)."),
  },
  async (args) => {
    const params = new URLSearchParams();
    if (args.page) params.set("page", String(args.page));
    if (args.limit) params.set("limit", String(args.limit));
    const qs = params.toString();
    const r = await api(`/api/admin/products${qs ? `?${qs}` : ""}`);
    return result(r);
  }
);

server.tool(
  "get_product",
  "Get full details of a single product by ID, including variants, COAs (certificates of analysis), and reviews.",
  {
    id: z.string().describe("Product ID"),
  },
  async (args) => {
    const r = await api(`/api/admin/products/${args.id}`);
    return result(r);
  }
);

server.tool(
  "search_products",
  "Search products on the public storefront by name or category. Returns active products with ratings.",
  {
    search: z.string().optional().describe("Search by product name"),
    category: z.string().optional().describe("Filter by category"),
  },
  async (args) => {
    const params = new URLSearchParams();
    if (args.search) params.set("search", args.search);
    if (args.category) params.set("category", args.category);
    const r = await api(`/api/products?${params}`);
    return result(r);
  }
);

server.tool(
  "create_product",
  "Create a new product in the store. Requires slug, name, price, description, imageUrl, category, and purity. Optionally set stock, scientific fields (molecularWeight, sequence, casNumber), storage info, batch tracking, and a product tag (best_seller, fast_selling, last_few_left, staff_pick, new, popular).",
  {
    slug: z.string().describe("URL-friendly slug, lowercase alphanumeric with hyphens only, e.g. 'bpc-157'"),
    name: z.string().describe("Product display name, e.g. 'BPC-157'"),
    price: z.number().describe("Price in USD"),
    description: z.string().describe("Product description"),
    imageUrl: z.string().describe("Product image URL (use upload_product_image first to get a URL)"),
    category: z.string().describe("Product category, e.g. 'Recovery', 'Weight Loss', 'Cognitive'"),
    purity: z.string().describe("Purity percentage, e.g. '99.8%'"),
    stock: z.number().optional().describe("Initial stock quantity (default 100)"),
    active: z.boolean().optional().describe("Whether product is active (default true)"),
    tag: z.string().optional().describe("Product tag/badge: 'best_seller', 'fast_selling', 'last_few_left', 'staff_pick', 'new', 'popular', or null to remove"),
    molecularWeight: z.string().optional().describe("Molecular weight, e.g. '1419.53 g/mol'"),
    sequence: z.string().optional().describe("Amino acid sequence"),
    casNumber: z.string().optional().describe("CAS registry number"),
    storageTemp: z.string().optional().describe("Storage temperature (default '-20°C')"),
    form: z.string().optional().describe("Product form (default 'Lyophilized Powder')"),
    batchNumber: z.string().optional().describe("Current batch number"),
    lotNumber: z.string().optional().describe("Current lot number"),
  },
  async (args) => {
    const r = await api("/api/admin/products", {
      method: "POST",
      body: JSON.stringify({ stock: 100, ...args }),
    });
    return result(r);
  }
);

server.tool(
  "update_product",
  "Update any fields on an existing product. Pass only the fields you want to change.",
  {
    id: z.string().describe("Product ID"),
    slug: z.string().optional(),
    name: z.string().optional(),
    price: z.number().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    category: z.string().optional(),
    purity: z.string().optional(),
    stock: z.number().optional(),
    active: z.boolean().optional(),
    tag: z.string().optional().describe("Product tag/badge: 'best_seller', 'fast_selling', 'last_few_left', 'staff_pick', 'new', 'popular', or empty string to remove"),
    molecularWeight: z.string().optional(),
    sequence: z.string().optional(),
    casNumber: z.string().optional(),
    storageTemp: z.string().optional(),
    form: z.string().optional(),
    batchNumber: z.string().optional(),
    lotNumber: z.string().optional(),
  },
  async (args) => {
    const { id, ...data } = args;
    // Convert empty tag string to null for removal
    if ('tag' in data && data.tag === '') data.tag = null;
    const r = await api(`/api/admin/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return result(r);
  }
);

server.tool(
  "delete_product",
  "Permanently delete a product and all its variants, COAs, and reviews.",
  {
    id: z.string().describe("Product ID to delete"),
  },
  async (args) => {
    const r = await api(`/api/admin/products/${args.id}`, { method: "DELETE" });
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// PRODUCT IMAGE UPLOAD
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "upload_product_image",
  "Upload a product image from a base64-encoded string. Returns the public URL to use as imageUrl when creating/updating products. The agent can receive an image from the user, convert it to base64, and upload it here.",
  {
    base64: z.string().describe("Base64-encoded image data (without data:image prefix)"),
    filename: z.string().describe("Desired filename, e.g. 'bpc-157.png'"),
    contentType: z.string().optional().describe("MIME type, e.g. 'image/png'. Defaults to image/png"),
  },
  async (args) => {
    const formData = new FormData();
    formData.append("base64", args.base64);
    formData.append("filename", args.filename);
    formData.append("contentType", args.contentType || "image/png");
    const r = await api("/api/admin/upload", {
      method: "POST",
      body: formData,
      isFormData: true,
      headers: ADMIN_TOKEN ? { Cookie: `auth-token=${ADMIN_TOKEN}` } : {},
    });
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// PRODUCT VARIANTS
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "list_product_variants",
  "List all size/dosage variants for a product (e.g. 5mg, 10mg, 30mg vials).",
  {
    productId: z.string().describe("Product ID"),
  },
  async (args) => {
    const r = await api(`/api/admin/products/${args.productId}/variants`);
    return result(r);
  }
);

server.tool(
  "create_product_variant",
  "Add a new size/dosage variant to a product.",
  {
    productId: z.string().describe("Product ID"),
    label: z.string().describe("Variant label, e.g. '5mg', '10mg', '30mg'"),
    price: z.number().describe("Variant price in USD"),
    stock: z.number().optional().describe("Variant stock (default 100)"),
    active: z.boolean().optional().describe("Whether variant is active (default true)"),
  },
  async (args) => {
    const { productId, ...data } = args;
    const r = await api(`/api/admin/products/${productId}/variants`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result(r);
  }
);

server.tool(
  "update_product_variant",
  "Update a product variant's label, price, stock, or active status.",
  {
    productId: z.string().describe("Product ID"),
    variantId: z.string().describe("Variant ID"),
    label: z.string().optional(),
    price: z.number().optional(),
    stock: z.number().optional(),
    active: z.boolean().optional(),
  },
  async (args) => {
    const { productId, ...data } = args;
    const r = await api(`/api/admin/products/${productId}/variants`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return result(r);
  }
);

server.tool(
  "delete_product_variant",
  "Delete a product variant.",
  {
    productId: z.string().describe("Product ID"),
    variantId: z.string().describe("Variant ID to delete"),
  },
  async (args) => {
    const r = await api(`/api/admin/products/${args.productId}/variants`, {
      method: "DELETE",
      body: JSON.stringify({ variantId: args.variantId }),
    });
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// CERTIFICATES OF ANALYSIS (COAs)
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "list_product_coas",
  "List all Certificates of Analysis for a product.",
  {
    productId: z.string().describe("Product ID"),
  },
  async (args) => {
    const r = await api(`/api/admin/products/${args.productId}/coas`);
    return result(r);
  }
);

server.tool(
  "create_product_coa",
  "Add a Certificate of Analysis to a product.",
  {
    productId: z.string().describe("Product ID"),
    batchNumber: z.string().describe("Batch number for this COA"),
    purityResult: z.string().describe("Purity test result, e.g. '99.8%'"),
    fileUrl: z.string().describe("URL to the COA PDF file"),
    labName: z.string().optional().describe("Testing lab name (default 'Janoshik Analytics')"),
    testDate: z.string().optional().describe("Test date in ISO format (default now)"),
  },
  async (args) => {
    const { productId, ...data } = args;
    const r = await api(`/api/admin/products/${productId}/coas`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result(r);
  }
);

server.tool(
  "delete_product_coa",
  "Delete a Certificate of Analysis.",
  {
    productId: z.string().describe("Product ID"),
    coaId: z.string().describe("COA ID to delete"),
  },
  async (args) => {
    const r = await api(`/api/admin/products/${args.productId}/coas`, {
      method: "DELETE",
      body: JSON.stringify({ coaId: args.coaId }),
    });
    return result(r);
  }
);


// ═══════════════════════════════════════════════════════════════════
// ORDERS — Full management (with input validation fixes)
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "list_orders",
  "List all orders. Optionally filter by status or search by email/order ID. Supports pagination.",
  {
    status: z.enum(["pending", "paid", "shipped", "delivered", "cancelled"]).optional().describe("Filter by status"),
    search: z.string().optional().describe("Search by customer email or order ID"),
    page: z.number().optional().describe("Page number (1-based). Omit to get all."),
    limit: z.number().optional().describe("Items per page (default 50, max 200)."),
  },
  async (args) => {
    const params = new URLSearchParams();
    if (args.status) params.set("status", args.status);
    if (args.search) params.set("search", args.search);
    if (args.page) params.set("page", String(args.page));
    if (args.limit) params.set("limit", String(args.limit));
    const r = await api(`/api/admin/orders?${params}`);
    return result(r);
  }
);

server.tool(
  "get_order",
  "Get full details of a specific order including all line items, customer info, shipping address, payment method, and notes.",
  {
    id: z.string().describe("Order ID"),
  },
  async (args) => {
    const r = await api(`/api/orders/${args.id}`);
    return result(r);
  }
);

server.tool(
  "update_order_status",
  "Update the status of an order. Valid statuses: pending, paid, shipped, delivered, cancelled.",
  {
    id: z.string().describe("Order ID"),
    status: z.enum(["pending", "paid", "shipped", "delivered", "cancelled"]).describe("New order status"),
  },
  async (args) => {
    const r = await api(`/api/orders/${args.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: args.status }),
    });
    return result(r);
  }
);

server.tool(
  "create_order",
  "Create a manual order on behalf of a customer. Useful for phone orders, wholesale, or comp orders.",
  {
    email: z.string().describe("Customer email address"),
    shippingAddress: z.string().describe("Full shipping address"),
    items: z.array(z.object({
      productId: z.string().describe("Product ID"),
      quantity: z.number().describe("Quantity"),
    })).describe("Array of items with productId and quantity"),
    paymentMethod: z.enum(["card", "crypto", "ach", "paypal", "cod", "manual"]).optional().describe("Payment method (default: card)"),
    status: z.enum(["pending", "paid", "shipped", "delivered"]).optional().describe("Initial status (default: pending)"),
    notes: z.string().optional().describe("Internal order notes"),
    discount: z.string().optional().describe("Discount amount in dollars, e.g. '10'"),
  },
  async (args) => {
    const r = await api("/api/admin/orders/create", {
      method: "POST",
      body: JSON.stringify(args),
    });
    return result(r);
  }
);

server.tool(
  "export_orders_csv",
  "Export all orders as CSV data. Returns the raw CSV text.",
  {},
  async () => {
    const r = await api("/api/admin/export/orders");
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// CUSTOMERS — Full management
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "list_customers",
  "List all customers with their order count and total spent. Optionally search by name or email. Supports pagination.",
  {
    search: z.string().optional().describe("Search by name or email"),
    page: z.number().optional().describe("Page number (1-based). Omit to get all."),
    limit: z.number().optional().describe("Items per page (default 50, max 200)."),
  },
  async (args) => {
    const params = new URLSearchParams();
    if (args.search) params.set("search", args.search);
    if (args.page) params.set("page", String(args.page));
    if (args.limit) params.set("limit", String(args.limit));
    const r = await api(`/api/admin/customers?${params}`);
    return result(r);
  }
);

server.tool(
  "get_customer",
  "Get full details of a single customer including all their orders and reviews.",
  {
    id: z.string().describe("Customer/User ID"),
  },
  async (args) => {
    const r = await api(`/api/admin/customers/${args.id}`);
    return result(r);
  }
);

server.tool(
  "update_customer_role",
  "Change a customer's role to 'customer' or 'admin'.",
  {
    id: z.string().describe("User ID"),
    role: z.enum(["customer", "admin"]).describe("New role"),
  },
  async (args) => {
    const r = await api(`/api/admin/customers/${args.id}`, {
      method: "PATCH",
      body: JSON.stringify({ role: args.role }),
    });
    return result(r);
  }
);

server.tool(
  "export_customers_csv",
  "Export all customers as CSV data.",
  {},
  async () => {
    const r = await api("/api/admin/export/customers");
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// INVENTORY — View and manage stock
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "get_inventory",
  "Get inventory levels for all products, sorted by lowest stock first. Includes stock count, total sold, price, category, and active status.",
  {},
  async () => {
    const r = await api("/api/admin/inventory");
    return result(r);
  }
);

server.tool(
  "update_stock",
  "Update the stock level for a single product.",
  {
    id: z.string().describe("Product ID"),
    stock: z.number().describe("New stock quantity"),
  },
  async (args) => {
    const r = await api(`/api/admin/products/${args.id}`, {
      method: "PATCH",
      body: JSON.stringify({ stock: args.stock }),
    });
    return result(r);
  }
);

server.tool(
  "bulk_update_stock",
  "Update stock levels for multiple products at once.",
  {
    updates: z.array(z.object({
      id: z.string().describe("Product ID"),
      stock: z.number().describe("New stock quantity"),
    })).describe("Array of { id, stock } updates"),
  },
  async (args) => {
    const r = await api("/api/admin/inventory/bulk", {
      method: "POST",
      body: JSON.stringify({ updates: args.updates }),
    });
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// COUPONS — Full CRUD
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "list_coupons",
  "List all discount coupons with their code, type, value, usage count, and status.",
  {},
  async () => {
    const r = await api("/api/admin/coupons");
    return result(r);
  }
);

server.tool(
  "create_coupon",
  "Create a new discount coupon.",
  {
    code: z.string().describe("Coupon code, e.g. 'SAVE20'. Will be uppercased."),
    type: z.enum(["percent", "fixed"]).describe("'percent' for percentage off, 'fixed' for dollar amount off"),
    value: z.number().describe("Discount value — percentage (e.g. 20 for 20%) or dollar amount (e.g. 10 for $10)"),
    minOrder: z.number().optional().describe("Minimum order amount to use this coupon (default 0)"),
    maxUses: z.number().optional().describe("Maximum number of times this coupon can be used (blank = unlimited)"),
    expiresAt: z.string().optional().describe("Expiration date in ISO format, e.g. '2026-12-31'"),
  },
  async (args) => {
    const r = await api("/api/admin/coupons", {
      method: "POST",
      body: JSON.stringify(args),
    });
    return result(r);
  }
);

server.tool(
  "toggle_coupon",
  "Enable or disable a coupon without deleting it.",
  {
    id: z.string().describe("Coupon ID"),
    active: z.boolean().describe("true to enable, false to disable"),
  },
  async (args) => {
    const r = await api("/api/admin/coupons", {
      method: "PATCH",
      body: JSON.stringify(args),
    });
    return result(r);
  }
);

server.tool(
  "delete_coupon",
  "Permanently delete a coupon.",
  {
    id: z.string().describe("Coupon ID to delete"),
  },
  async (args) => {
    const r = await api("/api/admin/coupons", {
      method: "DELETE",
      body: JSON.stringify({ id: args.id }),
    });
    return result(r);
  }
);

server.tool(
  "validate_coupon",
  "Validate a coupon code against a subtotal. Returns the discount amount if valid, or an error if expired/invalid/over-limit. Useful before creating manual orders.",
  {
    code: z.string().describe("Coupon code to validate"),
    subtotal: z.number().describe("Order subtotal to calculate discount against"),
  },
  async (args) => {
    const r = await api("/api/coupons/validate", {
      method: "POST",
      body: JSON.stringify(args),
    });
    return result(r);
  }
);


// ═══════════════════════════════════════════════════════════════════
// REVIEWS — Moderation (with pagination)
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "list_reviews",
  "List all product reviews. Optionally filter by product ID. Includes reviewer name, email, rating, title, body, and verified status. Supports pagination.",
  {
    productId: z.string().optional().describe("Filter reviews by product ID"),
    page: z.number().optional().describe("Page number (1-based). Omit to get all."),
    limit: z.number().optional().describe("Items per page (default 50, max 200)."),
  },
  async (args) => {
    const params = new URLSearchParams();
    if (args.productId) params.set("productId", args.productId);
    if (args.page) params.set("page", String(args.page));
    if (args.limit) params.set("limit", String(args.limit));
    const r = await api(`/api/admin/reviews?${params}`);
    return result(r);
  }
);

server.tool(
  "update_review",
  "Update a review — e.g. mark as verified or change the verified status.",
  {
    reviewId: z.string().describe("Review ID"),
    verified: z.boolean().optional().describe("Set verified purchase status"),
  },
  async (args) => {
    const r = await api("/api/admin/reviews", {
      method: "PATCH",
      body: JSON.stringify(args),
    });
    return result(r);
  }
);

server.tool(
  "delete_review",
  "Delete a review (moderation).",
  {
    reviewId: z.string().describe("Review ID to delete"),
  },
  async (args) => {
    const r = await api("/api/admin/reviews", {
      method: "DELETE",
      body: JSON.stringify({ reviewId: args.reviewId }),
    });
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// SITE CONTENT — Hero, badges, announcement
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "get_site_settings",
  "Get the current site content settings: hero section (title, subtitle, CTAs), trust badges, scrolling marquee items, stats bar, and announcement banner.",
  {},
  async () => {
    const r = await api("/api/admin/settings");
    return result(r);
  }
);

server.tool(
  "update_site_settings",
  "Update site content. Merges with existing settings — only pass fields you want to change. Supports hero title, subtitle, highlight text, CTA buttons, trust badges array, scrolling marquee items, stats bar, and announcement banner.",
  {
    hero: z.object({
      title: z.string().optional().describe("Main hero title text"),
      titleHighlight: z.string().optional().describe("Highlighted/gradient text in the title"),
      subtitle: z.string().optional().describe("Hero subtitle/description"),
      ctaPrimary: z.object({
        text: z.string().describe("Primary button text"),
        href: z.string().describe("Primary button link"),
      }).optional(),
      ctaSecondary: z.object({
        text: z.string().describe("Secondary button text"),
        href: z.string().describe("Secondary button link"),
      }).optional(),
    }).optional(),
    trustBadges: z.array(z.object({
      icon: z.string().describe("Emoji or icon character"),
      label: z.string().describe("Badge label text"),
    })).optional().describe("Array of trust badges. Pass the full array to replace all badges."),
    marqueeItems: z.array(z.string()).optional().describe("Array of scrolling marquee text items displayed below the hero (e.g. 'HPLC Verified', 'Janoshik Analytics Partner'). Pass the full array to replace all items."),
    statsBar: z.array(z.object({
      value: z.string().describe("Stat value, e.g. '99.8%', 'ISO 9001', '24h'"),
      label: z.string().describe("Stat label, e.g. 'Minimum Purity', 'Fulfillment'"),
    })).optional().describe("Array of stats displayed below the marquee. Pass the full array to replace all stats."),
    announcement: z.string().optional().describe("Announcement banner text. Empty string hides the banner."),
    announcementLink: z.string().optional().describe("Announcement banner link URL. Empty string removes the link."),
    announcementLinkText: z.string().optional().describe("Announcement banner link text, e.g. 'Shop now →'."),
  },
  async (args) => {
    const current = await api("/api/admin/settings");
    if (current.status >= 400) return result(current);
    const merged = { ...current.data };
    if (args.hero) {
      merged.hero = { ...current.data.hero };
      if (args.hero.title !== undefined) merged.hero.title = args.hero.title;
      if (args.hero.titleHighlight !== undefined) merged.hero.titleHighlight = args.hero.titleHighlight;
      if (args.hero.subtitle !== undefined) merged.hero.subtitle = args.hero.subtitle;
      if (args.hero.ctaPrimary) merged.hero.ctaPrimary = args.hero.ctaPrimary;
      if (args.hero.ctaSecondary) merged.hero.ctaSecondary = args.hero.ctaSecondary;
    }
    if (args.trustBadges !== undefined) merged.trustBadges = args.trustBadges;
    if (args.marqueeItems !== undefined) merged.marqueeItems = args.marqueeItems;
    if (args.statsBar !== undefined) merged.statsBar = args.statsBar;
    if (args.announcement !== undefined) merged.announcement = args.announcement;
    if (args.announcementLink !== undefined) merged.announcementLink = args.announcementLink;
    if (args.announcementLinkText !== undefined) merged.announcementLinkText = args.announcementLinkText;
    const r = await api("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(merged),
    });
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// PAGE CONTENT — Navbar, homepage sections, about, FAQ, policies, footer, SEO
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "get_page_content",
  "Get all page content: navbar (logo, links), homepage sections (hero, features, comparison, process, vibe, CTA), about page, FAQ, policies, footer, and SEO metadata. This controls every piece of text on the site.",
  {},
  async () => {
    const r = await api("/api/admin/page-content");
    return result(r);
  }
);

server.tool(
  "update_page_content",
  "Update page content. Merges with existing content — only pass the top-level keys you want to change. Supports: navbar, homepage, about, faq, policies, footer, seo. Each key replaces its entire section.",
  {
    navbar: z.object({
      logoEmoji: z.string().optional().describe("Logo emoji, e.g. '🧋'"),
      logoText: z.string().optional().describe("Logo text, e.g. 'mix my boba'"),
      links: z.array(z.object({
        label: z.string().describe("Link label"),
        href: z.string().describe("Link URL"),
      })).optional().describe("Navigation links array"),
    }).optional().describe("Navigation bar settings"),
    homepage: z.object({
      heroBadge: z.string().optional().describe("Badge text above hero title"),
      heroTitle: z.string().optional().describe("Main hero title"),
      heroHighlight: z.string().optional().describe("Highlighted text in hero"),
      heroSubtitle: z.string().optional().describe("Hero subtitle/description"),
      heroPrimaryCta: z.object({ text: z.string(), href: z.string() }).optional(),
      heroSecondaryCta: z.object({ text: z.string(), href: z.string() }).optional(),
      marquee2: z.array(z.string()).optional().describe("Second marquee items"),
      featureCards: z.array(z.object({
        icon: z.string().describe("Icon name: Coffee, Leaf, or Heart"),
        title: z.string(),
        description: z.string(),
      })).optional().describe("Feature cards below marquee"),
      comparison: z.object({
        title: z.string().optional(),
        subtitle: z.string().optional(),
        themLabel: z.string().optional(),
        themItems: z.array(z.string()).optional(),
        usLabel: z.string().optional(),
        usItems: z.array(z.string()).optional(),
      }).optional().describe("Comparison section (us vs them)"),
      storeSection: z.object({
        title: z.string().optional(),
        subtitle: z.string().optional(),
      }).optional(),
      processSection: z.object({
        title: z.string().optional(),
        subtitle: z.string().optional(),
        steps: z.array(z.object({
          num: z.string(),
          title: z.string(),
          description: z.string(),
        })).optional(),
      }).optional().describe("How-it-works process steps"),
      vibeSection: z.object({
        title: z.string().optional(),
        subtitle: z.string().optional(),
        cards: z.array(z.object({
          emoji: z.string(),
          stat: z.string(),
          title: z.string(),
          description: z.string(),
        })).optional(),
      }).optional().describe("Social proof / vibe cards"),
      ctaSection: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        primaryCta: z.object({ text: z.string(), href: z.string() }).optional(),
        secondaryCta: z.object({ text: z.string(), href: z.string() }).optional(),
      }).optional().describe("Bottom CTA section"),
    }).optional().describe("Homepage content"),
    about: z.object({
      pageTitle: z.string().optional(),
      pageSubtitle: z.string().optional(),
      sections: z.array(z.object({
        icon: z.string(),
        title: z.string(),
        content: z.string(),
        isList: z.boolean().optional(),
        contactEmail: z.string().optional(),
        contactNote: z.string().optional(),
      })).optional(),
    }).optional().describe("About page content"),
    faq: z.array(z.object({
      category: z.string(),
      items: z.array(z.object({
        q: z.string().describe("Question"),
        a: z.string().describe("Answer"),
      })),
    })).optional().describe("FAQ categories and Q&A pairs"),
    policies: z.array(z.object({
      id: z.string().describe("URL anchor ID"),
      icon: z.string(),
      title: z.string(),
      content: z.string(),
    })).optional().describe("Policy/compliance page sections"),
    footer: z.object({
      brandDescription: z.string().optional(),
      sections: z.array(z.object({
        title: z.string(),
        links: z.array(z.object({ label: z.string(), href: z.string() })),
        comingSoon: z.string().optional(),
      })).optional(),
    }).optional().describe("Footer content"),
    seo: z.object({
      siteTitle: z.string().optional(),
      siteDescription: z.string().optional(),
      siteKeywords: z.string().optional(),
    }).optional().describe("SEO metadata"),
  },
  async (args) => {
    // Fetch current content and merge
    const current = await api("/api/admin/page-content");
    if (current.status >= 400) return result(current);
    const merged = { ...current.data };
    if (args.navbar) merged.navbar = { ...current.data.navbar, ...args.navbar };
    if (args.homepage) {
      merged.homepage = { ...current.data.homepage };
      for (const [k, v] of Object.entries(args.homepage)) {
        if (v !== undefined) {
          if (typeof v === 'object' && !Array.isArray(v) && current.data.homepage[k]) {
            merged.homepage[k] = { ...current.data.homepage[k], ...v };
          } else {
            merged.homepage[k] = v;
          }
        }
      }
    }
    if (args.about) merged.about = { ...current.data.about, ...args.about };
    if (args.faq !== undefined) merged.faq = args.faq;
    if (args.policies !== undefined) merged.policies = args.policies;
    if (args.footer) merged.footer = { ...current.data.footer, ...args.footer };
    if (args.seo) merged.seo = { ...current.data.seo, ...args.seo };
    const r = await api("/api/admin/page-content", {
      method: "PUT",
      body: JSON.stringify(merged),
    });
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// PAYMENT SETTINGS — Stripe, PayPal, Crypto, ACH, General
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "get_payment_settings",
  "Get payment gateway configuration for Stripe, PayPal, Crypto, ACH, COD, and general settings (currency, tax, shipping threshold). Sensitive keys are masked.",
  {},
  async () => {
    const r = await api("/api/admin/payment-settings");
    return result(r);
  }
);

server.tool(
  "update_payment_settings",
  "Update payment gateway configuration. Pass only the sections/fields you want to change.",
  {
    stripe: z.object({
      enabled: z.boolean().optional(),
      testMode: z.boolean().optional(),
      publishableKey: z.string().optional(),
      secretKey: z.string().optional(),
      webhookSecret: z.string().optional(),
    }).optional(),
    paypal: z.object({
      enabled: z.boolean().optional(),
      testMode: z.boolean().optional(),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      webhookId: z.string().optional(),
    }).optional(),
    crypto: z.object({
      enabled: z.boolean().optional(),
      walletAddress: z.string().optional(),
      acceptedCoins: z.array(z.string()).optional(),
      network: z.string().optional(),
    }).optional(),
    ach: z.object({
      enabled: z.boolean().optional(),
      bankName: z.string().optional(),
      routingNumber: z.string().optional(),
      accountNumber: z.string().optional(),
      accountName: z.string().optional(),
    }).optional(),
    cod: z.object({
      enabled: z.boolean().optional(),
      instructions: z.string().optional(),
    }).optional(),
    general: z.object({
      currency: z.string().optional(),
      taxRate: z.number().optional(),
      freeShippingThreshold: z.number().optional(),
    }).optional(),
  },
  async (args) => {
    const r = await api("/api/admin/payment-settings", {
      method: "PUT",
      body: JSON.stringify(args),
    });
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// PRODUCT TAGS — Custom tag management
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "list_product_tags",
  "List all product tag definitions. Tags are custom badges (like 'Best Seller', 'Fast Selling', 'Last Few Left') that can be assigned to products. Returns slug, label, emoji, and color for each tag.",
  {},
  async () => {
    const r = await api("/api/admin/tags");
    return result(r);
  }
);

server.tool(
  "create_product_tag",
  "Create a new product tag definition. Tags appear as badges on product cards. Requires a unique slug, display label, and hex color. Emoji is optional (defaults to 🏷️).",
  {
    slug: z.string().describe("Unique tag identifier, e.g. 'limited_edition'. Use lowercase with underscores."),
    label: z.string().describe("Display label, e.g. 'Limited Edition'"),
    emoji: z.string().optional().describe("Emoji icon, e.g. '🔥'. Defaults to '🏷️'"),
    color: z.string().describe("Hex color, e.g. '#ef4444'"),
  },
  async (args) => {
    const r = await api("/api/admin/tags", {
      method: "POST",
      body: JSON.stringify(args),
    });
    return result(r);
  }
);

server.tool(
  "delete_product_tag",
  "Delete a product tag definition by slug. Products using this tag will keep the value but it won't display on the storefront.",
  {
    slug: z.string().describe("Tag slug to delete, e.g. 'best_seller'"),
  },
  async (args) => {
    const r = await api(`/api/admin/tags?slug=${encodeURIComponent(args.slug)}`, {
      method: "DELETE",
    });
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// AUTO-TAGGING — Rules-based automatic tag assignment
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "get_auto_tag_settings",
  "Get auto-tagging rules configuration. Rules automatically assign tags to products based on stock levels or sales volume.",
  {},
  async () => {
    const r = await api("/api/admin/auto-tags");
    return result(r);
  }
);

server.tool(
  "update_auto_tag_settings",
  "Update auto-tagging rules. Pass the full settings object with enabled flag and rules array.",
  {
    enabled: z.boolean().describe("Whether auto-tagging is enabled"),
    rules: z.array(z.object({
      id: z.string(),
      name: z.string(),
      condition: z.enum(["stock_below", "sold_above"]),
      threshold: z.number(),
      period: z.string().optional(),
      tagSlug: z.string(),
      enabled: z.boolean(),
    })).describe("Array of auto-tag rules"),
  },
  async (args) => {
    const r = await api("/api/admin/auto-tags", {
      method: "PUT",
      body: JSON.stringify(args),
    });
    return result(r);
  }
);

server.tool(
  "run_auto_tags",
  "Execute auto-tagging rules now. Scans all products and applies tags based on configured rules (stock levels, sales volume). Only tags products that don't already have a tag.",
  {},
  async () => {
    const r = await api("/api/admin/auto-tags", {
      method: "POST",
      body: JSON.stringify({ action: "run" }),
    });
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// BULK TAG ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "bulk_assign_tag",
  "Assign or remove a tag from multiple products at once. Pass an array of product IDs and the tag slug (or empty string to remove).",
  {
    productIds: z.array(z.string()).describe("Array of product IDs to update"),
    tag: z.string().describe("Tag slug to assign, or empty string to remove tag"),
  },
  async (args) => {
    const r = await api("/api/admin/bulk-tag", {
      method: "POST",
      body: JSON.stringify(args),
    });
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// TAG ANALYTICS
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "get_tag_analytics",
  "Get analytics for product tags: how many products use each tag, total units sold, and revenue generated per tag. Helps identify which tags drive the most conversions.",
  {},
  async () => {
    const r = await api("/api/admin/tag-analytics");
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// ACTIVITY FEED
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "get_recent_activity",
  "Get a real-time feed of everything that happened on the store: new orders, order status changes, new reviews, new customer signups, product updates, and low stock alerts. Use this to stay up-to-date with what's happening. Default: last 24 hours.",
  {
    since: z.string().optional().describe("ISO date to fetch events from, e.g. '2026-04-08T00:00:00Z'. Defaults to last 24 hours."),
    limit: z.number().optional().describe("Max events to return (default 50, max 200)"),
  },
  async (args) => {
    const params = new URLSearchParams();
    if (args.since) params.set("since", args.since);
    if (args.limit) params.set("limit", String(args.limit));
    const r = await api(`/api/admin/activity?${params}`);
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// ANALYTICS — Revenue, customer insights, product performance
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "get_analytics",
  "Get comprehensive store analytics: revenue trends (by day, category, payment method), average order value, repeat customer rate, top/worst performing products, coupon usage, and review summary. Use period like '7d', '30d', '90d', or 'all'.",
  {
    period: z.string().optional().describe("Time period: '7d', '14d', '30d', '90d', '365d', or 'all'. Default: '30d'"),
  },
  async (args) => {
    const params = new URLSearchParams();
    if (args.period) params.set("period", args.period);
    const r = await api(`/api/admin/analytics?${params}`);
    return result(r);
  }
);

server.tool(
  "get_revenue_analytics",
  "Dedicated revenue analytics: revenue trends grouped by day/week/month, revenue by category, revenue by payment method, average order value, repeat customer rate, top products by revenue, and discount impact. More granular than get_analytics.",
  {
    period: z.string().optional().describe("Time period: '7d', '14d', '30d', '90d', '365d', or 'all'. Default: '30d'"),
    groupBy: z.string().optional().describe("Group revenue trend by: 'day', 'week', or 'month'. Default: 'day'"),
  },
  async (args) => {
    const params = new URLSearchParams();
    if (args.period) params.set("period", args.period);
    if (args.groupBy) params.set("groupBy", args.groupBy);
    const r = await api(`/api/admin/analytics/revenue?${params}`);
    return result(r);
  }
);

server.tool(
  "get_customer_ltv",
  "Get customer lifetime value analytics. Without an ID: returns all customers ranked by LTV with churn risk, order frequency, and projected annual value. With an ID: returns detailed LTV breakdown for a single customer.",
  {
    id: z.string().optional().describe("Customer/User ID. Omit to get LTV summary for all customers."),
  },
  async (args) => {
    const params = new URLSearchParams();
    if (args.id) params.set("id", args.id);
    const r = await api(`/api/admin/analytics/customers?${params}`);
    return result(r);
  }
);


// ═══════════════════════════════════════════════════════════════════
// DATA IMPORT — CSV import for products and customers
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "import_products_csv",
  "Import products from CSV data. Creates new products or updates existing ones (matched by slug). CSV must have headers: slug, name, price. Optional: description, imageUrl, category, purity, stock, active, tag, molecularWeight, sequence, casNumber, storageTemp, form, batchNumber, lotNumber. Returns count of imported, skipped, and any errors.",
  {
    csvData: z.string().describe("Raw CSV text with headers. First row must be column names."),
  },
  async (args) => {
    // Build a FormData with a Blob to simulate file upload
    const formData = new FormData();
    const blob = new Blob([args.csvData], { type: "text/csv" });
    formData.append("file", blob, "import.csv");
    const r = await api("/api/admin/import/products", {
      method: "POST",
      body: formData,
      isFormData: true,
      headers: ADMIN_TOKEN ? { Cookie: `auth-token=${ADMIN_TOKEN}` } : {},
    });
    return result(r);
  }
);

server.tool(
  "import_customers_csv",
  "Import customers from CSV data. Creates new customers or updates existing ones (matched by email). CSV must have header: email. Optional: name, role, password (default: 'ChangeMe123!'). Returns count of imported, skipped, and any errors.",
  {
    csvData: z.string().describe("Raw CSV text with headers. First row must be column names."),
  },
  async (args) => {
    const formData = new FormData();
    const blob = new Blob([args.csvData], { type: "text/csv" });
    formData.append("file", blob, "import.csv");
    const r = await api("/api/admin/import/customers", {
      method: "POST",
      body: formData,
      isFormData: true,
      headers: ADMIN_TOKEN ? { Cookie: `auth-token=${ADMIN_TOKEN}` } : {},
    });
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// DATA EXPORT
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "export_products_csv",
  "Export all products as CSV data.",
  {},
  async () => {
    const r = await api("/api/admin/export/products");
    return result(r);
  }
);

// ═══════════════════════════════════════════════════════════════════
// MCP RESOURCES — Browsable read-only data
// ═══════════════════════════════════════════════════════════════════

server.resource(
  "store-overview",
  "cellula://store/overview",
  { description: "Live store overview: product count, order count, revenue, and low stock alerts", mimeType: "application/json" },
  async () => {
    const r = await api("/api/admin/stats");
    return {
      contents: [{
        uri: "cellula://store/overview",
        mimeType: "application/json",
        text: JSON.stringify(r.data, null, 2),
      }],
    };
  }
);

server.resource(
  "low-stock-alerts",
  "cellula://inventory/low-stock",
  { description: "Products with stock ≤ 10 units, sorted by lowest first", mimeType: "application/json" },
  async () => {
    const r = await api("/api/admin/inventory");
    const lowStock = Array.isArray(r.data)
      ? r.data.filter((p) => p.stock <= 10)
      : [];
    return {
      contents: [{
        uri: "cellula://inventory/low-stock",
        mimeType: "application/json",
        text: JSON.stringify(lowStock, null, 2),
      }],
    };
  }
);

server.resource(
  "active-coupons",
  "cellula://coupons/active",
  { description: "All currently active discount coupons", mimeType: "application/json" },
  async () => {
    const r = await api("/api/admin/coupons");
    const active = Array.isArray(r.data)
      ? r.data.filter((c) => c.active)
      : [];
    return {
      contents: [{
        uri: "cellula://coupons/active",
        mimeType: "application/json",
        text: JSON.stringify(active, null, 2),
      }],
    };
  }
);

server.resource(
  "recent-orders",
  "cellula://orders/recent",
  { description: "The 20 most recent orders with status and totals", mimeType: "application/json" },
  async () => {
    const r = await api("/api/admin/orders?limit=20");
    return {
      contents: [{
        uri: "cellula://orders/recent",
        mimeType: "application/json",
        text: JSON.stringify(r.data, null, 2),
      }],
    };
  }
);

server.resource(
  "product-catalog",
  "cellula://products/catalog",
  { description: "Full product catalog with names, prices, categories, and stock levels", mimeType: "application/json" },
  async () => {
    const r = await api("/api/admin/products");
    return {
      contents: [{
        uri: "cellula://products/catalog",
        mimeType: "application/json",
        text: JSON.stringify(r.data, null, 2),
      }],
    };
  }
);

// Dynamic resource: individual product by ID
server.resource(
  "product-detail",
  new ResourceTemplate("cellula://products/{productId}", { list: undefined }),
  { description: "Full details for a specific product including variants, COAs, and reviews", mimeType: "application/json" },
  async (uri, variables) => {
    const r = await api(`/api/admin/products/${variables.productId}`);
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(r.data, null, 2),
      }],
    };
  }
);

// Dynamic resource: individual order by ID
server.resource(
  "order-detail",
  new ResourceTemplate("cellula://orders/{orderId}", { list: undefined }),
  { description: "Full details for a specific order including line items and customer info", mimeType: "application/json" },
  async (uri, variables) => {
    const r = await api(`/api/orders/${variables.orderId}`);
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(r.data, null, 2),
      }],
    };
  }
);

// Dynamic resource: individual customer by ID
server.resource(
  "customer-detail",
  new ResourceTemplate("cellula://customers/{customerId}", { list: undefined }),
  { description: "Full customer profile with orders and reviews", mimeType: "application/json" },
  async (uri, variables) => {
    const r = await api(`/api/admin/customers/${variables.customerId}`);
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(r.data, null, 2),
      }],
    };
  }
);

server.resource(
  "page-content",
  "cellula://content/pages",
  { description: "All page content: navbar, homepage sections, about, FAQ, policies, footer, SEO metadata", mimeType: "application/json" },
  async () => {
    const r = await api("/api/admin/page-content");
    return {
      contents: [{
        uri: "cellula://content/pages",
        mimeType: "application/json",
        text: JSON.stringify(r.data, null, 2),
      }],
    };
  }
);

server.resource(
  "site-settings",
  "cellula://content/settings",
  { description: "Site settings: hero, badges, marquee, stats bar, announcement banner", mimeType: "application/json" },
  async () => {
    const r = await api("/api/admin/settings");
    return {
      contents: [{
        uri: "cellula://content/settings",
        mimeType: "application/json",
        text: JSON.stringify(r.data, null, 2),
      }],
    };
  }
);


// ═══════════════════════════════════════════════════════════════════
// MCP PROMPTS — Pre-built admin workflow templates
// ═══════════════════════════════════════════════════════════════════

server.prompt(
  "site-content-audit",
  "Review all site content and suggest improvements for copy, SEO, and consistency.",
  {},
  async () => {
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Perform a comprehensive site content audit.

Steps:
1. Use get_site_settings to fetch hero, badges, marquee, stats, and announcement
2. Use get_page_content to fetch all page content (navbar, homepage, about, FAQ, policies, footer, SEO)
3. Review and report on:
   - SEO: Are title, description, and keywords optimized?
   - Consistency: Does the brand voice match across all pages?
   - Completeness: Are there any empty or placeholder sections?
   - FAQ: Are common customer questions covered?
   - Policies: Are all legal requirements addressed?
   - Navigation: Are all important pages linked?
   - CTAs: Are calls-to-action clear and compelling?
4. Suggest specific improvements with exact text changes
5. If changes are approved, use update_page_content and update_site_settings to apply them`,
        },
      }],
    };
  }
);

server.prompt(
  "weekly-sales-report",
  "Generate a weekly sales report summarizing revenue, top products, order volume, and trends.",
  {
    period: z.string().optional().describe("Time period, e.g. '7d' (default), '14d', '30d'"),
  },
  async (args) => {
    const period = args.period || "7d";
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Generate a comprehensive weekly sales report for the CellulaLabs store.

Use the get_analytics tool with period="${period}" to fetch the data, then format a clear report covering:
1. Total revenue and order count for the period
2. Revenue breakdown by category and payment method
3. Top 5 performing products by revenue
4. Average order value and how it compares to previous periods
5. New customer signups and repeat customer rate
6. Coupon usage statistics
7. Any notable trends or concerns (e.g., declining categories, low stock)

Format the report with clear sections and include specific numbers.`,
        },
      }],
    };
  }
);

server.prompt(
  "restock-recommendation",
  "Analyze inventory levels and recommend which products need restocking, with suggested quantities.",
  {},
  async () => {
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Analyze the current inventory and provide restocking recommendations.

Steps:
1. Use get_inventory to fetch current stock levels
2. Use get_analytics with period="30d" to understand sales velocity
3. For each product with stock ≤ 20 units, calculate:
   - Current stock level
   - Average daily sales rate (units sold in period / days)
   - Days of stock remaining at current rate
   - Recommended restock quantity (enough for 60 days)
4. Flag any products that are critically low (< 5 units or < 7 days remaining)
5. Sort recommendations by urgency (days remaining ascending)

Present as a clear table with columns: Product | Current Stock | Daily Sales | Days Left | Restock Qty | Priority`,
        },
      }],
    };
  }
);

server.prompt(
  "customer-insights",
  "Deep-dive into a specific customer's history, preferences, and lifetime value.",
  {
    customerId: z.string().describe("Customer ID to analyze"),
  },
  async (args) => {
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Provide a detailed customer insight report for customer ID: ${args.customerId}

Steps:
1. Use get_customer to fetch their full profile, orders, and reviews
2. Use get_customer_ltv with their ID for lifetime value data
3. Analyze and present:
   - Customer overview (name, email, signup date, role)
   - Order history summary (total orders, total spent, average order value)
   - Product preferences (most purchased categories/products)
   - Review activity (ratings given, sentiment)
   - Lifetime value and churn risk assessment
   - Recommendations (upsell opportunities, retention actions if at risk)`,
        },
      }],
    };
  }
);

server.prompt(
  "order-fulfillment-check",
  "Review all pending/paid orders and identify which are ready to ship, flagging any issues.",
  {},
  async () => {
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Review all orders that need fulfillment attention.

Steps:
1. Use list_orders with status="paid" to get orders ready to ship
2. Use list_orders with status="pending" to get orders awaiting payment
3. Use get_inventory to check stock availability
4. For each paid order, verify:
   - All items are in stock
   - Shipping address is present
   - Flag any issues (out of stock items, missing info)
5. Present a fulfillment dashboard:
   - Orders ready to ship (all items in stock)
   - Orders with stock issues (which items, how many short)
   - Pending orders summary
   - Recommended actions`,
        },
      }],
    };
  }
);

// ═══════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════

const transport = new StdioServerTransport();
await server.connect(transport);
log("info", "CellulaLabs MCP server v4.0.0 started", { baseUrl: BASE_URL, authenticated: !!ADMIN_TOKEN });
