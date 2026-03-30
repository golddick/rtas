import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

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

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    // Check if user has dependencies
    const user = await db.user.findUnique({
      where: { id: auth.user.id },
      include: {
        _count: {
          select: {
            supervisedStudents: true,
            studentProposals: true,
            supervisorProposals: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has active dependencies
    if (user._count.supervisedStudents > 0 || 
        user._count.studentProposals > 0 || 
        user._count.supervisorProposals > 0) {
      return NextResponse.json(
        { 
          message: 'Cannot delete account with active students or proposals. Please contact administrator.',
          dependencies: {
            supervisedStudents: user._count.supervisedStudents,
            studentProposals: user._count.studentProposals,
            supervisorProposals: user._count.supervisorProposals
          }
        },
        { status: 409 }
      )
    }

    // Delete user's related records first
    await db.$transaction([
      // Delete user's notifications
      db.notification.deleteMany({
        where: { userId: auth.user.id }
      }),
      // Delete user's history
      db.userHistory.deleteMany({
        where: { userId: auth.user.id }
      }),
      // Delete user's invitations (as invited user)
      db.hODInvitation.deleteMany({
        where: { invitedUserId: auth.user.id }
      }),
      // Finally delete the user
      db.user.delete({
        where: { id: auth.user.id }
      })
    ])

    // Clear auth cookie
    const cookieStore = await cookies()
    cookieStore.delete('auth_token')

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    })

  } catch (error) {
    console.error('[DELETE_ACCOUNT_ERROR]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}