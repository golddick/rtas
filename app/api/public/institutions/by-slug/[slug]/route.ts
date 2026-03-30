import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    const institution = await db.institution.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
      }
    })

    if (!institution) {
      return NextResponse.json(
        { success: false, message: 'Institution not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: institution
    })

  } catch (error) {
    console.error('[INSTITUTION_BY_SLUG_GET]', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}