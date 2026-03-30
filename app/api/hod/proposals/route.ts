// app/api/hod/proposals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

async function verifyHOD() {
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

    if (decoded.role !== 'HOD') {
      return { error: 'Only HOD can access this resource', status: 403 }
    }

    const hod = await db.user.findUnique({
      where: { id: decoded.id },
      include: {
        department: true
      }
    })

    console.log('HOD user found:', hod)

    if (!hod || !hod.department) {
      return { error: 'HOD not found or no department assigned', status: 404 }
    }

    console.log('HOD department:', hod.department)

    return { hod, department: hod.department }
  } catch (error) {
    console.error('Verify error:', error)
    return { error: 'Invalid token', status: 401 }
  }
}

// GET /api/hod/proposals - Get all proposals in HOD's department
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyHOD()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const supervisorId = searchParams.get('supervisorId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    console.log('Request params:', { status, search, supervisorId, page, limit })

    // Build where clause - only proposals in HOD's department
    const where: any = {
      departmentId: auth.department.id
    }

    // Filter by status if provided
    if (status && status !== 'All' && status !== 'all') {
      where.status = status
    }

    // Filter by supervisor if provided
    if (supervisorId) {
      if (supervisorId === 'unassigned') {
        where.supervisorId = null
      } else {
        where.supervisorId = supervisorId
      }
    }

    // Search by title or student name
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { student: { fullName: { contains: search, mode: 'insensitive' } } }
      ]
    }

    console.log('Where clause:', where)

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
        supervisor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            staffNumber: true,
            phone: true
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
    const formattedProposals = proposals.map(proposal => ({
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      abstract: proposal.description,
      studentName: proposal.student?.fullName || 'Unknown',
      studentEmail: proposal.student?.email,
      studentMatricNumber: proposal.student?.matricNumber,
      studentPhone: proposal.student?.phone,
      studentProgram: proposal.student?.program,
      supervisorName: proposal.supervisor?.fullName || 'Not Assigned',
      supervisorEmail: proposal.supervisor?.email,
      supervisorStaffNumber: proposal.supervisor?.staffNumber,
      supervisorPhone: proposal.supervisor?.phone,
      submittedDate: proposal.submittedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      status: proposal.status,
      score: proposal.score,
      documentUrl: proposal.documentUrl,
      department: proposal.department,
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
    console.error('[HOD_PROPOSALS_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH /api/hod/proposals - Update proposal status
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyHOD()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const { proposalId, status, score } = body

    if (!proposalId || !status) {
      return NextResponse.json(
        { message: 'Proposal ID and status are required' },
        { status: 400 }
      )
    }

    console.log('Updating proposal:', { proposalId, status, score })

    // Verify proposal belongs to HOD's department
    const proposal = await db.proposal.findFirst({
      where: {
        id: proposalId,
        departmentId: auth.department.id
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { message: 'Proposal not found or not in your department' },
        { status: 404 }
      )
    }

    // Update proposal status
    const updatedProposal = await db.proposal.update({
      where: { id: proposalId },
      data: {
        status,
        score: score !== undefined ? score : proposal.score,
        reviewDate: status === 'UNDER_REVIEW' ? new Date() : proposal.reviewDate,
        approvedDate: status === 'APPROVED' ? new Date() : proposal.approvedDate
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            matricNumber: true
          }
        },
        supervisor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            staffNumber: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    console.log('Proposal updated successfully:', updatedProposal.id)

    return NextResponse.json({
      success: true,
      data: updatedProposal,
      message: 'Proposal status updated successfully'
    })

  } catch (error) {
    console.error('[HOD_PROPOSALS_PATCH]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}