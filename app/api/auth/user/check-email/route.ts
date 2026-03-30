import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true }
    })

    return NextResponse.json({
      success: true,
      exists: !!user,
      user: user || null
    })

  } catch (error) {
    console.error('[CHECK_EMAIL_ERROR]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}