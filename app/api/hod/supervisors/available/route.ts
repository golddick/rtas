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
    console.error('Verify error:', error)
    return { error: 'Invalid token', status: 401 }
  }
}

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

    // If departmentId is provided, use it; otherwise use HOD's department
    const targetDepartmentId = departmentId || auth.department.id

    console.log('Target department ID:', targetDepartmentId)

    // Get all active supervisors in the department
    const supervisors = await db.user.findMany({
      where: {
        role: 'SUPERVISOR',
        supervisorDepartmentId: targetDepartmentId, // Use the correct field
        status: 'ACTIVE',
      },
      include: {
        supervisorDepartment: { // THIS IS THE CORRECT RELATION NAME
          select: {
            id: true,
            name: true,
            code: true,
            faculty: true,
            maxStudents: true
          }
        },
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
            slug: true,
          }
        },
        _count: {
          select: {
            supervisedStudents: true,
            supervisorProposals: true,
          }
        }
      },
      orderBy: { fullName: 'asc' }
    })

    console.log('Supervisors found:', supervisors.length)
    console.log('First supervisor:', supervisors[0] ? {
      id: supervisors[0].id,
      name: supervisors[0].fullName,
      department: supervisors[0].supervisorDepartment
    } : 'No supervisors')

    // Format the response - use supervisorDepartment relation
    const formatted = supervisors.map(sup => ({
      id: sup.id,
      fullName: sup.fullName,
      email: sup.email,
      phone: sup.phone,
      staffNumber: sup.staffNumber,
      faculty: sup.supervisorDepartment?.faculty || 'General',
      status: sup.status,
      departmentId: sup.supervisorDepartmentId,
      department: sup.supervisorDepartment, // Use the correct relation
      institutionId: sup.institutionId,
      institution: sup.institution,
      studentCount: sup._count.supervisedStudents,
      approvedTopics: sup._count.supervisorProposals,
      maxCapacity: sup.supervisorDepartment?.maxStudents || 15,
      createdAt: sup.createdAt,
      updatedAt: sup.updatedAt,
    }))

    console.log(`Formatted ${formatted.length} supervisors`)

    return NextResponse.json({
      success: true,
      data: formatted,
    })

  } catch (error) {
    console.error('[AVAILABLE_SUPERVISORS_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
