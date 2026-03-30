import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dropid } from 'dropid'
import { z } from 'zod'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['STUDENT', 'SUPERVISOR', 'HOD']),
  phone: z.string().optional(),
  institutionId: z.string().min(1, 'Institution is required'),
  // Student specific
  departmentId: z.string().optional(),
  matricNumber: z.string().optional(),
  program: z.enum(['BSC', 'MSC', 'PHD']).optional(),
  // Staff specific
  supervisorDepartmentId: z.string().optional(),
  staffNumber: z.string().optional(),
})

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
      fullName: string
    }

    if (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'ADMIN') {
      return { error: 'Insufficient permissions', status: 403 }
    }

    return { admin: decoded }
  } catch (error) {
    return { error: 'Invalid token', status: 401 }
  }
}

// GET /api/admin/users - Get all users with filters
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const institutionId = searchParams.get('institutionId')
    const departmentId = searchParams.get('departmentId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (role && role !== 'all') {
      where.role = role
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (institutionId) {
      where.institutionId = institutionId
    }

    if (departmentId) {
      where.departmentId = departmentId
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { matricNumber: { contains: search, mode: 'insensitive' } },
        { staffNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count for pagination
    const total = await db.user.count({ where })

    // Get users
    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
            slug: true,
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
        },
        supervisor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        },
        _count: {
          select: {
            supervisedStudents: true,
            studentProposals: true,
          }
        }
      }
    })

    // Format users with counts
    const formatted = users.map(user => ({
      ...user,
      supervisedCount: user._count?.supervisedStudents || 0,
      proposalsCount: user._count?.studentProposals || 0,
      _count: undefined
    }))

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('[ADMIN_USERS_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { 
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

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Check matric number uniqueness
    if (matricNumber) {
      const existingMatric = await db.user.findUnique({
        where: { matricNumber }
      })
      if (existingMatric) {
        return NextResponse.json(
          { message: 'Matric number already exists' },
          { status: 409 }
        )
      }
    }

    // Check staff number uniqueness
    if (staffNumber) {
      const existingStaff = await db.user.findUnique({
        where: { staffNumber }
      })
      if (existingStaff) {
        return NextResponse.json(
          { message: 'Staff number already exists' },
          { status: 409 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Prepare user data
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
      emailVerified: true, // Admin-created users are auto-verified
    }

    // Add role-specific fields
    if (role === 'STUDENT') {
      userData.departmentId = departmentId
      userData.matricNumber = matricNumber
      userData.program = program
    } else if (role === 'SUPERVISOR') {
      userData.supervisorDepartmentId = supervisorDepartmentId
      userData.staffNumber = staffNumber
    } else if (role === 'HOD') {
      userData.departmentId = departmentId
      userData.staffNumber = staffNumber
    }

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
        department: true,
        supervisorDepartment: true,
      }
    })

    // Log action
    await db.adminAction.create({
      data: {
        id: dropid('act'),
        adminId: auth.admin.id,
        actionType: 'CREATE',
        description: `Created user: ${fullName} (${role})`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: userWithoutPassword
    }, { status: 201 })

  } catch (error) {
    console.error('[ADMIN_USERS_POST]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}