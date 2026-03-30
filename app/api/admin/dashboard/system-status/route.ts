import { NextRequest, NextResponse } from 'next/server'
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

    // In production, you'd check actual service health
    const systemStatus = [
      { name: 'API Server', status: 'online', uptime: '99.99%', latency: 45 },
      { name: 'Database', status: 'online', uptime: '99.98%', latency: 12 },
      { name: 'Cache Server', status: 'online', uptime: '99.99%', latency: 3 },
      { name: 'Email Service', status: 'online', uptime: '99.95%', latency: 120 },
      { name: 'File Storage', status: 'online', uptime: '99.97%', latency: 85 },
    ]

    return NextResponse.json({
      success: true,
      data: systemStatus
    })

  } catch (error) {
    console.error('[SYSTEM_STATUS_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}