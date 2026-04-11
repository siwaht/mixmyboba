/**
 * Shared JWT secret accessor — used by both Edge middleware and Node.js auth.
 * Keeps the fallback logic in one place.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production')
    }
    return 'cellulalabs-dev-secret-DO-NOT-USE-IN-PROD'
  }
  return secret
}
