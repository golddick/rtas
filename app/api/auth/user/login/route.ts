// app/api/auth/user/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Validation error', 
          errors: parsed.error.errors 
        },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    // Find user with all relations
    const user = await db.user.findUnique({
      where: { email },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
            code: true,
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        supervisorDepartment: { 
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'Account is not active. Please contact administrator.' },
        { status: 403 }
      )
    }

    // Determine the correct department based on role
    let departmentCode = null
    let departmentName = null
    let departmentId = null
    
    if (user.role === 'SUPERVISOR') {
      departmentCode = user.supervisorDepartment?.code
      departmentName = user.supervisorDepartment?.name
      departmentId = user.supervisorDepartment?.id
    } else if (user.role === 'STUDENT' || user.role === 'HOD') {
      departmentCode = user.department?.code
      departmentName = user.department?.name
      departmentId = user.department?.id
    }

    // Generate JWT token with all necessary data
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        institutionSlug: user.institution?.slug,
        institutionCode: user.institution?.code,
        departmentCode: departmentCode,
        departmentName: departmentName,
        departmentId: departmentId,
        // Add any other fields you might need
        status: user.status,
        emailVerified: user.emailVerified
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    })

  } catch (error) {
    console.error('[LOGIN_ERROR]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}


