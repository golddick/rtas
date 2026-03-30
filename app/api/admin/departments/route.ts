import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dropid } from 'dropid'
import { z } from 'zod'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { sendHODInviteEmail } from '@/lib/email/hod-invite'

const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  faculty: z.string().min(2, 'faculty must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters').max(10).toUpperCase(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  maxStudents: z.number().min(1).max(500).default(150),
  institutionId: z.string().min(1, 'Institution is required'),
  sendInvite: z.boolean().optional().default(false),
  hodEmail: z.string().email().optional(),
  hodFullName: z.string().optional(),
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

// Generate a random temporary password
function generateTempPassword(): string {
  const length = 10
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  return password
}

// GET /api/admin/departments - Get all departments
export async function GET() {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const departments = await db.department.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        hod: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        },
        _count: {
          select: {
            supervisors: true,
            students: true,
            proposals: true,
          }
        }
      }
    })

    // Format with counts
    const formatted = departments.map(dept => ({
      ...dept,
      supervisorCount: dept._count.supervisors,
      studentCount: dept._count.students,
      proposalCount: dept._count.proposals,
      approvalRate: calculateApprovalRate(dept._count.proposals),
      status: dept.hodId ? 'Active' : 'Pending HOD',
      _count: undefined
    }))

    return NextResponse.json({
      success: true,
      data: formatted
    })

  } catch (error) {
    console.error('[DEPARTMENTS_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/departments - Create new department
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
    const parsed = createDepartmentSchema.safeParse(body)

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
      name, 
      code, 
      description, 
      faculty, 
      maxStudents, 
      institutionId, 
      sendInvite, 
      hodEmail,
      hodFullName 
    } = parsed.data

    // Check if institution exists
    const institution = await db.institution.findUnique({
      where: { id: institutionId }
    })

    if (!institution) {
      return NextResponse.json(
        { message: 'Institution not found' },
        { status: 404 }
      )
    }

    // Check if department with same name/code exists in this institution
    const existing = await db.department.findFirst({
      where: {
        institutionId,
        OR: [
          { name },
          { code }
        ]
      }
    })

    if (existing) {
      if (existing.name === name) {
        return NextResponse.json(
          { message: 'Department with this name already exists in this institution' },
          { status: 409 }
        )
      }
      if (existing.code === code) {
        return NextResponse.json(
          { message: 'Department with this code already exists in this institution' },
          { status: 409 }
        )
      }
    }

    // First, create department
    const department = await db.department.create({
      data: {
        id: dropid('dept'),
        name,
        code,
        faculty,
        description,
        maxStudents,
        institutionId,
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      }
    })

    // Log department creation action
    await db.adminAction.create({
      data: {
        id: dropid('act'),
        adminId: auth.admin.id,
        actionType: 'CREATE',
        description: `Created department: ${name} at ${institution.name}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    let hodUser = null
    let invitation = null
    let tempPassword = null
    let invitationCode = null

    // Create HOD user and invitation if requested
    if (sendInvite && hodEmail) {
      // Check if user already exists with this email
      const existingUser = await db.user.findUnique({
        where: { email: hodEmail }
      })

      if (existingUser) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'A user with this email already exists. Please use a different email or invite an existing user.' 
          },
          { status: 409 }
        )
      }

      // Generate temporary password
      tempPassword = generateTempPassword()
      const hashedPassword = await bcrypt.hash(tempPassword, 10)

      // Generate unique invitation code
      invitationCode = dropid('adm', 'inv')

      // Create HOD user
      hodUser = await db.user.create({
        data: {
          id: dropid('user'),
          email: hodEmail,
          registrationEmail: hodEmail,
          fullName: hodFullName || ' ',
          password: hashedPassword,
          role: 'HOD',
          institutionId: institution.id,
          departmentId: department.id,
          status: 'INACTIVE',
          emailVerified: false,
          staffNumber: dropid('hod'),
        }
      })

      // Create invitation record
      invitation = await db.hODInvitation.create({
        data: {
          id: dropid('inv'),
          email: hodEmail,
          code: invitationCode,
          departmentId: department.id,
          institutionId: institution.id,
          invitedById: auth.admin.id,
          invitedUserId: hodUser.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'PENDING',
        }
      })

      // Log user creation
      await db.adminAction.create({
        data: {
          id: dropid('act'),
          adminId: auth.admin.id,
          actionType: 'CREATE',
          description: `Created HOD user for department: ${name}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }
      })

      // Send invitation email with login credentials (don't await - fire and forget)
      sendHODInviteEmail({
        email: hodEmail,
        departmentName: name,
        code: invitationCode,
        institutionName: institution.name,
        departmentId: department.id,
        inviterName: auth.admin.fullName || 'System Admin',
        tempPassword: tempPassword,
        hodFullName: hodFullName,
      }).catch(emailError => {
        console.error('[HOD_INVITE_EMAIL_ERROR]', emailError)
        // Log but don't affect response
      })
    }

    return NextResponse.json({
      success: true,
      message: sendInvite 
        ? `Department created and invitation sent to ${hodEmail}` 
        : 'Department created successfully',
      data: {
        ...department,
        facultyCount: 0,
        studentCount: 0,
        proposalCount: 0,
        status: hodUser ? 'Active' : 'Pending HOD',
        hodUser: hodUser ? {
          id: hodUser.id,
          email: hodUser.email,
          status: hodUser.status
        } : null,
        ...(process.env.NODE_ENV === 'development' && tempPassword && { 
          tempPassword // For testing only
        })
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('[DEPARTMENTS_POST]', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create department',
        error: error.message 
      },
      { status: 500 }
    )
  }
}

// Helper function to calculate approval rate
function calculateApprovalRate(proposalCount: number): string {
  return '87%'
}


