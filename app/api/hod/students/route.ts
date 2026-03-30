// app/api/hod/students/route.ts
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

// GET /api/hod/students - Get all students in HOD's department
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
    const departmentId = searchParams.get('departmentId')
    const status = searchParams.get('status')
    const supervisorId = searchParams.get('supervisorId')
    const proposalStatus = searchParams.get('proposalStatus')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    console.log('Request params:', { departmentId, status, supervisorId, proposalStatus, search })

    // Use the department ID from the query param or from the HOD's department
    const targetDepartmentId = departmentId || auth.department.id

    console.log(targetDepartmentId, 'api s d')

    // Build where clause - only students in the specified department
    const where: any = {
      role: 'STUDENT',
      departmentId: targetDepartmentId
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (supervisorId) {
      if (supervisorId === 'unassigned') {
        where.supervisorId = null
      } else {
        where.supervisorId = supervisorId
      }
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { matricNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    console.log('Where clause:', where)

    // Get total count
    const total = await db.user.count({ where })

    // Get students with their relations
    const students = await db.user.findMany({
      where,
      orderBy: { fullName: 'asc' },
      skip,
      take: limit,
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
          take: 1,
          select: {
            id: true,
            title: true,
            status: true,
            submittedDate: true,
          }
        },
        projectPlans: {
          where: { status: 'ACTIVE' },
          take: 1,
          select: {
            id: true,
            status: true,
          }
        }
      }
    })

    console.log(`Found ${students.length} students`)

    // Format response
    const formatted = students.map(student => ({
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      matricNumber: student.matricNumber,
      phone: student.phone,
      program: student.program,
      status: student.status,
      avatar: student.avatar,
      departmentId: student.departmentId,
      department: student.department,
      institutionId: student.institutionId,
      institution: student.institution,
      supervisorId: student.supervisorId,
      supervisor: student.supervisor,
      proposal: student.studentProposals[0] || null,
      proposalStatus: student.studentProposals[0]?.status || 'No Proposal',
      projectPlan: student.projectPlans[0] || null,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    }))

    // Add proposal status filter after fetching (for filtering by proposal status)
    const filtered = proposalStatus && proposalStatus !== 'all'
      ? formatted.filter(s => s.proposalStatus === proposalStatus)
      : formatted

    return NextResponse.json({
      success: true,
      data: filtered,
      pagination: {
        page,
        limit,
        total: filtered.length,
        pages: Math.ceil(filtered.length / limit)
      }
    })

  } catch (error) {
    console.error('[HOD_STUDENTS_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


