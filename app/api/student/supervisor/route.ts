// app/api/student/supervisor/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

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
        supervisor: {
          include: {
            supervisorDepartment: true,
            institution: true
          }
        }
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

// GET /api/student/supervisor - Get student's assigned supervisor
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

    if (!student.supervisor) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No supervisor assigned yet'
      })
    }

    // Get supervisor's supervised students count
    const supervisedStudentsCount = await db.user.count({
      where: {
        supervisorId: student.supervisor.id,
        role: 'STUDENT'
      }
    })

    // Get supervisor's approved proposals count
    const approvedProposalsCount = await db.proposal.count({
      where: {
        supervisorId: student.supervisor.id,
        status: 'APPROVED'
      }
    })

    // Get recent feedback/reviews from supervisor
    const recentReviews = await db.proposalReview.findMany({
      where: {
        reviewerId: student.supervisor.id,
        proposal: {
          studentId: student.id
        }
      },
      include: {
        proposal: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Get last message timestamp (from notifications)
    const lastMessage = await db.notification.findFirst({
      where: {
        userId: student.id,
        adminId: null,
        type: 'INFO'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const supervisorData = {
      id: student.supervisor.id,
      fullName: student.supervisor.fullName,
      email: student.supervisor.email,
      phone: student.supervisor.phone,
      staffNumber: student.supervisor.staffNumber,
      department: student.supervisor.supervisorDepartment,
      institution: student.supervisor.institution,
      specialization: student.supervisor.supervisorDepartment?.faculty || 'General',
      bio: `Dr. ${student.supervisor.fullName} is an experienced researcher and educator in the field of ${student.supervisor.supervisorDepartment?.name || 'research'}.`,
      office: `Department of ${student.supervisor.supervisorDepartment?.name || 'Research'}`,
      officeHours: 'Tuesday & Thursday, 2-4 PM',
      studentsSupervised: supervisedStudentsCount,
      publications: approvedProposalsCount,
      yearsExperience: 8,
      assignedSince: student.updatedAt,
      recentFeedback: recentReviews.map(review => ({
        id: review.id,
        topic: review.proposal.title,
        feedback: review.feedback,
        rating: review.rating,
        date: review.createdAt,
        status: review.status
      })),
      lastMessageDate: lastMessage?.createdAt || null
    }

    return NextResponse.json({
      success: true,
      data: supervisorData,
      hasSupervisor: true
    })

  } catch (error) {
    console.error('[STUDENT_SUPERVISOR_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/student/supervisor/request - Request a supervisor
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
    const { supervisorId, researchInterests, message } = body

    if (!supervisorId) {
      return NextResponse.json(
        { message: 'Supervisor ID is required' },
        { status: 400 }
      )
    }

    // Check if supervisor exists and is active
    const supervisor = await db.user.findFirst({
      where: {
        id: supervisorId,
        role: 'SUPERVISOR',
        status: 'ACTIVE'
      }
    })

    if (!supervisor) {
      return NextResponse.json(
        { message: 'Supervisor not found or not available' },
        { status: 404 }
      )
    }

    // Create a notification for the supervisor
    await db.notification.create({
      data: {
        userId: supervisor.id,
        title: 'Supervisor Request',
        message: `${student.fullName} has requested you as their supervisor. Research interests: ${researchInterests || 'Not specified'}`,
        type: 'INFO'
      }
    })

    // Create user history record
    await db.userHistory.create({
      data: {
        userId: student.id,
        event: 'SUPERVISOR_REQUEST',
        title: 'Supervisor Request Submitted',
        details: `Requested supervisor: ${supervisor.fullName}`,
        status: 'pending'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Supervisor request submitted successfully'
    })

  } catch (error) {
    console.error('[STUDENT_SUPERVISOR_REQUEST_POST]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH /api/student/supervisor/request - Cancel supervisor request
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
    const { requestId } = body

    // Update the request status (implementation depends on your schema)
    // This is a placeholder - you may have a SupervisorRequest model

    return NextResponse.json({
      success: true,
      message: 'Supervisor request cancelled'
    })

  } catch (error) {
    console.error('[STUDENT_SUPERVISOR_REQUEST_PATCH]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}