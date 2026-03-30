import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const profileUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().nullable().optional(),
  additionalEmail: z.string().email().nullable().optional(),
  matricNumber: z.string().nullable().optional(),
  staffNumber: z.string().nullable().optional(),
})

async function verifyAuth() {
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
    return { user: decoded }
  } catch (error) {
    return { error: 'Invalid token', status: 401 }
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const parsed = profileUpdateSchema.safeParse(body)

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

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    )

    // Update user
    const updatedUser = await db.user.update({
      where: { id: auth.user.id },
      data: cleanData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        additionalEmail: true,
        role: true,
        emailVerified: true,
        matricNumber: true,
        staffNumber: true,
        program: true,
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
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    })

  } catch (error) {
    console.error('[PROFILE_UPDATE_ERROR]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}