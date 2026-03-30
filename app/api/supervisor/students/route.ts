// app/api/supervisor/students/route.ts
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

// GET /api/supervisor/students - Get all students assigned to supervisor
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
    const statusParam = searchParams.get('status')
    const proposalStatus = searchParams.get('proposalStatus')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    console.log('Request params:', { statusParam, proposalStatus, search, page, limit })

    // Build where clause - students supervised by this supervisor
    const where: any = {
      supervisorId: auth.supervisor.id,
      role: 'STUDENT'
    }

    // Filter by user status - only add if status is provided and valid
    if (statusParam && statusParam !== 'undefined' && statusParam !== 'null' && statusParam !== 'all') {
      // Validate that status is a valid UserStatus enum value
      const validStatuses = ['ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED']
      if (validStatuses.includes(statusParam)) {
        where.status = statusParam
      } else {
        console.warn(`Invalid status value: ${statusParam}, ignoring filter`)
      }
    }

    // Search by name, email, or matric number
    if (search && search !== 'null' && search !== 'undefined' && search.trim()) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { matricNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    console.log('Where clause:', JSON.stringify(where, null, 2))

    // Get total count
    const total = await db.user.count({ where })

    // Get students with their proposals
    const students = await db.user.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            faculty: true
          }
        },
        institution: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        studentProposals: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
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
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        },
        projectPlans: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: {
            milestones: {
              orderBy: { dueDate: 'asc' }
            }
          }
        }
      },
      orderBy: { fullName: 'asc' },
      skip,
      take: limit
    })

    console.log(`Found ${students.length} students`)

    // Format response
    const formattedStudents = students.map(student => {
      const latestProposal = student.studentProposals[0]
      const activePlan = student.projectPlans[0]
      
      // Calculate progress based on milestones if available
      let progress = 0
      if (activePlan && activePlan.milestones.length > 0) {
        const completedMilestones = activePlan.milestones.filter(m => m.status === 'COMPLETED').length
        progress = Math.round((completedMilestones / activePlan.milestones.length) * 100)
      } else if (latestProposal) {
        // Estimate progress based on proposal status
        switch (latestProposal.status) {
          case 'SUBMITTED':
            progress = 20
            break
          case 'UNDER_REVIEW':
            progress = 40
            break
          case 'REVISION_REQUESTED':
            progress = 50
            break
          case 'APPROVED':
            progress = 90
            break
          default:
            progress = 10
        }
      }

      // Get latest review feedback
      const latestReview = latestProposal?.reviews[0]

      return {
        id: student.id,
        fullName: student.fullName,
        studentId: student.matricNumber || `STU-${student.id.slice(0, 8)}`,
        email: student.email,
        phone: student.phone,
        matricNumber: student.matricNumber,
        program: student.program,
        joinDate: student.createdAt.toISOString().split('T')[0],
        status: student.status,
        proposal: latestProposal ? {
          id: latestProposal.id,
          title: latestProposal.title,
          status: latestProposal.status,
          score: latestProposal.score,
          documentUrl: latestProposal.documentUrl,
          documentName:latestProposal.documentName,
          documentSize: latestProposal.documentSize,
          submittedDate: latestProposal.submittedDate?.toISOString().split('T')[0],
          reviewDate: latestProposal.reviewDate,
          approvedDate: latestProposal.approvedDate,
          latestFeedback: latestReview?.feedback,
          latestRating: latestReview?.rating
        } : null,
        proposalStatus: latestProposal?.status || 'No Proposal',
        progress,
        projectPlan: activePlan ? {
          id: activePlan.id,
          title: activePlan.title,
          status: activePlan.status,
          milestones: activePlan.milestones.map(m => ({
            id: m.id,
            title: m.title,
            status: m.status,
            dueDate: m.dueDate,
            completion: m.completion
          }))
        } : null,
        department: student.department,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
      }
    })

    // Filter by proposal status if specified (client-side filtering)
    let filteredStudents = formattedStudents
    if (proposalStatus && proposalStatus !== 'undefined' && proposalStatus !== 'null' && proposalStatus !== 'all') {
      filteredStudents = formattedStudents.filter(s => s.proposalStatus === proposalStatus)
    }

    return NextResponse.json({
      success: true,
      data: filteredStudents,
      pagination: {
        page,
        limit,
        total: filteredStudents.length,
        totalPages: Math.ceil(filteredStudents.length / limit)
      }
    })

  } catch (error) {
    console.error('[SUPERVISOR_STUDENTS_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}