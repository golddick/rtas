// app/api/student/project-plans/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from 'jsonwebtoken';
import { db } from "@/lib/db";

// GET a single project plan
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

     const { id } = await params

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

    const projectPlan = await db.projectPlan.findFirst({
      where: {
        id: id,
        studentId: decoded.id,
      },
      include: {
        proposal: {
          include: {
            supervisor: {
              select: {
                fullName: true,
              },
            },
          },
        },
        milestones: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!projectPlan) {
      return NextResponse.json(
        { success: false, message: 'Project plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...projectPlan,
        startDate: projectPlan.startDate?.toISOString() || null,
        endDate: projectPlan.endDate?.toISOString() || null,
        createdAt: projectPlan.createdAt.toISOString(),
        updatedAt: projectPlan.updatedAt.toISOString(),
        milestones: projectPlan.milestones.map(m => ({
          ...m,
          dueDate: m.dueDate?.toISOString() || null,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('[GET_PROJECT_PLAN_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH update a project plan
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

     const { id } = await params

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

    const data = await request.json();

    const updatedPlan = await db.projectPlan.updateMany({
      where: {
        id: id,
        studentId: decoded.id,
      },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
      },
    });

    if (updatedPlan.count === 0) {
      return NextResponse.json(
        { success: false, message: 'Project plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Project plan updated successfully',
    });
  } catch (error) {
    console.error('[UPDATE_PROJECT_PLAN_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE a project plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

     const { id } = await params

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

    const deleted = await db.projectPlan.deleteMany({
      where: {
        id: id,
        studentId: decoded.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, message: 'Project plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Project plan deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE_PROJECT_PLAN_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}