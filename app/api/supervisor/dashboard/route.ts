// app/api/supervisor/dashboard/route.ts
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

// GET /api/supervisor/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const auth = await verifySupervisor()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const supervisorId = auth.supervisor.id

    console.log('Fetching dashboard data for supervisor:', supervisorId)

    // Get all statistics in parallel
    const [
      totalStudents,
      pendingProposals,
      approvedProposals,
      totalProposals,
      topicsCount,
      totalInterests,
      recentActivity,
      pendingReviews
    ] = await Promise.all([
      // Total students supervised
      db.user.count({
        where: {
          supervisorId: supervisorId,
          role: 'STUDENT',
          status: 'ACTIVE'
        }
      }),
      
      // Pending proposals (SUBMITTED or UNDER_REVIEW)
      db.proposal.count({
        where: {
          supervisorId: supervisorId,
          status: {
            in: ['SUBMITTED', 'UNDER_REVIEW']
          }
        }
      }),
      
      // Approved proposals
      db.proposal.count({
        where: {
          supervisorId: supervisorId,
          status: 'APPROVED'
        }
      }),
      
      // Total proposals
      db.proposal.count({
        where: {
          supervisorId: supervisorId
        }
      }),
      
      // Total research topics created
      db.researchTopic.count({
        where: {
          supervisorId: supervisorId,
          status: 'ACTIVE'
        }
      }),
      
      // Total student interests in topics
      db.topicInterest.count({
        where: {
          topic: {
            supervisorId: supervisorId
          }
        }
      }),
      
      // Recent activity (last 5 activities from history)
      db.userHistory.findMany({
        where: {
          userId: supervisorId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      }),
      
      // Pending reviews with student details
      db.proposal.findMany({
        where: {
          supervisorId: supervisorId,
          status: {
            in: ['SUBMITTED', 'UNDER_REVIEW']
          }
        },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              email: true,
              matricNumber: true
            }
          }
        },
        orderBy: {
          submittedDate: 'desc'
        },
        take: 5
      })
    ])

    // Get students with approved topics count
    const studentsWithApprovedTopics = await db.user.count({
      where: {
        supervisorId: supervisorId,
        role: 'STUDENT',
        studentProposals: {
          some: {
            status: 'APPROVED'
          }
        }
      }
    })

    // Calculate percentage of students with approved topics
    const approvedPercentage = totalStudents > 0 
      ? Math.round((studentsWithApprovedTopics / totalStudents) * 100)
      : 0

    // Calculate average review time (mock calculation - you can implement actual logic)
    const averageReviewTime = totalProposals > 0 ? 2.5 : 0

    // Format recent activity
    const formattedRecentActivity = recentActivity.map(activity => ({
      id: activity.id,
      type: getActivityType(activity.event),
      message: activity.title,
      details: activity.details,
      date: getTimeAgo(activity.createdAt)
    }))

    // Format pending reviews
    const formattedPendingReviews = pendingReviews.map(proposal => ({
      id: proposal.id,
      studentName: proposal.student.fullName,
      studentId: proposal.student.id,
      studentMatricNumber: proposal.student.matricNumber,
      title: proposal.title,
      submittedDate: proposal.submittedDate,
      timeAgo: getTimeAgo(proposal.submittedDate),
      status: proposal.status
    }))

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          pendingProposals,
          approvedProposals,
          totalProposals,
          topicsCount,
          totalInterests,
          studentsWithApprovedTopics,
          approvedPercentage
        },
        metrics: {
          averageReviewTime
        },
        recentActivity: formattedRecentActivity,
        pendingReviews: formattedPendingReviews,
        supervisorInfo: {
          id: auth.supervisor.id,
          fullName: auth.supervisor.fullName,
          email: auth.supervisor.email,
          department: auth.department?.name || 'Not Assigned',
          staffNumber: auth.supervisor.staffNumber
        }
      }
    })

  } catch (error) {
    console.error('[SUPERVISOR_DASHBOARD_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper function to get activity type
function getActivityType(event: string): 'approved' | 'rejected' | 'submitted' | 'reviewed' {
  const lowerEvent = event.toLowerCase()
  if (lowerEvent.includes('approve')) return 'approved'
  if (lowerEvent.includes('reject')) return 'rejected'
  if (lowerEvent.includes('submit')) return 'submitted'
  return 'reviewed'
}

// Helper function to get time ago string
function getTimeAgo(date: Date | null | undefined): string {
  if (!date) return 'Recently'
  
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes === 1) return '1 minute ago'
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours === 1) return '1 hour ago'
  if (diffInHours < 24) return `${diffInHours} hours ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return '1 day ago'
  if (diffInDays < 7) return `${diffInDays} days ago`
  
  return new Date(date).toLocaleDateString()
}