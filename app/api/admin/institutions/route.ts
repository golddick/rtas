import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dropid } from 'dropid'
import { z } from 'zod'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// Validation schema
const createInstitutionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters').max(10).toUpperCase(),
  description: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Invalid URL').optional(),
  logoUrl: z.string().url('Invalid URL').optional(),
})

// Helper to verify admin
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

    // Check if user is admin
    if (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'ADMIN') {
      return { error: 'Insufficient permissions', status: 403 }
    }

    return { admin: decoded }
  } catch (error) {
    return { error: 'Invalid token', status: 401 }
  }
}

// GET /api/admin/institutions - Get all institutions
export async function GET() {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const institutions = await db.institution.findMany({
      orderBy: { createdAt: 'desc' },
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

    // Format response with counts
    const formatted = institutions.map(inst => ({
      ...inst,
      departmentCount: inst._count.departments,
      userCount: inst._count.users,
      proposalCount: inst._count.proposals,
      _count: undefined
    }))

    return NextResponse.json({
      success: true,
      data: formatted
    })

  } catch (error) {
    console.error('[INSTITUTIONS_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/institutions - Create new institution
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
    const parsed = createInstitutionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { 
          message: 'Validation error', 
          errors: parsed.error.errors 
        },
        { status: 400 }
      )
    }

    const { name, code, description, address, website, logoUrl } = parsed.data

    // Check if institution with same code exists
    const existing = await db.institution.findFirst({
      where: {
        OR: [
          { code },
          { name }
        ]
      }
    })

    if (existing) {
      if (existing.code === code) {
        return NextResponse.json(
          { message: 'Institution with this code already exists' },
          { status: 409 }
        )
      }
      if (existing.name === name) {
        return NextResponse.json(
          { message: 'Institution with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Create institution
    const institution = await db.institution.create({
      data: {
        id: dropid('inst'),
        name,
        code,
        slug,
        description,
        address,
        website,
        logoUrl,
        status: 'ACTIVE',
      }
    })

    // Log action
    await db.adminAction.create({
      data: {
        id: dropid('act'),
        adminId: auth.admin.id,
        actionType: 'CREATE',
        description: `Created institution: ${name}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Institution created successfully',
      data: institution
    }, { status: 201 })

  } catch (error) {
    console.error('[INSTITUTIONS_POST]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}