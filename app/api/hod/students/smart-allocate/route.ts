import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { dropid } from 'dropid'

const smartAllocateSchema = z.object({
  studentIds: z.array(z.string()),
  preferences: z.object({
    supervisorId: z.string().optional(),
    departmentId: z.string().optional(),
  }).optional(),
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
    const parsed = smartAllocateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { 
          message: 'Validation error', 
          errors: parsed.error.errors 
        },
        { status: 400 }
      )
    }

    const { studentIds, preferences } = parsed.data

    // Get all available supervisors in the department with their department max capacity
    const supervisors = await db.user.findMany({
      where: {
        role: 'SUPERVISOR',
        supervisorDepartmentId: auth.department.id,
        status: 'ACTIVE',
      },
      include: {
        supervisorDepartment: {
          select: {
            maxStudents: true,
            name: true
          }
        },
        _count: {
          select: {
            supervisedStudents: true
          }
        }
      }
    })

    if (supervisors.length === 0) {
      return NextResponse.json(
        { message: 'No active supervisors available in the department' },
        { status: 409 }
      )
    }

    // Get the students to allocate
    const students = await db.user.findMany({
      where: {
        id: { in: studentIds },
        role: 'STUDENT',
        departmentId: auth.department.id,
        supervisorId: null
      }
    })

    if (students.length === 0) {
      return NextResponse.json(
        { message: 'No unassigned students found' },
        { status: 409 }
      )
    }

    // Calculate current loads with max capacity from department
    const supervisorLoads = supervisors.map(sup => ({
      id: sup.id,
      fullName: sup.fullName,
      currentCount: sup._count.supervisedStudents,
      maxCapacity: sup.supervisorDepartment?.maxStudents || 15,
    }))

    // Sort by current load (ascending) to prioritize less loaded supervisors
    const sortedSupervisors = [...supervisorLoads].sort((a, b) => a.currentCount - b.currentCount)

    // Allocate students using round-robin to balance load
    const allocations: { studentId: string; supervisorId: string }[] = []
    let supervisorIndex = 0

    for (const student of students) {
      // Find next supervisor with capacity
      let attempts = 0
      let allocated = false
      
      while (attempts < sortedSupervisors.length && !allocated) {
        const supervisor = sortedSupervisors[supervisorIndex % sortedSupervisors.length]
        if (supervisor.currentCount < supervisor.maxCapacity) {
          allocations.push({
            studentId: student.id,
            supervisorId: supervisor.id
          })
          supervisor.currentCount++
          allocated = true
        }
        supervisorIndex++
        attempts++
      }
      
      if (!allocated) {
        console.log(`Could not allocate student ${student.fullName} - no capacity left`)
      }
    }

    // Execute allocations in transaction
    const result = await db.$transaction(
      allocations.map(allocation => 
        db.user.update({
          where: { id: allocation.studentId },
          data: { supervisorId: allocation.supervisorId }
        })
      )
    )


    return NextResponse.json({
      success: true,
      message: `Successfully allocated ${result.length} students`,
      allocated: result.length,
      failed: students.length - result.length,
      allocationDetails: allocations.map(a => ({
        studentId: a.studentId,
        supervisorId: a.supervisorId
      }))
    })

  } catch (error) {
    console.error('[SMART_ALLOCATE_POST]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}