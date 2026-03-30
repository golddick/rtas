// app/api/supervisor/proposals/route.ts
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

    console.log('Decoded token:', decoded)

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

    console.log('Supervisor found:', supervisor)

    if (!supervisor) {
      return { error: 'Supervisor not found', status: 404 }
    }

    return { supervisor, department: supervisor.supervisorDepartment, institution: supervisor.institution }
  } catch (error) {
    console.error('Verify error:', error)
    return { error: 'Invalid token', status: 401 }
  }
}

// GET /api/supervisor/proposals - Get proposals assigned to supervisor
export async function GET(request: NextRequest) {
  try {
    const auth = await verifySupervisor()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    console.log('Request params:', { status, search, page, limit })

    // Build where clause - proposals assigned to this supervisor
    const where: any = {
      supervisorId: auth.supervisor.id
    }

    // Filter by status if provided
    if (status && status !== 'undefined' && status !== 'null' && status !== 'all') {
      const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED']
      if (validStatuses.includes(status)) {
        where.status = status
      }
    }

    // Search by title or student name
    if (search && search !== 'null' && search !== 'undefined' && search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { student: { fullName: { contains: search, mode: 'insensitive' } } }
      ]
    }

    console.log('Where clause:', JSON.stringify(where, null, 2))

    // Get total count
    const total = await db.proposal.count({ where })

    // Get proposals with related data
    const proposals = await db.proposal.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            matricNumber: true,
            phone: true,
            program: true
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
      },
      orderBy: {
        submittedDate: 'desc'
      },
      skip,
      take: limit
    })

    console.log(`Found ${proposals.length} proposals`)

    // Format response
    const formattedProposals = proposals.map(proposal => {
      // Calculate pages (estimate if not available)
      const pages = Math.ceil(proposal.description.length / 500) || 10
      
      // Determine priority based on submission date
      let priority = 'Medium'
      if (proposal.submittedDate) {
        const daysSinceSubmission = Math.floor((Date.now() - new Date(proposal.submittedDate).getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceSubmission > 7) priority = 'High'
        else if (daysSinceSubmission > 3) priority = 'Medium'
        else priority = 'Low'
      }

      return {
        id: proposal.id,
        title: proposal.title,
        description: proposal.description,
        studentName: proposal.student.fullName,
        studentEmail: proposal.student.email,
        studentId: proposal.student.id,
        studentMatricNumber: proposal.student.matricNumber,
        supervisorName: auth.supervisor.fullName,
        studentPhone: proposal.student.phone,
        studentProgram: proposal.student.program,
        submittedDate: proposal.submittedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        status: proposal.status,
        score: proposal.score,
        documentUrl: proposal.documentUrl,
        documentName: proposal.documentName,
        department: proposal.department,
        pages,
        priority,
        reviews: proposal.reviews.map(review => ({
          id: review.id,
          feedback: review.feedback,
          rating: review.rating,
          status: review.status,
          reviewerName: review.reviewer.fullName,
          reviewerEmail: review.reviewer.email,
          reviewerRole: review.reviewer.role,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt
        })),
        reviewDate: proposal.reviewDate,
        approvedDate: proposal.approvedDate,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt
      }
    })

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
    console.error('[SUPERVISOR_PROPOSALS_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH /api/supervisor/proposals - Update proposal status
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifySupervisor()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const { proposalId, status, feedback, rating } = body

    if (!proposalId || !status) {
      return NextResponse.json(
        { message: 'Proposal ID and status are required' },
        { status: 400 }
      )
    }

    console.log('Updating proposal:', { proposalId, status, feedback, rating })

    // Verify proposal belongs to supervisor
    const proposal = await db.proposal.findFirst({
      where: {
        id: proposalId,
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

    // Update proposal status
    const updatedProposal = await db.proposal.update({
      where: { id: proposalId },
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
          proposalId,
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
    console.error('[SUPERVISOR_PROPOSALS_PATCH]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}