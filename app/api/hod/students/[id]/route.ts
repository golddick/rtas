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

    if (decoded.role !== 'HOD') {
      return { error: 'Only HOD can access this resource', status: 403 }
    }

    const hod = await db.user.findUnique({
      where: { id: decoded.id },
      include: {
        department: true
      }
    })

    if (!hod || !hod.department) {
      return { error: 'HOD not found or no department assigned', status: 404 }
    }

    return { hod, department: hod.department }
  } catch (error) {
    return { error: 'Invalid token', status: 401 }
  }
}

// GET /api/hod/students/[id] - Get single student
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyHOD()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { id } = params

    const student = await db.user.findFirst({
      where: {
        id,
        role: 'STUDENT',
        departmentId: auth.department.id, // Ensure student belongs to HOD's department
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
            slug: true,
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            faculty: true,
          }
        },
        supervisor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            staffNumber: true,
          }
        },
        studentProposals: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            score: true,
            submittedDate: true,
            reviewDate: true,
            approvedDate: true,
            reviews: {
              select: {
                feedback: true,
                rating: true,
                reviewer: {
                  select: {
                    fullName: true,
                  }
                }
              }
            }
          }
        },
        projectPlans: {
          include: {
            milestones: true
          }
        },
        history: {
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { message: 'Student not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: student
    })

  } catch (error) {
    console.error('[HOD_STUDENT_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}