import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'
import { dropid } from 'dropid'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find admin by email
    const admin = await db.admin.findUnique({
      where: { email }
    })

    if (!admin) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if admin is active
    if (!admin.isActive) {
      return NextResponse.json(
        { message: 'Account is deactivated. Please contact super admin.' },
        { status: 403 }
      )
    }

    // Check if email is verified
    if (!admin.isEmailVerified) {
      return NextResponse.json(
        { message: 'Please verify your email before logging in' },
        { status: 403 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash)

    if (!isValidPassword) {
      // Log failed attempt
      await db.adminAction.create({
        data: {
          id: dropid('act'),
          adminId: admin.id,
          actionType: 'LOGIN',
          description: 'Failed login attempt - invalid password',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }
      })

      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Update last login
    const updatedAdmin = await db.admin.update({
      where: { id: admin.id },
      data: { 
        lastLogin: new Date()
      }
    })

    // Log successful login
    await db.adminAction.create({
      data: {
        id: dropid('act'),
        adminId: admin.id,
        actionType: 'LOGIN',
        description: 'Successful login',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id,
        fullName:admin.fullName,
        email: admin.email,
        role: admin.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Set cookie - AWAIT cookies()
    const cookieStore = await cookies()
    cookieStore.set({
      name: 'adminToken',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Remove sensitive data
    const { passwordHash, ...adminWithoutPassword } = updatedAdmin

    return NextResponse.json({
      message: 'Login successful',
      admin: adminWithoutPassword,
      token
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}