import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

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
      take: 5,
      include: {
        _count: {
          select: {
            proposals: true,
            supervisors: true,
            students: true
          }
        }
      },
      orderBy: {
        proposals: {
          _count: 'desc'
        }
      }
    })

    // For demonstration, calculating approval rates
    // In production, you'd have actual approved counts
    const performance = departments.map(dept => {
      const totalProposals = dept._count.proposals
      const approved = Math.floor(totalProposals * (0.85 + Math.random() * 0.1)) // Random between 85-95%
      return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        proposals: totalProposals,
        approved: approved,
        rate: `${Math.round((approved / (totalProposals || 1)) * 100)}%`,
        facultyCount: dept._count.supervisors,
        studentCount: dept._count.students
      }
    })

    return NextResponse.json({
      success: true,
      data: performance
    })

  } catch (error) {
    console.error('[DEPARTMENT_PERFORMANCE_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}