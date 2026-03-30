import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { dropid } from 'dropid'
import bcrypt from 'bcryptjs'
import csv from 'csv-parser'
import { Readable } from 'stream'

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

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyHOD()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const departmentId = formData.get('departmentId') as string
    const institutionId = formData.get('institutionId') as string

    if (!file || !departmentId || !institutionId) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify department matches HOD's department
    if (departmentId !== auth.department.id) {
      return NextResponse.json(
        { message: 'You can only import students to your own department' },
        { status: 403 }
      )
    }

    // Read CSV file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const results: any[] = []

    await new Promise((resolve, reject) => {
      const readable = Readable.from(buffer.toString())
      readable
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject)
    })

    let successCount = 0
    let failedCount = 0
    const errors: string[] = []

    // Process each row
    for (const row of results) {
      try {
        // Validate required fields
        if (!row.fullName || !row.email || !row.matricNumber) {
          failedCount++
          errors.push(`Row ${successCount + failedCount}: Missing required fields`)
          continue
        }

        // Validate program if provided
        const program = row.program?.toUpperCase()
        if (program && !['BSC', 'MSC', 'PHD'].includes(program)) {
          failedCount++
          errors.push(`Row ${successCount + failedCount}: Invalid program. Must be BSC, MSC, or PHD`)
          continue
        }

        // Check if user exists
        const existingUser = await db.user.findUnique({
          where: { email: row.email }
        })

        if (existingUser) {
          failedCount++
          errors.push(`Row ${successCount + failedCount}: Email ${row.email} already exists`)
          continue
        }

        // Check matric number
        const existingMatric = await db.user.findUnique({
          where: { matricNumber: row.matricNumber }
        })

        if (existingMatric) {
          failedCount++
          errors.push(`Row ${successCount + failedCount}: Matric number ${row.matricNumber} already exists`)
          continue
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'
        const hashedPassword = await bcrypt.hash(tempPassword, 10)

        // Create student
        await db.user.create({
          data: {
            id: dropid('user'),
            email: row.email,
            registrationEmail: row.email,
            fullName: row.fullName,
            password: hashedPassword,
            role: 'STUDENT',
            phone: row.phone || null,
            matricNumber: row.matricNumber,
            program: program || null,
            institutionId,
            departmentId,
            status: 'ACTIVE',
            emailVerified: true,
          }
        })

        successCount++
      } catch (error) {
        failedCount++
        errors.push(`Row ${successCount + failedCount}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Log action
    await db.adminAction.create({
      data: {
        id: dropid('act'),
        adminId: auth.hod.id,
        actionType: 'CREATE',
        description: `Imported ${successCount} students (${failedCount} failed)`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: `Imported ${successCount} students successfully`,
      successCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error) {
    console.error('[IMPORT_STUDENTS_ERROR]', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}