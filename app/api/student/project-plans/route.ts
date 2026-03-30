// app/api/student/project-plans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from 'jsonwebtoken';
import { db } from "@/lib/db";
import { dropid } from "dropid";

// GET all project plans for the student
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [projectPlans, total] = await Promise.all([
      db.projectPlan.findMany({
        where: {
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
              dueDate: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.projectPlan.count({
        where: {
          studentId: decoded.id,
        },
      }),
    ]);

    const formattedPlans = projectPlans.map(plan => ({
      ...plan,
      startDate: plan.startDate?.toISOString() || null,
      endDate: plan.endDate?.toISOString() || null,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      milestones: plan.milestones.map(m => ({
        ...m,
        dueDate: m.dueDate?.toISOString() || null,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
      proposal: plan.proposal ? {
        id: plan.proposal.id,
        title: plan.proposal.title,
        status: plan.proposal.status,
        supervisor: plan.proposal.supervisor,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedPlans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[GET_PROJECT_PLANS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create a new project plan from approved proposal
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

    const { proposalId, duration } = await request.json();

    if (!proposalId) {
      return NextResponse.json(
        { success: false, message: 'Proposal ID is required' },
        { status: 400 }
      );
    }

    if (!duration || ![3, 6, 9, 12].includes(duration)) {
      return NextResponse.json(
        { success: false, message: 'Valid duration (3, 6, 9, or 12 months) is required' },
        { status: 400 }
      );
    }

    // Check if proposal exists and is approved
    const proposal = await db.proposal.findFirst({
      where: {
        id: proposalId,
        studentId: decoded.id,
        status: 'APPROVED',
      },
      include: {
        supervisor: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, message: 'No approved proposal found' },
        { status: 404 }
      );
    }

    // Check if project plan already exists for this proposal
    const existingPlan = await db.projectPlan.findFirst({
      where: {
        proposalId: proposal.id,
      },
    });

    if (existingPlan) {
      return NextResponse.json(
        { success: false, message: 'Project plan already exists for this proposal' },
        { status: 400 }
      );
    }

    // Calculate dates based on duration
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + duration);

    // Calculate milestone intervals
    const totalDays = duration * 30;
    const milestoneCount = 5;
    const intervalDays = totalDays / milestoneCount;

    const milestonesData = [
      { title: 'Literature Review', description: 'Complete comprehensive literature review' },
      { title: 'Data Collection', description: 'Gather and prepare research data' },
      { title: 'Implementation', description: 'Implement the proposed solution' },
      { title: 'Testing & Evaluation', description: 'Test and evaluate results' },
      { title: 'Final Report', description: 'Write final report and prepare presentation' },
    ];

    // Generate a unique ID for the project plan
    const projectPlanId = dropid('pjp');
    
    // Create project plan with milestones
    const projectPlan = await db.projectPlan.create({
      data: {
        id: projectPlanId,
        title: proposal.title,
        description: proposal.description,
        startDate,
        endDate,
        durationMonths: duration,
        status: 'DRAFT',
        studentId: decoded.id,
        proposalId: proposal.id,
        milestones: {
          create: milestonesData.map((milestone, index) => {
            const dueDate = new Date(startDate);
            dueDate.setDate(dueDate.getDate() + (intervalDays * (index + 1)));
            return {
              id: dropid('mik'),
              title: milestone.title,
              description: milestone.description,
              dueDate,
              status: 'PENDING',
              completion: 0,
              order: index + 1,
            };
          }),
        },
      },
      include: {
        milestones: {
          orderBy: {
            order: 'asc',
          },
        },
        proposal: {
          include: {
            supervisor: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

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
        proposal: projectPlan.proposal ? {
          id: projectPlan.proposal.id,
          title: projectPlan.proposal.title,
          status: projectPlan.proposal.status,
          supervisor: projectPlan.proposal.supervisor,
        } : null,
      },
    });
  } catch (error) {
    console.error('[CREATE_PROJECT_PLAN_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}