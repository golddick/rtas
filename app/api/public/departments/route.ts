import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institutionId')

   const whereClause: any = {}

    if (institutionId) {
      whereClause.institutionId = institutionId
    }

    const departments = await db.department.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        code: true,
        institutionId: true,
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: departments
    })

  } catch (error) {
    console.error('[PUBLIC_DEPARTMENTS_GET]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}