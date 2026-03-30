import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { dropid } from 'dropid'

const updateSupervisorSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  staffNumber: z.string().optional(),
  specialization: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED']).optional(),
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

// GET /api/hod/supervisors/[id] - Get single supervisor
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyHOD()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { id } = params

    const supervisor = await db.user.findFirst({
      where: {
        id,
        role: 'SUPERVISOR',
        supervisorDepartmentId: auth.department.id, // Ensure supervisor belongs to HOD's department
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

    if (!supervisor) {
      return NextResponse.json(
        { message: 'Supervisor not found' },
        { status: 404 }
      )
    }

    const formatted = {
      id: supervisor.id,
      fullName: supervisor.fullName,
      email: supervisor.email,
      phone: supervisor.phone,
      staffNumber: supervisor.staffNumber,
      avatar: supervisor.avatar,
      status: supervisor.status,
      departmentId: supervisor.supervisorDepartmentId,
      department: supervisor.supervisorDepartment,
      institutionId: supervisor.institutionId,
      institution: supervisor.institution,
      students: supervisor.supervisedStudents,
      studentCount: supervisor.supervisedStudents.length,
      approvedTopics: supervisor.supervisorProposals.length,
      createdAt: supervisor.createdAt,
      updatedAt: supervisor.updatedAt,
    }

    return NextResponse.json({
      success: true,
      data: formatted
    })

  } catch (error) {
    console.error('[HOD_SUPERVISOR_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/hod/supervisors/[id] - Update supervisor
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyHOD()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { id } = params
    const body = await request.json()
    const parsed = updateSupervisorSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { 
          message: 'Validation error', 
          errors: parsed.error.errors 
        },
        { status: 400 }
      )
    }

    const updateData = parsed.data

    // Check if supervisor exists and belongs to HOD's department
    const supervisor = await db.user.findFirst({
      where: {
        id,
        role: 'SUPERVISOR',
        supervisorDepartmentId: auth.department.id,
      }
    })

    if (!supervisor) {
      return NextResponse.json(
        { message: 'Supervisor not found' },
        { status: 404 }
      )
    }

    // Check email uniqueness if updating
    if (updateData.email && updateData.email !== supervisor.email) {
      const existingUser = await db.user.findUnique({
        where: { email: updateData.email }
      })
      if (existingUser) {
        return NextResponse.json(
          { message: 'Email already in use' },
          { status: 409 }
        )
      }
    }

    // Check staff number uniqueness
    if (updateData.staffNumber && updateData.staffNumber !== supervisor.staffNumber) {
      const existingStaff = await db.user.findUnique({
        where: { staffNumber: updateData.staffNumber }
      })
      if (existingStaff) {
        return NextResponse.json(
          { message: 'Staff number already exists' },
          { status: 409 }
        )
      }
    }

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    )

    // Update supervisor
    const updated = await db.user.update({
      where: { id },
      data: cleanData,
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
        }
      }
    })

    // Log action
    await db.adminAction.create({
      data: {
        id: dropid('act'),
        adminId: auth.hod.id,
        actionType: 'UPDATE',
        description: `Updated supervisor: ${updated.fullName}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    const formatted = {
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      phone: updated.phone,
      staffNumber: updated.staffNumber,
      avatar: updated.avatar,
      status: updated.status,
      departmentId: updated.supervisorDepartmentId,
      department: updated.supervisorDepartment,
      institutionId: updated.institutionId,
      institution: updated.institution,
      students: updated.supervisedStudents,
      studentCount: updated.supervisedStudents.length,
      approvedTopics: 0, // This would need to be calculated
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    }

    return NextResponse.json({
      success: true,
      message: 'Supervisor updated successfully',
      data: formatted
    })

  } catch (error) {
    console.error('[HOD_SUPERVISOR_PATCH]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/hod/supervisors/[id] - Delete supervisor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyHOD()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { id } = params

    // Check if supervisor exists and belongs to HOD's department
    const supervisor = await db.user.findFirst({
      where: {
        id,
        role: 'SUPERVISOR',
        supervisorDepartmentId: auth.department.id,
      },
      include: {
        _count: {
          select: {
            supervisedStudents: true,
            supervisorProposals: true,
          }
        }
      }
    })

    if (!supervisor) {
      return NextResponse.json(
        { message: 'Supervisor not found' },
        { status: 404 }
      )
    }

    // Check if supervisor has students or proposals
    if (supervisor._count.supervisedStudents > 0 || supervisor._count.supervisorProposals > 0) {
      return NextResponse.json(
        { 
          message: 'Cannot delete supervisor with assigned students or proposals. Deactivate instead.',
          dependencies: {
            students: supervisor._count.supervisedStudents,
            proposals: supervisor._count.supervisorProposals
          }
        },
        { status: 409 }
      )
    }

    // Delete supervisor
    await db.user.delete({
      where: { id }
    })

    // Log action
    await db.adminAction.create({
      data: {
        id: dropid('act'),
        adminId: auth.hod.id,
        actionType: 'DELETE',
        description: `Deleted supervisor: ${supervisor.fullName}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Supervisor deleted successfully'
    })

  } catch (error) {
    console.error('[HOD_SUPERVISOR_DELETE]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}