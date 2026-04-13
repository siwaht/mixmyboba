import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compare Flavors',
  description: 'Compare Mix My Boba flavors side by side — ingredients, pricing, ratings, and more. Find your perfect boba tea mix.',
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children
}
