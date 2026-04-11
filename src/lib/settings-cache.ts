import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Simple in-memory cache for JSON settings files.
 * Avoids blocking readFileSync on every request and re-reads
 * from disk at most once per TTL window.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const DEFAULT_TTL_MS = 30_000 // 30 seconds

export async function getCachedJson<T>(
  relativePath: string,
  fallback: T,
  ttlMs = DEFAULT_TTL_MS
): Promise<T> {
  const fullPath = join(process.cwd(), relativePath)
  const now = Date.now()

  const cached = cache.get(fullPath) as CacheEntry<T> | undefined
  if (cached && now < cached.expiresAt) {
    return cached.data
  }

  try {
    const raw = await readFile(fullPath, 'utf-8')
    const data = JSON.parse(raw) as T
    cache.set(fullPath, { data, expiresAt: now + ttlMs })
    return data
  } catch {
    // File doesn't exist or is malformed — return fallback
    return fallback
  }
}
