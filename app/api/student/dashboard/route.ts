// app/api/student/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from 'jsonwebtoken';
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: string;
    };

    // Get user with all relations
    const user = await db.user.findUnique({
      where: { id: decoded.id },
      include: {
        institution: true,
        department: true,
        supervisor: {
          include: {
            institution: true,
            supervisorDepartment: true,
          }
        }
      }
    });

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get student's latest proposal
    const latestProposal = await db.proposal.findFirst({
      where: {
        studentId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        submittedDate: true,
        score: true,
        documentUrl: true,
        reviews: {
          select: {
            feedback: true,
            rating: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        }
      }
    });

    // Get unread messages count
    const unreadMessagesCount = await db.message.count({
      where: {
        receiverId: user.id,
        isRead: false,
      }
    });

    // Get recent messages as activities
    const recentMessages = await db.message.findMany({
      where: {
        OR: [
          { receiverId: user.id },
          { senderId: user.id }
        ]
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      include: {
        sender: {
          select: {
            fullName: true,
            role: true,
          }
        },
        receiver: {
          select: {
            fullName: true,
            role: true,
          }
        }
      }
    });

    // Get user history
    const userHistory = await db.userHistory.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Combine messages and history for recent activities
    const recentActivities = [
      ...recentMessages.map(msg => ({
        type: 'message',
        message: msg.senderId === user.id 
          ? `You sent a message to ${msg.receiver.fullName}`
          : `${msg.sender.fullName} sent you a message`,
        date: msg.createdAt,
      })),
      ...userHistory.map(history => ({
        type: history.event?.toLowerCase() || 'activity',
        message: history.title,
        date: history.date || history.createdAt,
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
     .slice(0, 5);

    // Calculate days since last proposal submission
    let daysSinceSubmission = null;
    if (latestProposal?.submittedDate) {
      const submittedDate = new Date(latestProposal.submittedDate);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate.getTime() - submittedDate.getTime());
      daysSinceSubmission = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Prepare dashboard data
    const dashboardData = {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        matricNumber: user.matricNumber,
        program: user.program,
      },
      institution: user.institution ? {
        id: user.institution.id,
        name: user.institution.name,
        slug: user.institution.slug,
      } : null,
      department: user.department ? {
        id: user.department.id,
        name: user.department.name,
        code: user.department.code,
      } : null,
      supervisor: user.supervisor ? {
        id: user.supervisor.id,
        fullName: user.supervisor.fullName,
        email: user.supervisor.email,
        staffNumber: user.supervisor.staffNumber,
        department: user.supervisor.supervisorDepartment?.name,
      } : null,
      currentProposal: latestProposal ? {
        id: latestProposal.id,
        title: latestProposal.title,
        description: latestProposal.description,
        status: latestProposal.status,
        submittedAt: latestProposal.submittedDate,
        createdAt: latestProposal.createdAt,
        score: latestProposal.score,
        feedback: latestProposal.reviews[0]?.feedback || null,
        documentUrl: latestProposal.documentUrl,
      } : null,
      stats: {
        proposalStatus: latestProposal?.status || 'No Proposal',
        daysSinceSubmission: daysSinceSubmission,
        unreadMessages: unreadMessagesCount,
        hasSupervisor: !!user.supervisor,
      },
      recentActivities: recentActivities.map(activity => ({
        type: activity.type,
        message: activity.message,
        date: activity.date,
      })),
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });

  } catch (error) {
    console.error('[STUDENT_DASHBOARD_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}