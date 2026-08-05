import { z } from 'zod/v4'

// ─── Auth ───

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
})

// ─── Orders ───

export const orderItemSchema = z.object({
  /** Product id, or the cart's composite `productId__variantId` key. */
  productId: z.string().min(1),
  variantId: z.union([z.string(), z.null()]).optional(),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  purchaseType: z.enum(['subscribe', 'onetime']).optional(),
})

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const PAYMENT_METHODS = ['card', 'paypal', 'cod', 'crypto', 'ach'] as const

export const createOrderSchema = z.object({
  email: z.string().min(1, 'Email is required').regex(emailRegex, 'Invalid email address'),
  shippingAddress: z.string().min(10, 'Please provide a full shipping address'),
  phone: z.union([z.string(), z.null()]).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).default('card'),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  notes: z.union([z.string(), z.null()]).optional(),
  couponCode: z.union([z.string(), z.null()]).optional(),
})

// ─── Checkout quote ───

export const quoteRequestSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  couponCode: z.union([z.string(), z.null()]).optional(),
  email: z.union([z.string(), z.null()]).optional(),
})

// ─── Admin: manually created orders (phone, wholesale, replacements) ───

export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const

const coerceNumber = z.union([z.number(), z.string()]).transform((v, ctx) => {
  const n = typeof v === 'number' ? v : parseFloat(v)
  if (!Number.isFinite(n)) {
    ctx.addIssue({ code: 'custom', message: 'Expected a number' })
    return z.NEVER
  }
  return n
})

export const adminCreateOrderSchema = z.object({
  email: z.string().min(1, 'Email is required').regex(emailRegex, 'Invalid email address'),
  shippingAddress: z.string().min(5, 'Shipping address is required'),
  phone: z.union([z.string(), z.null()]).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).default('card'),
  status: z.enum(ORDER_STATUSES).default('pending'),
  notes: z.union([z.string(), z.null()]).optional(),
  discount: coerceNumber.pipe(z.number().min(0, 'Discount cannot be negative')).default(0),
  shipping: coerceNumber.pipe(z.number().min(0, 'Shipping cannot be negative')).default(0),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.union([z.string(), z.null()]).optional(),
        quantity: coerceNumber.pipe(
          z.number().int('Quantity must be a whole number').positive('Quantity must be at least 1')
        ),
        /** Optional manual override, e.g. an agreed wholesale price. */
        price: coerceNumber.pipe(z.number().min(0)).optional(),
      })
    )
    .min(1, 'At least one item is required'),
})

// ─── Reviews ───

export const createReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1, 'Title is required').max(200),
  body: z.string().min(1, 'Review body is required').max(2000),
  displayName: z.string().max(100).optional(),
})

// ─── Admin: Products ───

export const createProductSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1, 'Name is required').max(300),
  price: z.number().positive('Price must be positive'),
  description: z.string().min(1, 'Description is required').max(5000),
  imageUrl: z.string().min(1, 'Image URL is required'),
  category: z.string().min(1, 'Category is required').max(100),
  servings: z.string().min(1, 'Servings per bag is required').max(50),
  stock: z.number().int().min(0).default(100),
  active: z.boolean().default(true),
  storageTemp: z.string().max(50).default('Cool & Dry'),
  form: z.string().max(100).default('Instant Powder Mix'),
  tag: z.string().max(50).nullable().optional(),
  batchNumber: z.string().max(100).optional(),
  lotNumber: z.string().max(100).optional(),
})

// For updates, strip defaults so missing fields don't overwrite existing values
const _updateProductBase = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1, 'Name is required').max(300),
  price: z.number().positive('Price must be positive'),
  description: z.string().min(1, 'Description is required').max(5000),
  imageUrl: z.string().min(1, 'Image URL is required'),
  category: z.string().min(1, 'Category is required').max(100),
  servings: z.string().min(1, 'Servings per bag is required').max(50),
  stock: z.number().int().min(0),
  active: z.boolean(),
  storageTemp: z.string().max(50),
  form: z.string().max(100),
  tag: z.string().max(50).nullable().optional(),
  batchNumber: z.string().max(100).optional(),
  lotNumber: z.string().max(100).optional(),
})

export const updateProductSchema = _updateProductBase.partial()

// ─── Admin: Coupons ───

export const createCouponSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  type: z.enum(['percent', 'fixed']).default('percent'),
  value: z.number().positive('Value must be positive'),
  minOrder: z.number().min(0).default(0),
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerCustomer: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().optional(), // ISO date string
})

// ─── Admin: Bulk stock ───

export const bulkStockUpdateSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().min(1),
      stock: z.number().int().min(0, 'Stock cannot be negative'),
    })
  ).min(1, 'At least one update is required'),
})

// ─── Admin: Review moderation ───

export const updateReviewSchema = z.object({
  reviewId: z.string().min(1, 'reviewId is required'),
  verified: z.boolean().optional(),
})

export const deleteReviewSchema = z.object({
  reviewId: z.string().min(1, 'reviewId is required'),
})
