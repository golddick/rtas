import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const acceptInviteSchema = z.object({
  code: z.string(),
  userId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = acceptInviteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request', errors: parsed.error.errors },
        { status: 400 }
      )
    }

    const { code, userId } = parsed.data

    // Find the invitation with all related data
    const invitation = await db.hODInvitation.findUnique({
      where: { code , invitedUserId:userId},
      include: {
        department: {
          include: {
            institution: true
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
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Invitation has expired' },
        { status: 410 }
      )
    }

    // Check if already accepted
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, message: `Invitation already ${invitation.status.toLowerCase()}` },
        { status: 409 }
      )
    }

    // Find the user by email
    const user = await db.user.findUnique({
      where: { email: invitation.email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found. Please create an account first.' },
        { status: 404 }
      )
    }

    // Use transaction to update all related records
    const result = await db.$transaction(async (tx) => {
      // Update invitation
      const updatedInvitation = await tx.hODInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          invitedUserId: user.id
        }
      })

      // Update department with HOD
      const updatedDepartment = await tx.department.update({
        where: { id: invitation.departmentId },
        data: { hodId: user.id }
      })

      // Update user status and role if needed
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { 
          status: 'ACTIVE',
          role: 'HOD',
          departmentId: invitation.departmentId,
          institutionId: invitation.institutionId
        }
      })

      // Log the action
      await tx.adminAction.create({
        data: {
          id: `act_${Date.now()}`,
          adminId: invitation.invitedById,
          actionType: 'INVITE',
          description: `HOD invitation accepted by ${user.email} for department: ${invitation.department.name}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }
      })

      return {
        invitation: updatedInvitation,
        department: updatedDepartment,
        user: updatedUser
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        departmentId: result.department.id,
        departmentName: result.department.name,
        userId: result.user.id,
        userEmail: result.user.email
      }
    })

  } catch (error) {
    console.error('[ACCEPT_INVITE_ERROR]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}