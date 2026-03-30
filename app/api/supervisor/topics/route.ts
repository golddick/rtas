// app/api/supervisor/topics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

async function verifySupervisor() {
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

    if (decoded.role !== 'SUPERVISOR') {
      return { error: 'Only supervisors can access this resource', status: 403 }
    }

    const supervisor = await db.user.findUnique({
      where: { id: decoded.id },
      include: {
        supervisorDepartment: true,
        institution: true
      }
    })

    if (!supervisor) {
      return { error: 'Supervisor not found', status: 404 }
    }

    return { supervisor, department: supervisor.supervisorDepartment, institution: supervisor.institution }
  } catch (error) {
    console.error('Verify error:', error)
    return { error: 'Invalid token', status: 401 }
  }
}

// GET /api/supervisor/topics - Get all topics created by supervisor
export async function GET(request: NextRequest) {
  try {
    const auth = await verifySupervisor()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      supervisorId: auth.supervisor.id,
      institutionId: auth.institution?.id
    }

    if (status && status !== 'all' && status !== 'undefined') {
      where.status = status
    }

    if (category && category !== 'all' && category !== 'undefined') {
      where.category = category
    }

    if (search && search !== 'null' && search !== 'undefined' && search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { keywords: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const total = await db.researchTopic.count({ where })

    // Get topics
    const topics = await db.researchTopic.findMany({
      where,
      include: {
        interests: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                email: true,
                matricNumber: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Format response
    const formattedTopics = topics.map(topic => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      category: topic.category,
      keywords: topic.keywords,
      difficulty: topic.difficulty,
      status: topic.status,
      studentInterests: topic.studentInterests,
      interests: topic.interests.map(interest => ({
        id: interest.id,
        studentId: interest.studentId,
        studentName: interest.student.fullName,
        studentEmail: interest.student.email,
        studentMatricNumber: interest.student.matricNumber,
        interestedAt: interest.interestedAt
      })),
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: formattedTopics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('[SUPERVISOR_TOPICS_GET]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/supervisor/topics - Create new research topic
export async function POST(request: NextRequest) {
  try {
    const auth = await verifySupervisor()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const { title, description, category, keywords, difficulty } = body

    if (!title || !description || !category) {
      return NextResponse.json(
        { message: 'Title, description, and category are required' },
        { status: 400 }
      )
    }

    // Create topic
    const topic = await db.researchTopic.create({
      data: {
        id: `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        description,
        category,
        keywords: keywords || '',
        difficulty: difficulty || 'Intermediate',
        status: 'ACTIVE',
        supervisorId: auth.supervisor.id,
        departmentId: auth.department?.id || '',
        institutionId: auth.institution?.id || ''
      }
    })

    return NextResponse.json({
      success: true,
      data: topic,
      message: 'Topic created successfully'
    })

  } catch (error) {
    console.error('[SUPERVISOR_TOPICS_POST]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT /api/supervisor/topics - Update research topic
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifySupervisor()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const { id, title, description, category, keywords, difficulty, status } = body

    if (!id) {
      return NextResponse.json(
        { message: 'Topic ID is required' },
        { status: 400 }
      )
    }

    // Verify topic belongs to supervisor
    const existingTopic = await db.researchTopic.findFirst({
      where: {
        id,
        supervisorId: auth.supervisor.id
      }
    })

    if (!existingTopic) {
      return NextResponse.json(
        { message: 'Topic not found or not owned by you' },
        { status: 404 }
      )
    }

    // Update topic
    const updatedTopic = await db.researchTopic.update({
      where: { id },
      data: {
        title: title || existingTopic.title,
        description: description || existingTopic.description,
        category: category || existingTopic.category,
        keywords: keywords !== undefined ? keywords : existingTopic.keywords,
        difficulty: difficulty || existingTopic.difficulty,
        status: status || existingTopic.status
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedTopic,
      message: 'Topic updated successfully'
    })

  } catch (error) {
    console.error('[SUPERVISOR_TOPICS_PUT]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/supervisor/topics - Delete research topic
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifySupervisor()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { message: 'Topic ID is required' },
        { status: 400 }
      )
    }

    // Verify topic belongs to supervisor
    const existingTopic = await db.researchTopic.findFirst({
      where: {
        id,
        supervisorId: auth.supervisor.id
      }
    })

    if (!existingTopic) {
      return NextResponse.json(
        { message: 'Topic not found or not owned by you' },
        { status: 404 }
      )
    }

    // Delete topic (cascade will delete interests)
    await db.researchTopic.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Topic deleted successfully'
    })

  } catch (error) {
    console.error('[SUPERVISOR_TOPICS_DELETE]', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}