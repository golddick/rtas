import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { dropid } from 'dropid'
import bcrypt from 'bcryptjs'

async function verifyAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('adminToken')?.value

  if (!token) {
    return { error: 'Unauthorized', status: 401 }
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string
      email: string
      role: string
    }

    // Only SUPER_ADMIN can reset passwords
    if (decoded.role !== 'SUPER_ADMIN') {
      return { error: 'Only super admins can reset passwords', status: 403 }
    }

    return { admin: decoded }
  } catch (error) {
    return { error: 'Invalid token', status: 401 }
  }
}

function generateTempPassword(): string {
  const length = 10
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  return password
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { id } = params

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Generate temporary password
    const tempPassword = generateTempPassword()
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Update user password
    const updated = await db.user.update({
      where: { id },
      data: { password: hashedPassword }
    })

    // Log action
    await db.adminAction.create({
      data: {
        id: dropid('act'),
        adminId: auth.admin.id,
        actionType: 'UPDATE',
        description: `Reset password for user: ${user.fullName}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // In development, return the temp password
    // In production, you might want to email it instead
    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      ...(process.env.NODE_ENV === 'development' && { tempPassword })
    })

  } catch (error) {
    console.error('[RESET_PASSWORD_POST]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}