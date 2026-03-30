// app/api/hod/dashboard/route.ts
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

// GET /api/hod/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyHOD()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const departmentId = auth.department.id

    console.log('Fetching dashboard data for department:', departmentId)

    // Get all statistics in parallel
    const [
      totalStudents,
      activeSupervisors,
      totalProposals,
      approvedProposals,
      pendingProposals,
      rejectedProposals,
      underReviewProposals,
      revisionNeededProposals,
      recentProposals,
      topSupervisors,
      departmentInfo
    ] = await Promise.all([
      // Total students in department
      db.user.count({
        where: {
          role: 'STUDENT',
          departmentId: departmentId,
          status: 'ACTIVE'
        }
      }),
      
      // Active supervisors in department
      db.user.count({
        where: {
          role: 'SUPERVISOR',
          supervisorDepartmentId: departmentId,
          status: 'ACTIVE'
        }
      }),
      
      // Total proposals in department
      db.proposal.count({
        where: {
          departmentId: departmentId
        }
      }),
      
      // Approved proposals
      db.proposal.count({
        where: {
          departmentId: departmentId,
          status: 'APPROVED'
        }
      }),
      
      // Pending/Submitted proposals
      db.proposal.count({
        where: {
          departmentId: departmentId,
          status: 'SUBMITTED'
        }
      }),
      
      // Rejected proposals
      db.proposal.count({
        where: {
          departmentId: departmentId,
          status: 'REJECTED'
        }
      }),
      
      // Under review proposals
      db.proposal.count({
        where: {
          departmentId: departmentId,
          status: 'UNDER_REVIEW'
        }
      }),
      
      // Revision needed proposals
      db.proposal.count({
        where: {
          departmentId: departmentId,
          status: 'REVISION_REQUESTED'
        }
      }),
      
      // Recent proposals (last 5)
      db.proposal.findMany({
        where: {
          departmentId: departmentId
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
              email: true
            }
          }
        },
        orderBy: {
          submittedDate: 'desc'
        },
        take: 5
      }),
      
      // Top supervisors by number of supervised students
      db.user.findMany({
        where: {
          role: 'SUPERVISOR',
          supervisorDepartmentId: departmentId,
          status: 'ACTIVE'
        },
        include: {
          _count: {
            select: {
              supervisedStudents: true,
              supervisorProposals: true
            }
          }
        },
        orderBy: {
          supervisedStudents: {
            _count: 'desc'
          }
        },
        take: 5
      }),
      
      // Department information
      db.department.findUnique({
        where: {
          id: departmentId
        },
        select: {
          id: true,
          name: true,
          code: true,
          faculty: true,
          _count: {
            select: {
              students: true,
              supervisors:true,
              proposals: true
            }
          }
        }
      })
    ])

    // Calculate approval rate
    const approvalRate = totalProposals > 0 
      ? Math.round((approvedProposals / totalProposals) * 100)
      : 0

    // Calculate average review time (mock calculation - you can implement actual logic)
    const averageReviewTime = 3.2 // This would need actual calculation from database

    // Format recent proposals
    const formattedRecentProposals = recentProposals.map(proposal => ({
      id: proposal.id,
      title: proposal.title,
      studentName: proposal.student?.fullName || 'Unknown',
      supervisorName: proposal.supervisor?.fullName || 'Not Assigned',
      submittedDate: proposal.submittedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      status: proposal.status,
      timeAgo: getTimeAgo(proposal.submittedDate)
    }))

    // Format top supervisors
    const formattedTopSupervisors = topSupervisors.map(supervisor => ({
      id: supervisor.id,
      name: supervisor.fullName,
      email: supervisor.email,
      staffNumber: supervisor.staffNumber,
      studentsCount: supervisor._count.supervisedStudents,
      approvedTopics: supervisor._count.supervisorProposals
    }))

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          activeSupervisors,
          totalProposals,
          approvedProposals,
          pendingProposals: pendingProposals + underReviewProposals + revisionNeededProposals,
          rejectedProposals,
          underReviewProposals,
          revisionNeededProposals
        },
        metrics: {
          approvalRate,
          averageReviewTime
        },
        recentProposals: formattedRecentProposals,
        topSupervisors: formattedTopSupervisors,
        departmentInfo: {
          name: departmentInfo?.name,
          code: departmentInfo?.code,
          faculty: departmentInfo?.faculty,
          totalStudent: departmentInfo?._count.students,
          totalSupervisors: departmentInfo?._count.supervisors,
          totalProposals: departmentInfo?._count.proposals
        }
      }
    })

  } catch (error) {
    console.error('[HOD_DASHBOARD_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper function to get time ago string
function getTimeAgo(date: Date | null | undefined): string {
  if (!date) return 'Recently'
  
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours === 1) return '1 hour ago'
  if (diffInHours < 24) return `${diffInHours} hours ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return '1 day ago'
  if (diffInDays < 7) return `${diffInDays} days ago`
  
  return new Date(date).toLocaleDateString()
}