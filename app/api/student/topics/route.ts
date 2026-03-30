// app/api/student/topics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from 'jsonwebtoken';
import { db } from "@/lib/db";

// GET all research topics for students
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: string;
    };

    if (decoded.role !== 'STUDENT') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get student's department
    const student = await db.user.findUnique({
      where: { id: decoded.id },
      select: {
        departmentId: true,
        institutionId: true,
        supervisorId: true,
      }
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if student has a department
    if (!student.departmentId) {
      return NextResponse.json({
        success: true,
        data: [],
        filters: {
          categories: ['All'],
          difficulties: ['All', 'Beginner', 'Intermediate', 'Advanced'],
        },
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
      departmentId: student.departmentId,
      institutionId: student.institutionId,
    };

    // Filter by category
    if (category && category !== 'All') {
      where.category = category;
    }

    // Filter by difficulty
    if (difficulty && difficulty !== 'All') {
      where.difficulty = difficulty;
    }

    // Search by title, description, or keywords
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { keywords: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get topics with student interest count
    const [topics, total] = await Promise.all([
      db.researchTopic.findMany({
        where,
        include: {
          supervisor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              staffNumber: true,
            }
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            }
          },
          interests: {
            where: {
              studentId: decoded.id,
            },
            select: {
              id: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.researchTopic.count({ where }),
    ]);

    // Get all categories for filter
    const categoryResults = await db.researchTopic.findMany({
      where: {
        status: 'ACTIVE',
        departmentId: student.departmentId,
      },
      distinct: ['category'],
      select: {
        category: true,
      },
    });

    // Helper function to parse keywords safely
    const parseKeywords = (keywords: any): string[] => {
      if (!keywords) return [];
      
      // If it's already an array, return it
      if (Array.isArray(keywords)) return keywords;
      
      // If it's a string, try to parse as JSON
      if (typeof keywords === 'string') {
        try {
          // Try to parse as JSON array
          const parsed = JSON.parse(keywords);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          // If JSON parsing fails, treat as comma-separated string
          return keywords.split(',').map(k => k.trim()).filter(k => k);
        }
      }
      
      return [];
    };

    const formattedTopics = topics.map(topic => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      category: topic.category,
      difficulty: topic.difficulty,
      keywords: parseKeywords(topic.keywords),
      supervisor: {
        id: topic.supervisor.id,
        name: topic.supervisor.fullName,
        email: topic.supervisor.email,
        staffNumber: topic.supervisor.staffNumber,
      },
      department: topic.department,
      studentInterests: topic.studentInterests,
      isInterested: topic.interests.length > 0,
      status: topic.status,
      createdAt: topic.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: formattedTopics,
      filters: {
        categories: ['All', ...categoryResults.map(c => c.category).filter(Boolean)],
        difficulties: ['All', 'Beginner', 'Intermediate', 'Advanced'],
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('[GET_TOPICS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Express interest in a topic
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: string;
    };

    if (decoded.role !== 'STUDENT') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { topicId } = await request.json();

    if (!topicId) {
      return NextResponse.json(
        { success: false, message: 'Topic ID is required' },
        { status: 400 }
      );
    }

    // Check if topic exists
    const topic = await db.researchTopic.findUnique({
      where: { id: topicId },
      include: {
        interests: {
          where: {
            studentId: decoded.id,
          },
        },
      },
    });

    if (!topic) {
      return NextResponse.json(
        { success: false, message: 'Topic not found' },
        { status: 404 }
      );
    }

    // Check if already interested
    if (topic.interests.length > 0) {
      // Remove interest
      await db.topicInterest.delete({
        where: {
          id: topic.interests[0].id,
        },
      });

      await db.researchTopic.update({
        where: { id: topicId },
        data: {
          studentInterests: { decrement: 1 },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Interest removed successfully',
        interested: false,
      });
    } else {
      // Add interest
      await db.topicInterest.create({
        data: {
          topicId,
          studentId: decoded.id,
        },
      });

      await db.researchTopic.update({
        where: { id: topicId },
        data: {
          studentInterests: { increment: 1 },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Interest added successfully',
        interested: true,
      });
    }

  } catch (error) {
    console.error('[POST_TOPIC_INTEREST_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}