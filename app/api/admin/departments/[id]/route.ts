import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { dropid } from 'dropid'
import { sendHODInviteEmail } from '@/lib/email/hod-invite'
import { sendWelcomeEmail } from '@/lib/email/email'


const updateDepartmentSchema = z.object({
  name: z.string().min(2).optional(),
  faculty: z.string().min(2).optional(),
  code: z.string().min(2).max(10).toUpperCase().optional(),
  description: z.string().min(10).optional(),
  maxStudents: z.number().min(1).max(500).optional(),
  institutionId: z.string().optional(),
  hodId: z.string().nullable().optional(),
  status: z.enum(['Active', 'Inactive', 'Pending HOD']).optional(),
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

// GET /api/admin/departments/[id] - Get single department
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { id } = params

    const department = await db.department.findUnique({
      where: { id },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
            logoUrl: true,
          }
        },
        hod: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        },
        supervisors: {
          select: {
            id: true,
            fullName: true,
            email: true,
            department: {
              select: {
                name: true
              }
            }
          },
          take: 10,
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

    if (!department) {
      return NextResponse.json(
        { message: 'Department not found' },
        { status: 404 }
      )
    }

    const formatted = {
      ...department,
      facultyCount: department._count.supervisors,
      studentCount: department._count.students,
      proposalCount: department._count.proposals,
      status: department.hodId ? 'Active' : 'Pending HOD',
      _count: undefined
    }

    return NextResponse.json({
      success: true,
      data: formatted
    })

  } catch (error) {
    console.error('[DEPARTMENT_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/departments/[id] - Update department
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { id } = params
    const body = await request.json()
    const parsed = updateDepartmentSchema.safeParse(body)

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

    // Check if department exists
    const department = await db.department.findUnique({
      where: { id },
      include: {
        institution: true
      }
    })

    if (!department) {
      return NextResponse.json(
        { message: 'Department not found' },
        { status: 404 }
      )
    }

    // Check for conflicts if updating name/code within same institution
    if (updateData.name || updateData.code) {
      const institutionId = updateData.institutionId || department.institutionId
      
      const conflicts = await db.department.findFirst({
        where: {
          AND: [
            { NOT: { id } },
            { institutionId },
            {
              OR: [
                updateData.name ? { name: updateData.name } : {},
                updateData.code ? { code: updateData.code } : {},
              ]
            }
          ]
        }
      })

      if (conflicts) {
        if (conflicts.name === updateData.name) {
          return NextResponse.json(
            { message: 'Department with this name already exists in this institution' },
            { status: 409 }
          )
        }
        if (conflicts.code === updateData.code) {
          return NextResponse.json(
            { message: 'Department with this code already exists in this institution' },
            { status: 409 }
          )
        }
      }
    }

    // Update department
    const updated = await db.department.update({
      where: { id },
      data: updateData,
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
        }
      }
    })

    // Log action
    await db.adminAction.create({
      data: {
        id: dropid('act'),
        adminId: auth.admin.id,
        actionType: 'UPDATE',
        description: `Updated department: ${updated.name}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // If HOD was assigned, send welcome email
    if (updateData.hodId && updateData.hodId !== department.hodId) {
      const hod = await db.user.findUnique({
        where: { id: updateData.hodId },
        select: { id: true, fullName: true, email: true }
      })

      if (hod) {
        try {
          await sendWelcomeEmail({
            email: hod.email,
            fullName: hod.fullName || 'HOD',
            role: 'Head of Department',
            institutionName: updated.institution.name,
          })
        } catch (emailError) {
          console.error('[HOD_WELCOME_EMAIL_ERROR]', emailError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Department updated successfully',
      data: {
        ...updated,
        status: updated.hodId ? 'Active' : 'Pending HOD'
      }
    })

  } catch (error) {
    console.error('[DEPARTMENT_PATCH]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/departments/[id]/invite - Send HOD invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { id } = params
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Get department details
    const department = await db.department.findUnique({
      where: { id },
      include: {
        institution: true,
        hod: true
      }
    })

    if (!department) {
      return NextResponse.json(
        { message: 'Department not found' },
        { status: 404 }
      )
    }

    if (department.hod) {
      return NextResponse.json(
        { message: 'Department already has a Head of Department assigned' },
        { status: 409 }
      )
    }

    // Generate invitation code
     const invitationCode = dropid('adm', 'inv')

    // Send invitation via DropAPI
    const inviteResult = await sendHODInviteEmail({
      email,
      departmentName: department.name,
      code: invitationCode,
      institutionName: department.institution.name,
      departmentId: department.id,
      inviterName: auth.admin.fullName || 'System Admin',
    })

    if (!inviteResult.success) {
      return NextResponse.json(
        { 
          message: 'Failed to send invitation',
          error: inviteResult.error 
        },
        { status: 500 }
      )
    }

    // Create invitation record
    await db.hODInvitation.create({
      data: {
        id: dropid('inv'),
        email,
        code: invitationCode,
        departmentId: department.id,
        institutionId: department.institutionId,
        invitedById: auth.admin.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'PENDING',
      }
    })

    // Log action
    await db.adminAction.create({
      data: {
        id: dropid('act'),
        adminId: auth.admin.id,
        actionType: 'INVITE',
        description: `Sent HOD invitation for ${department.name} to ${email}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      data: {
        email,
        code: invitationCode,
        departmentId: department.id,
        departmentName: department.name,
        institutionName: department.institution.name,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }
    })

  } catch (error) {
    console.error('[DEPARTMENT_INVITE_POST]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/departments/[id] - Delete department
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    // Only SUPER_ADMIN can delete departments
    if (auth.admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Only super admins can delete departments' },
        { status: 403 }
      )
    }

    const { id } = params

    // Check if department exists
    const department = await db.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            supervisors: true,
            students: true,
            proposals: true,
          }
        }
      }
    })

    if (!department) {
      return NextResponse.json(
        { message: 'Department not found' },
        { status: 404 }
      )
    }

    // Check if department has dependencies
    if (department._count.supervisors > 0 || 
        department._count.students > 0 || 
        department._count.proposals > 0) {
      return NextResponse.json(
        { 
          message: 'Cannot delete department with existing supervisors, students, or proposals. Consider archiving it instead.',
          dependencies: {
            supervisors: department._count.supervisors,
            students: department._count.students,
            proposals: department._count.proposals
          }
        },
        { status: 409 }
      )
    }

    // Delete related invitations first
    await db.hODInvitation.deleteMany({
      where: { departmentId: id }
    })

    // Delete department
    await db.department.delete({
      where: { id }
    })

    // Log action
    await db.adminAction.create({
      data: {
        id: dropid('act'),
        adminId: auth.admin.id,
        actionType: 'DELETE',
        description: `Deleted department: ${department.name}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully'
    })

  } catch (error) {
    console.error('[DEPARTMENT_DELETE]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}