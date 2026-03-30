import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dropid } from 'dropid'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { sendOTP } from '@/lib/otp/client'

// Validation schema based on user role
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['STUDENT', 'SUPERVISOR']),
  phone: z.string().optional(),
  institutionId: z.string().min(1, 'Institution is required'),
  // Student specific
  departmentId: z.string().optional(),
  matricNumber: z.string().optional(),
  program: z.enum(['BSC', 'MSC', 'PHD']).optional(),
  // Supervisor specific
  supervisorDepartmentId: z.string().optional(),
  staffNumber: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received signup data:', body)

    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      console.error('Validation errors:', parsed.error.errors)
      return NextResponse.json(
        { 
          success: false,
          message: 'Validation error', 
          errors: parsed.error.errors 
        },
        { status: 400 }
      )
    }

    const { 
      email, 
      fullName, 
      password, 
      role,
      phone,
      institutionId,
      departmentId,
      matricNumber,
      program,
      supervisorDepartmentId,
      staffNumber,
    } = parsed.data

    // Check if user with this email exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Validate role-specific required fields
    if (role === 'STUDENT') {
      if (!departmentId) {
        return NextResponse.json(
          { success: false, message: 'Department is required for students' },
          { status: 400 }
        )
      }
      if (!matricNumber) {
        return NextResponse.json(
          { success: false, message: 'Matric number is required for students' },
          { status: 400 }
        )
      }
      if (!program) {
        return NextResponse.json(
          { success: false, message: 'Program is required for students' },
          { status: 400 }
        )
      }
    }

    if (role === 'SUPERVISOR') {
      if (!supervisorDepartmentId) {
        return NextResponse.json(
          { success: false, message: 'Department is required for supervisors' },
          { status: 400 }
        )
      }
      if (!staffNumber) {
        return NextResponse.json(
          { success: false, message: 'Staff number is required for supervisors' },
          { status: 400 }
        )
      }
    }

    // Check matric number uniqueness if provided
    if (matricNumber) {
      const existingMatric = await db.user.findUnique({
        where: { matricNumber }
      })
      if (existingMatric) {
        return NextResponse.json(
          { success: false, message: 'Matric number already exists' },
          { status: 409 }
        )
      }
    }

    // Check staff number uniqueness if provided
    if (staffNumber) {
      const existingStaff = await db.user.findUnique({
        where: { staffNumber }
      })
      if (existingStaff) {
        return NextResponse.json(
          { success: false, message: 'Staff number already exists' },
          { status: 409 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Prepare user data based on role
    const userData: any = {
      id: dropid('user'),
      email,
      registrationEmail: email,
      fullName,
      password: hashedPassword,
      role,
      phone: phone || null,
      institutionId,
      status: 'ACTIVE',
      emailVerified: false,
    }

    // Add role-specific fields
    if (role === 'STUDENT') {
      userData.departmentId = departmentId
      userData.matricNumber = matricNumber
      userData.program = program
    } else if (role === 'SUPERVISOR') {
      userData.supervisorDepartmentId = supervisorDepartmentId
      userData.staffNumber = staffNumber
    }

    console.log('Creating user with data:', userData)

    // Create user
    const user = await db.user.create({
      data: userData,
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        department: role === 'STUDENT' ? {
          select: {
            id: true,
            name: true,
            code: true,
          }
        } : false,
        supervisorDepartment: role === 'SUPERVISOR' ? {
          select: {
            id: true,
            name: true,
            code: true,
          }
        } : false,
      }
    })

    // Send OTP for email verification
    try {
      await sendOTP({
        email: user.email,
        length: 6,
        expiry: 10,
        brandName: 'RTAS',
        metadata: {
          purpose: 'email_verification',
          userId: user.id,
          role: user.role,
        }
      })
    } catch (otpError) {
      console.error('Failed to send OTP:', otpError)
      // Don't fail the signup if OTP fails
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please verify your email.',
      data: userWithoutPassword
    }, { status: 201 })

  } catch (error) {
    console.error('[SIGNUP_ERROR]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}