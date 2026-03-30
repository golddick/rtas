// app/api/student/project-plans/[id]/milestones/[milestoneId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from 'jsonwebtoken';
import { db } from "@/lib/db";

// PATCH update a milestone
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; milestoneId: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    const { id, milestoneId } = await params


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

    // Verify the project plan belongs to the student
    const projectPlan = await db.projectPlan.findFirst({
      where: {
        id: id,
        studentId: decoded.id,
      },
    });

    if (!projectPlan) {
      return NextResponse.json(
        { success: false, message: 'Project plan not found' },
        { status: 404 }
      );
    }

    // Update the milestone
    const updatedMilestone = await db.milestone.update({
      where: {
        id: milestoneId,
      },
      data: {
        status: data.status,
        completion: data.completion,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedMilestone,
        dueDate: updatedMilestone.dueDate?.toISOString() || null,
        createdAt: updatedMilestone.createdAt.toISOString(),
        updatedAt: updatedMilestone.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[UPDATE_MILESTONE_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}