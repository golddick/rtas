import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { dropid } from 'dropid'

// Schema without nullable - only optional
const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(['STUDENT', 'SUPERVISOR', 'HOD']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
  emailVerified: z.boolean().optional(),
  institutionId: z.string().optional(),
  departmentId: z.string().optional(),
  supervisorDepartmentId: z.string().optional(),
  matricNumber: z.string().optional(),
  staffNumber: z.string().optional(),
  program: z.enum(['BSC', 'MSC', 'PHD']).optional(),
  supervisorId: z.string().optional(),
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

// GET /api/admin/users/[id] - Get single user
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

    const user = await db.user.findUnique({
      where: { id },
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
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error) {
    console.error('[ADMIN_USER_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users/[id] - Update user
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
    const parsed = updateUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { 
          message: 'Validation error', 
          errors: parsed.error.errors 
        },
        { status: 400 }
      )
    }

    // Get the validated data
    const updateData = parsed.data

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Check email uniqueness if updating email
    if (updateData.email && updateData.email !== user.email) {
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

    // Check matric number uniqueness
    if (updateData.matricNumber && updateData.matricNumber !== user.matricNumber) {
      const existingMatric = await db.user.findUnique({
        where: { matricNumber: updateData.matricNumber }
      })
      if (existingMatric) {
        return NextResponse.json(
          { message: 'Matric number already exists' },
          { status: 409 }
        )
      }
    }

    // Check staff number uniqueness
    if (updateData.staffNumber && updateData.staffNumber !== user.staffNumber) {
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

    // Only include fields that are actually present in the request
    // This removes any undefined values
    const dataToUpdate: any = {}
    Object.keys(updateData).forEach(key => {
      const value = (updateData as any)[key]
      if (value !== undefined) {
        dataToUpdate[key] = value
      }
    })

    // Update user
    const updated = await db.user.update({
      where: { id },
      data: dataToUpdate,
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
        actionType: 'UPDATE',
        description: `Updated user: ${updated.fullName}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updated

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: userWithoutPassword
    })

  } catch (error) {
    console.error('[ADMIN_USER_PATCH]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete user
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

    // Only SUPER_ADMIN can delete users
    if (auth.admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Only super admins can delete users' },
        { status: 403 }
      )
    }

    const { id } = params

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            supervisedStudents: true,
            studentProposals: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has dependencies
    if (user._count.supervisedStudents > 0 || user._count.studentProposals > 0) {
      return NextResponse.json(
        { 
          message: 'Cannot delete user with existing students or proposals. Deactivate instead.',
          dependencies: {
            supervisedStudents: user._count.supervisedStudents,
            proposals: user._count.studentProposals
          }
        },
        { status: 409 }
      )
    }

    // Delete user
    await db.user.delete({
      where: { id }
    })

    // Log action
    await db.adminAction.create({
      data: {
        id: dropid('act'),
        adminId: auth.admin.id,
        actionType: 'DELETE',
        description: `Deleted user: ${user.fullName}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('[ADMIN_USER_DELETE]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}