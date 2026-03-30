// app/api/student/proposals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { dropid } from 'dropid'
import { createNotification } from '@/lib/notifications'
import { sendProposalNotificationEmail } from '@/lib/email/emailNotificationWithTemplate'

async function verifyStudent() {
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

    if (decoded.role !== 'STUDENT') {
      return { error: 'Only students can access this resource', status: 403 }
    }

    const student = await db.user.findUnique({
      where: { id: decoded.id },
      include: {
        department: true,
        institution: true,
        supervisor: true
      }
    })

    if (!student) {
      return { error: 'Student not found', status: 404 }
    }

    return { student }
  } catch (error) {
    console.error('Verify error:', error)
    return { error: 'Invalid token', status: 401 }
  }
}

// GET /api/student/proposals - Get all proposals for student
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyStudent()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { student } = auth
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {
      studentId: student.id
    }

    if (status && status !== 'all') {
      where.status = status
    }

    const [proposals, total] = await Promise.all([
      db.proposal.findMany({
        where,
        include: {
          supervisor: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          reviews: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      db.proposal.count({ where })
    ])

    const formattedProposals = proposals.map(proposal => ({
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      submittedDate: proposal.submittedDate?.toISOString().split('T')[0],
      status: proposal.status,
      score: proposal.score,
      documentUrl: proposal.documentUrl,
      feedback: proposal.reviews[0]?.feedback || null,
      supervisorName: proposal.supervisor?.fullName || 'Not Assigned'
    }))

    return NextResponse.json({
      success: true,
      data: formattedProposals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('[STUDENT_PROPOSALS_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/student/proposals - Create new proposal
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyStudent()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { student } = auth
    const body = await request.json()
    const { title, description, documentUrl } = body

    if (!title || !description) {
      return NextResponse.json(
        { message: 'Title and description are required' },
        { status: 400 }
      )  
    }

    // Create proposal with proper ID
    const proposalId = dropid('prop')
    const proposal = await db.proposal.create({
      data: {
        id: proposalId,
        title,
        description,
        documentUrl: documentUrl || null,
        submittedDate: new Date(),
        status: 'SUBMITTED',
        studentId: student.id,
        departmentId: student.departmentId || '',
        institutionId: student.institutionId || '',
        supervisorId: student.supervisorId || null
      },
      include: {
        supervisor: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    })

    // Create in-app notification for supervisor if assigned
    if (student.supervisorId) {
      await createNotification({
        userId: student.supervisorId,
        title: 'New Proposal Submitted',
        message: `${student.fullName} has submitted a new proposal: "${title}"`,
        type: 'INFO'
      })

      // Send email notification using DropAPI with notification template
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const institutionSlug = student.institution?.slug || ''
      const departmentCode = student.department?.code || ''
      const proposalsUrl = `${baseUrl}/dashboard/${institutionSlug}/${departmentCode}/supervisor/proposals`

      if (student.supervisor) {
        await sendProposalNotificationEmail({
        to: student?.supervisor?.email,
        studentName: student.fullName,
        proposalTitle: title,
        action: 'submitted',
        actionUrl: proposalsUrl,
        institutionName: student.institution?.name || 'RTAS'
      })
      }
    }

    return NextResponse.json({
      success: true,
      data: proposal,
      message: 'Proposal submitted successfully'
    })

  } catch (error) {
    console.error('[STUDENT_PROPOSALS_POST]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH /api/student/proposals - Update proposal
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyStudent()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { student } = auth
    const body = await request.json()
    const { proposalId, title, description, documentUrl } = body

    if (!proposalId) {
      return NextResponse.json(
        { message: 'Proposal ID is required' },
        { status: 400 }
      )
    }

    // Verify proposal belongs to student
    const existingProposal = await db.proposal.findFirst({
      where: {
        id: proposalId,
        studentId: student.id
      }
    })

    if (!existingProposal) {
      return NextResponse.json(
        { message: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Only allow editing if status is SUBMITTED or REVISION_REQUESTED
    if (existingProposal.status !== 'SUBMITTED' && existingProposal.status !== 'REVISION_REQUESTED') {
      return NextResponse.json(
        { message: 'Cannot edit proposal in current status' },
        { status: 400 }
      )
    }

    // Update proposal
    const updatedProposal = await db.proposal.update({
      where: { id: proposalId },
      data: {
        title: title || existingProposal.title,
        description: description || existingProposal.description,
        documentUrl: documentUrl !== undefined ? documentUrl : existingProposal.documentUrl,
        status: 'SUBMITTED',
        submittedDate: new Date()
      }
    })

    // Create notification for supervisor about update
    if (student.supervisorId) {
      await createNotification({
        userId: student.supervisorId,
        title: 'Proposal Updated',
        message: `${student.fullName} has updated their proposal: "${title || existingProposal.title}"`,
        type: 'INFO'
      })


  
    }

    return NextResponse.json({
      success: true,
      data: updatedProposal,
      message: 'Proposal updated successfully'
    })

  } catch (error) {
    console.error('[STUDENT_PROPOSALS_PATCH]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/student/proposals - Delete proposal
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyStudent()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { student } = auth
    const { searchParams } = new URL(request.url)
    const proposalId = searchParams.get('id')

    if (!proposalId) {
      return NextResponse.json(
        { message: 'Proposal ID is required' },
        { status: 400 }
      )
    }

    // Verify proposal belongs to student
    const existingProposal = await db.proposal.findFirst({
      where: {
        id: proposalId,
        studentId: student.id
      }
    })

    if (!existingProposal) {
      return NextResponse.json(
        { message: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Only allow deletion if status is SUBMITTED
    if (existingProposal.status !== 'SUBMITTED') {
      return NextResponse.json(
        { message: 'Cannot delete proposal in current status' },
        { status: 400 }
      )
    }

    await db.proposal.delete({
      where: { id: proposalId }
    })

    // Create notification for supervisor about deletion
    if (student.supervisorId) {
      await createNotification({
        userId: student.supervisorId,
        title: 'Proposal Withdrawn',
        message: `${student.fullName} has withdrawn their proposal: "${existingProposal.title}"`,
        type: 'INFO'
      })

    }

    return NextResponse.json({
      success: true,
      message: 'Proposal deleted successfully'
    })

  } catch (error) {
    console.error('[STUDENT_PROPOSALS_DELETE]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}