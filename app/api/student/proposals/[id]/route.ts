// app/api/student/proposals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from 'jsonwebtoken';
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
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

    // Get the proposal
    const proposal = await db.proposal.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            matricNumber: true,
          }
        },
        supervisor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        },
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

    if (!proposal) {
      return NextResponse.json(
        { success: false, message: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this proposal
    if (proposal.studentId !== decoded.id && decoded.role !== 'SUPERVISOR' && decoded.role !== 'HOD') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to view this proposal' },
        { status: 403 }
      );
    }

    // Format the response
    const formattedProposal = {
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      status: proposal.status,
      submittedDate: proposal.submittedDate,
      score: proposal.score,
      documentUrl: proposal.documentUrl,
      documentName: proposal.documentName,
      documentSize: proposal.documentSize,
      feedback: proposal.reviews[0]?.feedback || null,
      supervisorName: proposal.supervisor?.fullName,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: formattedProposal,
    });

  } catch (error) {
    console.error('[GET_PROPOSAL_BY_ID_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}