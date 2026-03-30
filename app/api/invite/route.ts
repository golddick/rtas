import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Invitation code is required' },
        { status: 400 }
      )
    }

    // Find the invitation by code
    const invitation = await db.hODInvitation.findUnique({
      where: { code },
      include: {
        department: {
          include: {
            institution: true
          }
        },
        invitedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { success: false, message: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if expired
    const isExpired = invitation.expiresAt < new Date()

    // Format the response - institution is accessed through department
    const formattedInvitation = {
      id: invitation.id,
      code: invitation.code,
      email: invitation.email,
      status: invitation.status,
      isExpired,
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
      department: {
        id: invitation.department.id,
        name: invitation.department.name,
        code: invitation.department.code,
        description: invitation.department.description,
        faculty: invitation.department.faculty,
        maxStudents: invitation.department.maxStudents,
      },
      institution: {
        id: invitation.department.institution.id,
        name: invitation.department.institution.name,
        code: invitation.department.institution.code,
      },
      invitedBy: {
        name: invitation.invitedBy.fullName,
        email: invitation.invitedBy.email,
        role: invitation.invitedBy.role,
      }
    }

    return NextResponse.json({
      success: true,
      data: formattedInvitation
    })

  } catch (error) {
    console.error('[INVITE_GET]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}