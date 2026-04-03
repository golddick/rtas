import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { sendOTP } from "@/lib/otp/client";
import { dropid } from "dropid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, password, department, phoneNumber, adminCode } = body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Full name, email and password are required" 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Password must contain at least one uppercase letter and one number" 
        },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const existingAdmin = await db.admin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin with this email already exists" },
        { status: 409 }
      );
    }

    // Validate admin code if provided
    let invitationData = null;
    if (adminCode) {
      invitationData = await db.adminInvitation.findUnique({
        where: { 
          code: adminCode,
          usedAt: null,
          expiresAt: { gt: new Date() }
        }
      });

      if (!invitationData) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired admin registration code" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    let createdAdmin = null;

    try {
      // Create admin in a transaction
      const result = await db.$transaction(async (tx) => {
        // Create admin with email NOT verified
        const admin = await tx.admin.create({
          data: {
            id: dropid("adm"),
            fullName,
            email,
            passwordHash: hashedPassword,
            department: department || null,
            phoneNumber: phoneNumber || null,
            role: invitationData?.role || 'ADMIN',
            isEmailVerified: false, // Email not verified yet
          }
        });

        // Mark invitation as used if provided
        if (invitationData) {
          await tx.adminInvitation.update({
            where: { code: adminCode },
            data: { 
              usedAt: new Date(),
            }
          });
        }

        // Log the action
        await tx.adminAction.create({
          data: {
            id: dropid("act"),
            adminId: admin.id,
            actionType: 'CREATE',
            description: 'Admin account created - email verification pending',
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
          }
        }); 

        return admin;
      });

      createdAdmin = result;
    } catch (dbError) {
      console.error("[DB_TRANSACTION_ERROR]", dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to create admin account",
          message: dbError instanceof Error ? dbError.message : "Database error"
        },
        { status: 500 }
      );
    }

    // ✅ Call reusable OTP function from your OTP client
    const otpResult = await sendOTP({
      email,
      brandName: "RTAS",
      expiry: 10, // 10 minutes
      length: 6,
      metadata: {
        purpose: "verify_email",
        userId: createdAdmin.id,
        fullName: createdAdmin.fullName,
      },
    });

    if (!otpResult.success) {
      // Log the OTP failure
      await db.adminAction.create({
        data: {
          id: dropid("act"),
          adminId: createdAdmin.id,
          actionType: 'SYSTEM_CONFIG',
          description: `OTP sending failed: ${otpResult.error}. Deleting admin account.`,
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
        }
      });

      // Delete the admin account since OTP failed
      await db.admin.delete({
        where: {
          id: createdAdmin.id
        }
      });

      return NextResponse.json(
        {
          success: false,
          error: "Account created but verification email failed. Please try again.",
          message: "We couldn't send the verification code. Your account has been rolled back.",
        },
        { status: 500 }
      );
    }

    // Remove sensitive data
    const { passwordHash, ...adminWithoutSensitive } = createdAdmin;

    return NextResponse.json(
      {
        success: true,
        message: "Signup successful. Verification code sent to your email.",
        data: {
          admin: adminWithoutSensitive,
          email: createdAdmin.email,
          otpId: otpResult.data?.id,
          expiresAt: otpResult.data?.expiresAt,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("[ADMIN_SIGNUP_ERROR]", error);

    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}