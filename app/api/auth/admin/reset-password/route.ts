// app/api/auth/admin/reset-password/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, newPassword } = body

    // Validate required fields
    if (!email || !newPassword) {
      return NextResponse.json(
        { message: 'Email and new password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { message: 'Password must contain at least one uppercase letter and one number' },
        { status: 400 }
      )
    }

    // Find admin by email
    const admin = await db.admin.findUnique({
      where: { email }
    })

    if (!admin) {
      return NextResponse.json(
        { message: 'Admin not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update admin password
    await db.admin.update({
      where: { id: admin.id },
      data: {
        passwordHash: hashedPassword,
      }
    })

    // Log the action
    await db.adminAction.create({
      data: {
        adminId: admin.id,
        actionType: 'UPDATE',
        description: 'Password reset',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      message: 'Password reset successful'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}