import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Find admin by email
    const admin = await db.admin.findUnique({
      where: { email }
    });

    if (!admin) {
      return NextResponse.json(
        { message: "Admin not found" },
        { status: 404 }
      );
    }

    // Update email verification status
    const updatedAdmin = await db.admin.update({
      where: { id: admin.id },
      data: { 
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    // Log the action
    await db.adminAction.create({
      data: {
        adminId: admin.id,
        actionType: 'UPDATE',
        description: 'Email verified successfully',
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
      admin: {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        isEmailVerified: updatedAdmin.isEmailVerified
      }
    });

  } catch (error) {
    console.error("[VERIFY_EMAIL_ERROR]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}