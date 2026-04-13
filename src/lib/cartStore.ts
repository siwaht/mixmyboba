'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  slug: string
  name: string
  price: number
  imageUrl: string
  quantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
  itemCount: number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,

      addItem: (item) => {
        const existing = get().items.find(i => i.productId === item.productId)
        let newItems: CartItem[]
        if (existing) {
          newItems = get().items.map(i =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        } else {
          newItems = [...get().items, { ...item, quantity: 1 }]
        }
        set({ items: newItems, itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0) })
      },

      removeItem: (productId) => {
        const newItems = get().items.filter(i => i.productId !== productId)
        set({ items: newItems, itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0) })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        const newItems = get().items.map(i =>
          i.productId === productId ? { ...i, quantity } : i
        )
        set({ items: newItems, itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0) })
      },

      clearCart: () => set({ items: [], itemCount: 0 }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'mixmyboba-cart' }
  )
)
