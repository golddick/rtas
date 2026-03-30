import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const institutions = await db.institution.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: institutions
    })

  } catch (error) {
    console.error('[PUBLIC_INSTITUTIONS_GET]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}