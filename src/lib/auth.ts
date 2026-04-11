import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './db'
import { getJwtSecret } from './jwt-secret'

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: { userId: string; role: string }) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' })
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, getJwtSecret()) as { userId: string; role: string }
  } catch {
    return null
  }
}

export async function getCurrentUser(request?: { headers: { get(name: string): string | null } }) {
  let token: string | undefined

  // 1. Try Bearer token from Authorization header (for API consumers)
  if (request) {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    }
  }

  // 2. Fall back to cookie
  if (!token) {
    const cookieStore = await cookies()
    token = cookieStore.get('auth-token')?.value
  }

  if (!token) return null

  const decoded = verifyToken(token)
  if (!decoded) return null

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, name: true, role: true },
  })
  return user
}
