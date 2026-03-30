import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { dropid } from 'dropid'

const updateInstitutionSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).max(10).toUpperCase().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Invalid URL').optional(),
  logoUrl: z.string().url('Invalid URL').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
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
    }

    if (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'ADMIN') {
      return { error: 'Insufficient permissions', status: 403 }
    }

    return { admin: decoded }
  } catch (error) {
    return { error: 'Invalid token', status: 401 }
  }
}

// GET /api/admin/institutions/[id] - Get single institution
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

    const institution = await db.institution.findUnique({
      where: { id },
      include: {
        departments: {
          include: {
            _count: {
              select: {
                supervisors: true,
                students: true,
                proposals: true,
              }
            }
          }
        },
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          }
        },
        _count: {
          select: {
            departments: true,
            users: true,
            proposals: true,
          }
        }
      }
    })

    if (!institution) {
      return NextResponse.json(
        { message: 'Institution not found' },
        { status: 404 }
      )
    }

    // Format departments with counts
    const formattedDepartments = institution.departments.map(dept => ({
      ...dept,
      facultyCount: dept._count.supervisors, // Changed from faculty to supervisors
      studentCount: dept._count.students,
      proposalCount: dept._count.proposals,
      _count: undefined
    }))

    const formatted = {
      ...institution,
      departments: formattedDepartments,
      departmentCount: institution._count.departments,
      userCount: institution._count.users,
      proposalCount: institution._count.proposals,
      _count: undefined
    }

    return NextResponse.json({
      success: true,
      data: formatted
    })

  } catch (error) {
    console.error('[INSTITUTION_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/institutions/[id] - Update institution
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
    const parsed = updateInstitutionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { 
          message: 'Validation error', 
          errors: parsed.error.errors 
        },
        { status: 400 }
      )
    }

    const updateData: any = { ...parsed.data }

    // Check if institution exists
    const institution = await db.institution.findUnique({
      where: { id }
    })

    if (!institution) {
      return NextResponse.json(
        { message: 'Institution not found' },
        { status: 404 }
      )
    }

    // Check for conflicts if updating name or code
    if (updateData.name || updateData.code) {
      const conflicts = await db.institution.findFirst({
        where: {
          AND: [
            { NOT: { id } },
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
            { message: 'Institution with this name already exists' },
            { status: 409 }
          )
        }
        if (conflicts.code === updateData.code) {
          return NextResponse.json(
            { message: 'Institution with this code already exists' },
            { status: 409 }
          )
        }
      }
    }

    // Update slug if name changed
    if (updateData.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }

    // Update institution
    const updated = await db.institution.update({
      where: { id },
      data: updateData
    })

    // Log action
    await db.adminAction.create({
      data: {
        id: dropid('act'),
        adminId: auth.admin.id,
        actionType: 'UPDATE',
        description: `Updated institution: ${updated.name}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Institution updated successfully',
      data: updated
    })

  } catch (error) {
    console.error('[INSTITUTION_PATCH]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/institutions/[id] - Delete institution
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

    // Only SUPER_ADMIN can delete institutions
    if (auth.admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Only super admins can delete institutions' },
        { status: 403 }
      )
    }

    const { id } = params

    // Check if institution exists
    const institution = await db.institution.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            departments: true,
            users: true,
            proposals: true,
          }
        }
      }
    })

    if (!institution) {
      return NextResponse.json(
        { message: 'Institution not found' },
        { status: 404 }
      )
    }

    // Check if institution has dependencies
    if (institution._count.departments > 0 || 
        institution._count.users > 0 || 
        institution._count.proposals > 0) {
      return NextResponse.json(
        { 
          message: 'Cannot delete institution with existing departments, users, or proposals. Archive it instead.',
          dependencies: {
            departments: institution._count.departments,
            users: institution._count.users,
            proposals: institution._count.proposals
          }
        },
        { status: 409 }
      )
    }

    // Delete institution
    await db.institution.delete({
      where: { id }
    })

    // Log action
    await db.adminAction.create({
      data: {
        id: dropid('act'),
        adminId: auth.admin.id,
        actionType: 'DELETE',
        description: `Deleted institution: ${institution.name}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Institution deleted successfully'
    })

  } catch (error) {
    console.error('[INSTITUTION_DELETE]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}