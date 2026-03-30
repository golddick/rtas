import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institutionId')

    if (!institutionId) {
      return NextResponse.json(
        { success: false, message: 'institutionId is required' },
        { status: 400 }
      )
    }

    const department = await db.department.findFirst({
      where: {
        code: code.toUpperCase(),
        institutionId
      },
      select: {
        id: true,
        name: true,
        code: true,
        faculty: true,
        institutionId: true,
      }
    })

    if (!department) {
      return NextResponse.json(
        { success: false, message: 'Department not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: department
    })

  } catch (error) {
    console.error('[DEPARTMENT_BY_CODE_GET]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}