'use client'

import { useSyncExternalStore } from 'react'
import { create } from 'zustand'

interface ToastState {
  message: string
  visible: boolean
  show: (message: string) => void
}

let hideTimer: ReturnType<typeof setTimeout> | null = null

export const useToast = create<ToastState>((set) => ({
  message: '',
  visible: false,
  show: (message: string) => {
    if (hideTimer) clearTimeout(hideTimer)
    set({ message, visible: true })
    hideTimer = setTimeout(() => {
      set({ visible: false })
      hideTimer = null
    }, 2200)
  },
}))

function useClientMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

export default function Toast() {
  const { message, visible } = useToast()
  const mounted = useClientMounted()
  if (!mounted) return null

  return (
    <div className={`toast ${visible ? 'toast-visible' : ''}`} role="status" aria-live="polite">
      <span className="toast-check">✓</span> {message}
    </div>
  )
}
