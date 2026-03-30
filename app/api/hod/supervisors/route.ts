import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dropid } from 'dropid'
import { z } from 'zod'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const createSupervisorSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  staffNumber: z.string().min(1, 'Staff number is required'),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  departmentId: z.string().min(1, 'Department is required'),
  institutionId: z.string().min(1, 'Institution is required'),
})

async function verifyHOD() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    return { error: 'Unauthorized', status: 401 }
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string
      email: string
      role: string
    }

    if (decoded.role !== 'HOD') {
      return { error: 'Only HOD can access this resource', status: 403 }
    }

    // Get HOD details to verify department
    const hod = await db.user.findUnique({
      where: { id: decoded.id },
      include: {
        department: true
      }
    })

    if (!hod || !hod.department) {
      return { error: 'HOD not found or no department assigned', status: 404 }
    }

    return { hod, department: hod.department }
  } catch (error) {
    return { error: 'Invalid token', status: 401 }
  }
}

// GET /api/hod/supervisors - Get all supervisors in HOD's department
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyHOD()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause - only supervisors in this department
    const where: any = {
      role: 'SUPERVISOR',
      supervisorDepartmentId: auth.department.id
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { staffNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await db.user.count({ where })

    // Get supervisors with their students
    const supervisors = await db.user.findMany({
      where,
      orderBy: { fullName: 'asc' },
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
        supervisorDepartment: {
          select: {
            id: true,
            name: true,
            code: true,
            faculty: true,
          }
        },
        supervisedStudents: {
          select: {
            id: true,
            fullName: true,
            email: true,
            matricNumber: true,
            program: true,
          }
        },
        supervisorProposals: {
          where: { status: 'APPROVED' },
          select: { id: true }
        }
      }
    })

    // Format response
    const formatted = supervisors.map(sup => ({
      id: sup.id,
      fullName: sup.fullName,
      email: sup.email,
      phone: sup.phone,
      staffNumber: sup.staffNumber,
      avatar: sup.avatar,
      status: sup.status,
      departmentId: sup.supervisorDepartmentId,
      department: sup.supervisorDepartment,
      institutionId: sup.institutionId,
      institution: sup.institution,
      students: sup.supervisedStudents,
      studentCount: sup.supervisedStudents.length,
      approvedTopics: sup.supervisorProposals.length,
      createdAt: sup.createdAt,
      updatedAt: sup.updatedAt,
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
    console.error('[HOD_SUPERVISORS_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/hod/supervisors - Create new supervisor
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyHOD()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const parsed = createSupervisorSchema.safeParse(body)

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
      fullName, 
      email, 
      staffNumber,
      phone,
      specialization,
      departmentId,
      institutionId,
    } = parsed.data

    // Verify department matches HOD's department
    if (departmentId !== auth.department.id) {
      return NextResponse.json(
        { message: 'You can only add supervisors to your own department' },
        { status: 403 }
      )
    }

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

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Create supervisor user
    const supervisor = await db.user.create({
      data: {
        id: dropid('user'),
        email,
        registrationEmail: email,
        fullName,
        password: hashedPassword,
        role: 'SUPERVISOR',
        phone: phone || null,
        staffNumber,
        institutionId,
        supervisorDepartmentId: departmentId,
        status: 'ACTIVE',
        emailVerified: true, // Auto-verified since created by HOD
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
            slug: true,
          }
        },
        supervisorDepartment: {
          select: {
            id: true,
            name: true,
            code: true,
            faculty: true,
          }
        },
      }
    })

    // Log action
    await db.adminAction.create({
      data: {
        id: dropid('act'),
        adminId: auth.hod.id,
        actionType: 'CREATE',
        description: `Created supervisor: ${fullName} in ${auth.department.name}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    const responseData = {
      ...supervisor,
      students: [],
      studentCount: 0,
      approvedTopics: 0,
    }

    return NextResponse.json({
      success: true,
      message: 'Supervisor created successfully',
      data: responseData,
      ...(process.env.NODE_ENV === 'development' && { tempPassword })
    }, { status: 201 })

  } catch (error) {
    console.error('[HOD_SUPERVISORS_POST]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}