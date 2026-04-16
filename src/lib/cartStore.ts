'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PurchaseType = 'subscribe' | 'onetime'

export interface CartItem {
  productId: string
  slug: string
  name: string
  price: number
  originalPrice: number
  imageUrl: string
  quantity: number
  purchaseType: PurchaseType
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updatePurchaseType: (productId: string, purchaseType: PurchaseType, originalPrice: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
  itemCount: number
  lastUpdated: number
}

const CART_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,
      lastUpdated: Date.now(),

      addItem: (item) => {
        const existing = get().items.find(i => i.productId === item.productId)
        let newItems: CartItem[]
        if (existing) {
          newItems = get().items.map(i =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + 1, purchaseType: item.purchaseType, price: item.price, originalPrice: item.originalPrice }
              : i
          )
        } else {
          newItems = [...get().items, { ...item, quantity: 1 }]
        }
        set({ items: newItems, itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0), lastUpdated: Date.now() })
      },

      removeItem: (productId) => {
        const newItems = get().items.filter(i => i.productId !== productId)
        set({ items: newItems, itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0), lastUpdated: Date.now() })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        const newItems = get().items.map(i =>
          i.productId === productId ? { ...i, quantity } : i
        )
        set({ items: newItems, itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0), lastUpdated: Date.now() })
      },

      updatePurchaseType: (productId, purchaseType, originalPrice) => {
        const discount = purchaseType === 'subscribe' ? 0.40 : 0.20
        const newPrice = +(originalPrice * (1 - discount)).toFixed(2)
        const newItems = get().items.map(i =>
          i.productId === productId ? { ...i, purchaseType, price: newPrice, originalPrice } : i
        )
        set({ items: newItems, lastUpdated: Date.now() })
      },

      clearCart: () => set({ items: [], itemCount: 0, lastUpdated: Date.now() }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { 
      name: 'mixmyboba-cart',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Clear cart if it's older than 7 days
          if (state.lastUpdated && Date.now() - state.lastUpdated > CART_EXPIRY_MS) {
            state.items = []
            state.itemCount = 0
            state.lastUpdated = Date.now()
            return
          }
          // Recalculate itemCount from persisted items after hydration
          if (state.items) {
            state.itemCount = state.items.reduce((sum: number, i: CartItem) => sum + i.quantity, 0)
          }
        }
      },
    }
  )
)
