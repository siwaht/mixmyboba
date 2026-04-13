import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Manage your Mix My Boba account — view orders, referral program, and account settings.',
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children
}
