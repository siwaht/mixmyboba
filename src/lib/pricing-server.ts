import { prisma } from './db'
import { getCachedJson } from './settings-cache'
import {
  DEFAULT_PRICING_CONFIG,
  buildCartItemId,
  calcTotals,
  evaluateCoupon,
  money,
  parseCartItemId,
  toPurchaseType,
  unitPrice,
  type CouponEvaluation,
  type OrderTotals,
  type PricingConfig,
  type PurchaseType,
} from './pricing'

/**
 * Server-side pricing: turns a raw cart into the authoritative amount owed.
 *
 * `buildQuote` is the only place a cart gets priced. The checkout page renders
 * what it returns and the order endpoint persists what it returns, so the
 * displayed total and the charged total are the same number by construction.
 */

// ─── Configuration ───

interface PaymentSettingsShape {
  general?: {
    currency?: string
    taxRate?: number
    freeShippingThreshold?: number
    shippingRate?: number
  }
}

/** Reads store pricing rules from the admin-managed payment settings file. */
export async function getPricingConfig(): Promise<PricingConfig> {
  const settings = await getCachedJson<PaymentSettingsShape>('payment-settings.json', {})
  const general = settings.general ?? {}

  const num = (value: unknown, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback

  return {
    freeShippingThreshold: num(
      general.freeShippingThreshold,
      DEFAULT_PRICING_CONFIG.freeShippingThreshold
    ),
    shippingRate: num(general.shippingRate, DEFAULT_PRICING_CONFIG.shippingRate),
    taxRate: num(general.taxRate, DEFAULT_PRICING_CONFIG.taxRate),
    currency: general.currency || DEFAULT_PRICING_CONFIG.currency,
  }
}

// ─── Types ───

export interface QuoteItemInput {
  /** Product id, or the cart's composite `productId__variantId` key. */
  productId: string
  variantId?: string | null
  quantity: number
  purchaseType?: string | null
}

export interface QuoteLine {
  cartItemId: string
  productId: string
  variantId: string | null
  slug: string
  name: string
  variantLabel: string | null
  imageUrl: string
  quantity: number
  /** Catalogue price for the selected variant, before promotion. */
  basePrice: number
  /** Price actually charged per unit. */
  unitPrice: number
  lineTotal: number
  purchaseType: PurchaseType
  availableStock: number
}

export interface StockIssue {
  cartItemId: string
  name: string
  requested: number
  available: number
}

export interface Quote {
  lines: QuoteLine[]
  totals: OrderTotals
  coupon: { code: string; type: string; value: number; discount: number } | null
  /** Set when a submitted coupon code could not be applied. */
  couponError: string | null
  stockIssues: StockIssue[]
  currency: string
  /** Product-level quantities, for the stock decrement in the order transaction. */
  productQuantities: Array<{ productId: string; quantity: number }>
  /** Variant-level quantities, for the stock decrement in the order transaction. */
  variantQuantities: Array<{ variantId: string; quantity: number }>
}

export type QuoteResult =
  | { ok: true; quote: Quote }
  | { ok: false; error: string; status: number }

export interface BuildQuoteInput {
  items: QuoteItemInput[]
  couponCode?: string | null
  email?: string | null
  /**
   * When true (order submission) an unusable coupon fails the whole request
   * rather than quietly repricing the cart at full price.
   */
  strictCoupon?: boolean
}

// ─── Quote builder ───

export async function buildQuote({
  items,
  couponCode,
  email,
  strictCoupon = false,
}: BuildQuoteInput): Promise<QuoteResult> {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: 'At least one item is required', status: 400 }
  }

  // Normalise incoming rows: accept both an explicit variantId and the cart's
  // composite key, so older persisted carts keep working.
  const normalised = items.map(item => {
    const parsed = parseCartItemId(item.productId)
    return {
      productId: parsed.productId,
      variantId: item.variantId ?? parsed.variantId,
      quantity: Math.trunc(item.quantity),
      purchaseType: toPurchaseType(item.purchaseType),
    }
  })

  for (const row of normalised) {
    if (!row.productId) {
      return { ok: false, error: 'Invalid product in cart', status: 400 }
    }
    if (!Number.isFinite(row.quantity) || row.quantity <= 0) {
      return { ok: false, error: 'Quantity must be a positive whole number', status: 400 }
    }
  }

  const productIds = [...new Set(normalised.map(r => r.productId))]
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
    include: { variants: true },
  })

  if (products.length !== productIds.length) {
    return { ok: false, error: 'One or more products are no longer available', status: 400 }
  }

  const productMap = new Map(products.map(p => [p.id, p]))

  // ── Price each line from database values ──
  const lines: QuoteLine[] = []
  for (const row of normalised) {
    const product = productMap.get(row.productId)!
    const variant = row.variantId
      ? product.variants.find(v => v.id === row.variantId) ?? null
      : null

    if (row.variantId && !variant) {
      return {
        ok: false,
        error: `The selected size for ${product.name} is no longer available`,
        status: 400,
      }
    }
    if (variant && !variant.active) {
      return {
        ok: false,
        error: `${product.name} (${variant.label}) is no longer available`,
        status: 400,
      }
    }

    const basePrice = variant ? variant.price : product.price
    const perUnit = unitPrice(basePrice, row.purchaseType)

    lines.push({
      cartItemId: buildCartItemId(product.id, variant?.id),
      productId: product.id,
      variantId: variant?.id ?? null,
      slug: product.slug,
      name: variant ? `${product.name} (${variant.label})` : product.name,
      variantLabel: variant?.label ?? null,
      imageUrl: product.imageUrl,
      quantity: row.quantity,
      basePrice: money(basePrice),
      unitPrice: perUnit,
      lineTotal: money(perUnit * row.quantity),
      purchaseType: row.purchaseType,
      availableStock: variant ? variant.stock : product.stock,
    })
  }

  // ── Aggregate quantities so duplicate cart rows are counted once ──
  const productQty = new Map<string, number>()
  const variantQty = new Map<string, number>()
  for (const line of lines) {
    productQty.set(line.productId, (productQty.get(line.productId) ?? 0) + line.quantity)
    if (line.variantId) {
      variantQty.set(line.variantId, (variantQty.get(line.variantId) ?? 0) + line.quantity)
    }
  }

  const stockIssues: StockIssue[] = []
  for (const [productId, quantity] of productQty) {
    const product = productMap.get(productId)!
    if (product.stock < quantity) {
      stockIssues.push({
        cartItemId: productId,
        name: product.name,
        requested: quantity,
        available: product.stock,
      })
    }
  }
  for (const [variantId, quantity] of variantQty) {
    const line = lines.find(l => l.variantId === variantId)!
    const product = productMap.get(line.productId)!
    const variant = product.variants.find(v => v.id === variantId)!
    if (variant.stock < quantity) {
      stockIssues.push({
        cartItemId: line.cartItemId,
        name: line.name,
        requested: quantity,
        available: variant.stock,
      })
    }
  }

  // ── Coupon ──
  const config = await getPricingConfig()
  const provisional = calcTotals(lines, { config })

  let coupon: Quote['coupon'] = null
  let couponError: string | null = null

  const trimmedCode = couponCode?.toUpperCase().trim()
  if (trimmedCode) {
    const record = await prisma.coupon.findUnique({ where: { code: trimmedCode } })
    const normalisedEmail = email?.toLowerCase().trim() || ''

    let priorCustomerUses = 0
    if (record?.maxUsesPerCustomer != null && normalisedEmail) {
      priorCustomerUses = await prisma.order.count({
        where: {
          email: normalisedEmail,
          couponCode: record.code,
          status: { not: 'cancelled' },
        },
      })
    }

    const evaluation: CouponEvaluation = evaluateCoupon(record, {
      subtotal: provisional.subtotal,
      priorCustomerUses,
      hasEmail: Boolean(normalisedEmail),
    })

    if (evaluation.ok) {
      coupon = {
        code: evaluation.code,
        type: evaluation.type,
        value: evaluation.value,
        discount: evaluation.discount,
      }
    } else if (strictCoupon) {
      return { ok: false, error: evaluation.error, status: evaluation.status }
    } else {
      couponError = evaluation.error
    }
  }

  const totals = calcTotals(lines, { config, couponDiscount: coupon?.discount ?? 0 })

  return {
    ok: true,
    quote: {
      lines,
      totals,
      coupon,
      couponError,
      stockIssues,
      currency: config.currency,
      productQuantities: [...productQty].map(([productId, quantity]) => ({ productId, quantity })),
      variantQuantities: [...variantQty].map(([variantId, quantity]) => ({ variantId, quantity })),
    },
  }
}
