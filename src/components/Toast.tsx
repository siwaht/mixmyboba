'use client'

import { useEffect, useState } from 'react'
import { create } from 'zustand'

interface ToastState {
  message: string
  visible: boolean
  show: (message: string) => void
}

export const useToast = create<ToastState>((set) => ({
  message: '',
  visible: false,
  show: (message: string) => {
    set({ message, visible: true })
    setTimeout(() => set({ visible: false }), 2200)
  },
}))

export default function Toast() {
  const { message, visible } = useToast()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className={`toast ${visible ? 'toast-visible' : ''}`} role="status" aria-live="polite">
      <span className="toast-check">✓</span> {message}
    </div>
  )
}
