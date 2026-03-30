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

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const activities = await db.adminAction.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    })

    const formatted = activities.map(action => ({
      id: action.id,
      action: action.actionType,
      description: action.description,
      user: action.admin?.fullName || 'System',
      time: formatTimeAgo(action.createdAt),
      type: mapActionType(action.actionType)
    }))

    return NextResponse.json({
      success: true,
      data: formatted
    })

  } catch (error) {
    console.error('[ACTIVITIES_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return `${seconds} seconds ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

function mapActionType(type: string): string {
  const map: Record<string, string> = {
    'CREATE': 'user_create',
    'UPDATE': 'dept_update',
    'DELETE': 'security_audit',
    'LOGIN': 'security_audit',
    'INVITE': 'dept_create',
  }
  return map[type] || 'system_backup'
}