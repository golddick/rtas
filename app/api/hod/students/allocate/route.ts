import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { dropid } from 'dropid'

const allocateSchema = z.object({
  studentIds: z.array(z.string()),
  supervisorId: z.string(),
})

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

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyHOD()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const parsed = allocateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { 
          message: 'Validation error', 
          errors: parsed.error.errors 
        },
        { status: 400 }
      )
    }

    const { studentIds, supervisorId } = parsed.data

    // Verify supervisor exists and belongs to the same department
    const supervisor = await db.user.findFirst({
      where: {
        id: supervisorId,
        role: 'SUPERVISOR',
        supervisorDepartmentId: auth.department.id,
      },
      include: {
        supervisorDepartment: {
          select: {
            maxStudents: true,
            name: true
          }
        }
      }
    })

    if (!supervisor) {
      return NextResponse.json(
        { message: 'Supervisor not found or not in your department' },
        { status: 404 }
      )
    }

    // Get current student count for supervisor
    const currentCount = await db.user.count({
      where: {
        supervisorId: supervisorId
      }
    })

    // Get max capacity from department
    const maxCapacity = supervisor.supervisorDepartment?.maxStudents || 15

    // Check capacity
    if (currentCount + studentIds.length > maxCapacity) {
      return NextResponse.json(
        { 
          message: `Supervisor would exceed maximum capacity of ${maxCapacity} students`,
          currentCount,
          maxCapacity,
          remaining: maxCapacity - currentCount,
          requested: studentIds.length
        },
        { status: 409 }
      )
    }

    // Verify all students exist and are unassigned
    const students = await db.user.findMany({
      where: {
        id: { in: studentIds },
        role: 'STUDENT',
        departmentId: auth.department.id,
        supervisorId: null // Ensure they're unassigned
      }
    })

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { 
          message: 'Some students are already assigned or not found',
          found: students.length,
          requested: studentIds.length
        },
        { status: 409 }
      )
    }

    // Update all students
    await db.$transaction(
      students.map(student => 
        db.user.update({
          where: { id: student.id },
          data: { supervisorId }
        })
      )
    )

    return NextResponse.json({
      success: true,
      message: `Successfully allocated ${students.length} students to ${supervisor.fullName}`,
      allocated: students.length
    })

  } catch (error) {
    console.error('[ALLOCATE_SUPERVISOR_POST]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}