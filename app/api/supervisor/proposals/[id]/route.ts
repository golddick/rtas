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
      where: { id: decoded.id },
      include: {
        supervisorDepartment: true,
        institution: true
      }
    })

    if (!supervisor) {
      return { error: 'Supervisor not found', status: 404 }
    }

    return { supervisor, department: supervisor.supervisorDepartment, institution: supervisor.institution }
  } catch (error) {
    console.error('Verify error:', error)
    return { error: 'Invalid token', status: 401 }
  }
}

// GET /api/supervisor/proposals/[id] - Get a single proposal
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifySupervisor()
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      )
    }

    const { id } = await params

    // Get proposal with all details
    const proposal = await db.proposal.findFirst({
      where: {
        id: id,
        supervisorId: auth.supervisor.id
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            matricNumber: true,
            phone: true,
            program: true,
            department: {
              select: {
                id: true,
                name: true,
                code: true,
                faculty: true
              }
            }
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            faculty: true
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { success: false, message: 'Proposal not found or not assigned to you' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: proposal.id,
        title: proposal.title,
        description: proposal.description,
        student: {
          id: proposal.student.id,
          fullName: proposal.student.fullName,
          email: proposal.student.email,
          matricNumber: proposal.student.matricNumber,
          phone: proposal.student.phone,
          program: proposal.student.program,
          department: proposal.student.department
        },
        department: proposal.department,
        status: proposal.status,
        score: proposal.score,
        submittedDate: proposal.submittedDate,
        documentUrl: proposal.documentUrl,
        documentName: proposal.documentName,
        documentSize: proposal.documentSize,
        reviews: proposal.reviews,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt
      }
    })

  } catch (error) {
    console.error('[SUPERVISOR_PROPOSAL_GET]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/supervisor/proposals/[id] - Update proposal status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifySupervisor()
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { status, feedback, rating } = body

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'Status is required' },
        { status: 400 }
      )
    }

    console.log('Updating proposal:', { id, status, feedback, rating })

    // Verify proposal belongs to supervisor
    const proposal = await db.proposal.findFirst({
      where: {
        id: id,
        supervisorId: auth.supervisor.id
      },
      include: {
        student: true
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { success: false, message: 'Proposal not found or not assigned to you' },
        { status: 404 }
      )
    }

    // Update proposal status
    const updatedProposal = await db.proposal.update({
      where: { id },
      data: {
        status,
        score: rating !== undefined ? rating : proposal.score,
        reviewDate: status === 'UNDER_REVIEW' ? new Date() : proposal.reviewDate,
        approvedDate: status === 'APPROVED' ? new Date() : proposal.approvedDate
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    })

    // Add review if feedback provided
    if (feedback) {
      await db.proposalReview.create({
        data: {
          proposalId: id,
          reviewerId: auth.supervisor.id,
          feedback,
          rating: rating || 0,
          status: status === 'APPROVED' ? 'APPROVED' : 
                  status === 'REJECTED' ? 'REJECTED' : 
                  status === 'REVISION_REQUESTED' ? 'REVISION_REQUESTED' : 'PENDING'
        }
      })
    }

    console.log('Proposal updated successfully:', updatedProposal.id)

    return NextResponse.json({
      success: true,
      data: updatedProposal,
      message: 'Proposal updated successfully'
    })

  } catch (error) {
    console.error('[SUPERVISOR_PROPOSAL_PATCH]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/supervisor/proposals/[id] - Delete/archive a proposal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifySupervisor()
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      )
    }

    const { id } = await params

    // Verify proposal belongs to supervisor
    const proposal = await db.proposal.findFirst({
      where: {
        id: id,
        supervisorId: auth.supervisor.id
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { success: false, message: 'Proposal not found or not assigned to you' },
        { status: 404 }
      )
    }

    // Soft delete by changing status to ARCHIVED (or actually delete if you prefer)
    const deletedProposal = await db.proposal.update({
      where: { id },
      data: {
        status: 'REJECTED' // or you can add an ARCHIVED status
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Proposal archived successfully'
    })

  } catch (error) {
    console.error('[SUPERVISOR_PROPOSAL_DELETE]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}