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

    const [newUsersToday, newProposalsToday] = await Promise.all([
      db.user.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      db.proposal.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
    ])

    const quickStats = {
      newUsersToday,
      newProposalsToday,
      activeSessions: 1452, // This would come from your session store
      storageUsed: '245 GB / 500 GB',
      backupSize: '12.5 GB',
      lastBackup: formatTimeAgo(new Date(Date.now() - 8 * 60 * 60 * 1000))
    }

    return NextResponse.json({
      success: true,
      data: quickStats
    })

  } catch (error) {
    console.error('[QUICK_STATS_GET]', error)
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