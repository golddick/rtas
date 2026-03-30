import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    // Find the user by email
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Update user's email verification status
    const updatedUser = await db.user.update({
      where: { email },
      data: {
        emailVerified: true,
        status: 'ACTIVE' 
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        emailVerified: true,
        status: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      data: updatedUser
    })

  } catch (error) {
    console.error('[VERIFY_EMAIL_POST]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}