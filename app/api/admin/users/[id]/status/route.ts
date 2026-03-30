import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { dropid } from 'dropid'

const statusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION','SUSPENDED' ]),
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

    // Update user status
    const updated = await db.user.update({
      where: { id },
      data: { status },
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

    // Log action
    await db.adminAction.create({
      data: {
        id: dropid('act'),
        adminId: auth.admin.id,
        actionType: 'UPDATE',
        description: `Changed user status to ${status} for: ${updated.fullName}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updated

    return NextResponse.json({
      success: true,
      message: `User status updated to ${status}`,
      data: userWithoutPassword
    })

  } catch (error) {
    console.error('[USER_STATUS_PATCH]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}