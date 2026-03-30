// app/api/supervisor/proposals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

async function verifySupervisor() {
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

    if (decoded.role !== 'SUPERVISOR') {
      return { error: 'Only supervisors can access this resource', status: 403 }
    }

    const supervisor = await db.user.findUnique({
      where: { id: decoded.id }
    })

    if (!supervisor) {
      return { error: 'Supervisor not found', status: 404 }
    }

    return { supervisor }
  } catch (error) {
    console.error('Verify error:', error)
    return { error: 'Invalid token', status: 401 }
  }
}

// PATCH /api/supervisor/proposals/[id] - Update proposal status and add review
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifySupervisor()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const { status, feedback, rating } = body

    if (!status) {
      return NextResponse.json(
        { message: 'Status is required' },
        { status: 400 }
      )
    }

    // Verify proposal exists and belongs to supervisor's student
    const proposal = await db.proposal.findFirst({
      where: {
        id: params.id,
        supervisorId: auth.supervisor.id
      },
      include: {
        student: true
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { message: 'Proposal not found or not assigned to you' },
        { status: 404 }
      )
    }

    // Update proposal
    const updatedProposal = await db.proposal.update({
      where: { id: params.id },
      data: {
        status,
        reviewDate: status === 'UNDER_REVIEW' ? new Date() : proposal.reviewDate,
        approvedDate: status === 'APPROVED' ? new Date() : proposal.approvedDate
      }
    })

    // Add review if feedback provided
    if (feedback) {
      await db.proposalReview.create({
        data: {
          proposalId: params.id,
          reviewerId: auth.supervisor.id,
          feedback,
          rating: rating || 0,
          status: status === 'APPROVED' ? 'APPROVED' : 'REVISION_REQUESTED'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedProposal,
      message: 'Proposal updated successfully'
    })

  } catch (error) {
    console.error('[SUPERVISOR_PROPOSAL_PATCH]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}