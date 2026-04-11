'use client'

import { useState, useEffect } from 'react'

interface ProductTag {
  slug: string
  label: string
  emoji: string
  color: string
}

let cachedTags: ProductTag[] | null = null
let fetchPromise: Promise<ProductTag[]> | null = null

function fetchTags(): Promise<ProductTag[]> {
  if (cachedTags) return Promise.resolve(cachedTags)
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/tags')
    .then(r => r.json())
    .then((tags: ProductTag[]) => {
      cachedTags = tags
      fetchPromise = null
      return tags
    })
    .catch(() => {
      fetchPromise = null
      return []
    })
  return fetchPromise
}

export function useProductTags() {
  const [tags, setTags] = useState<ProductTag[]>(cachedTags || [])

  useEffect(() => {
    fetchTags().then(setTags)
  }, [])

  const getTag = (slug: string): ProductTag | undefined => {
    return tags.find(t => t.slug === slug)
  }

  return { tags, getTag }
}
