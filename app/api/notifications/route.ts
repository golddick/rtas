// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

async function verifyUser() {
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

    const user = await db.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return { error: 'User not found', status: 404 }
    }

    return { user }
  } catch (error) {
    console.error('Verify error:', error)
    return { error: 'Invalid token', status: 401 }
  }
}

// GET /api/notifications - Get all notifications for the current user
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUser()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { user } = auth
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const where: any = {
      userId: user.id
    }

    if (unreadOnly) {
      where.isRead = false
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: {
          userId: user.id,
          isRead: false
        }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        totalCount,
        unreadCount,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('[NOTIFICATIONS_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create a notification
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUser()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const { userId, title, message, type } = body

    if (!userId || !title || !message) {
      return NextResponse.json(
        { message: 'User ID, title, and message are required' },
        { status: 400 }
      )
    }

    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type: type || 'INFO'
      }
    })

    return NextResponse.json({
      success: true,
      data: notification
    })

  } catch (error) {
    console.error('[NOTIFICATIONS_POST]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyUser()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { user } = auth
    const body = await request.json()
    const { notificationId, markAll } = body

    if (markAll) {
      await db.notification.updateMany({
        where: {
          userId: user.id,
          isRead: false
        },
        data: {
          isRead: true
        }
      })
    } else if (notificationId) {
      await db.notification.update({
        where: {
          id: notificationId,
          userId: user.id
        },
        data: {
          isRead: true
        }
      })
    } else {
      return NextResponse.json(
        { message: 'Notification ID or markAll flag is required' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read'
    })

  } catch (error) {
    console.error('[NOTIFICATIONS_PATCH]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}