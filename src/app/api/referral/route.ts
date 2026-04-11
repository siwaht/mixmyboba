import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { safeJson, isErrorResponse } from '@/lib/safe-json'

// GET — get current user's referral code and stats
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!fullUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Generate referral code if not exists
  let referralCode = fullUser.referralCode
  if (!referralCode) {
    referralCode = `REF-${fullUser.id.slice(-6).toUpperCase()}`
    await prisma.user.update({ where: { id: user.id }, data: { referralCode } })
  }

  // Count how many people used this code
  const referralCount = await prisma.user.count({ where: { referredBy: referralCode } })

  // Count how many referral coupons were generated (codes starting with REF10-)
  const couponsGenerated = await prisma.coupon.count({
    where: { code: { startsWith: `REF10-${referralCode}` } }
  })

  return NextResponse.json({
    referralCode,
    referralLink: `/account?ref=${referralCode}`,
    referralCount,
    couponsGenerated,
    reward: '$10 off for you and your friend',
  })
}

// POST — apply a referral code (called during registration or from account page)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body
  const { code } = body as { code: string }
  if (!code) return NextResponse.json({ error: 'Referral code required' }, { status: 400 })

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!fullUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Can't use own code
  if (fullUser.referralCode === code) {
    return NextResponse.json({ error: "You can't use your own referral code" }, { status: 400 })
  }

  // Already used a referral
  if (fullUser.referredBy) {
    return NextResponse.json({ error: 'You have already used a referral code' }, { status: 400 })
  }

  // Find the referrer
  const referrer = await prisma.user.findUnique({ where: { referralCode: code } })
  if (!referrer) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
  }

  // Mark user as referred
  await prisma.user.update({ where: { id: user.id }, data: { referredBy: code } })

  // Create $10 coupon for the new user
  const newUserCouponCode = `REF10-NEW-${user.id.slice(-6).toUpperCase()}`
  await prisma.coupon.create({
    data: {
      code: newUserCouponCode,
      type: 'fixed',
      value: 10,
      minOrder: 30,
      maxUses: 1,
      active: true,
    },
  })

  // Create $10 coupon for the referrer
  const referrerCouponCode = `REF10-${code}-${Date.now().toString(36).toUpperCase()}`
  await prisma.coupon.create({
    data: {
      code: referrerCouponCode,
      type: 'fixed',
      value: 10,
      minOrder: 30,
      maxUses: 1,
      active: true,
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Referral applied! You and your friend each get $10 off.',
    couponCode: newUserCouponCode,
  })
}
