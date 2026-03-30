import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { dropid } from 'dropid'

const statusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED']),
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
    const parsed = statusSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { 
          message: 'Validation error', 
          errors: parsed.error.errors 
        },
        { status: 400 }
      )
    }

    const { status } = parsed.data

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

    // Update status
    const updated = await db.user.update({
      where: { id },
      data: { status },
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
          }
        },
      }
    })

    // Log action
    await db.adminAction.create({
      data: {
        id: dropid('act'),
        adminId: auth.hod.id,
        actionType: 'UPDATE',
        description: `Changed supervisor status to ${status} for: ${updated.fullName}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: `Supervisor status updated to ${status}`,
      data: updated
    })

  } catch (error) {
    console.error('[SUPERVISOR_STATUS_PATCH]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}