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

    const [students, supervisors, hods, admins, total] = await Promise.all([
      db.user.count({ where: { role: 'STUDENT' } }),
      db.user.count({ where: { role: 'SUPERVISOR' } }),
      db.user.count({ where: { role: 'HOD' } }),
      db.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } }),
      db.user.count()
    ])

    const distribution = [
      { role: 'Students', count: students, percentage: Math.round((students / total) * 100) },
      { role: 'Supervisors', count: supervisors, percentage: Math.round((supervisors / total) * 100) },
      { role: 'HOD', count: hods, percentage: Math.round((hods / total) * 100) },
      { role: 'Admins', count: admins, percentage: Math.round((admins / total) * 100) },
    ]

    return NextResponse.json({
      success: true,
      data: distribution
    })

  } catch (error) {
    console.error('[USER_DISTRIBUTION_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}