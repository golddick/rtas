import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    // Check for token in cookies first - AWAIT cookies()
    const cookieStore = await cookies()
    const tokenFromCookie = cookieStore.get('adminToken')?.value
    
    // Also check Authorization header
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null

    const token = tokenFromCookie || tokenFromHeader

    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }
 
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string
      email: string
      fullName: string
      role: string
    }

    // Get fresh admin data
    const admin = await db.admin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        lastLogin: true,
        createdAt: true,
        department: true,
        phoneNumber: true,
      }
    })

    if (!admin) {
      return NextResponse.json(
        { message: 'Admin not found' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      admin,
      token // Return token for client storage
    })

  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { message: 'Invalid token' },
      { status: 401 }
    )
  }
}