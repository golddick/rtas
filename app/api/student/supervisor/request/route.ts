// app/api/student/supervisor/request/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { sendDropAPIEmail } from '@/lib/email/email'


async function verifyStudent() {
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

    if (decoded.role !== 'STUDENT') {
      return { error: 'Only students can access this resource', status: 403 }
    }

    const student = await db.user.findUnique({
      where: { id: decoded.id },
      include: {
        department: {
          include: {
            institution: true,
            hod: true
          }
        },
        institution: true,
      }
    })

    if (!student) {
      return { error: 'Student not found', status: 404 }
    }

    return { student }
  } catch (error) {
    console.error('Verify error:', error)
    return { error: 'Invalid token', status: 401 }
  }
}

// POST /api/student/supervisor/request - Request a supervisor (no specific supervisor)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyStudent()
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      )
    }

    const { student } = auth
    const body = await request.json()
    const { researchInterests, message } = body

    if (!researchInterests?.trim()) {
      return NextResponse.json(
        { success: false, message: "Research interests are required" },
        { status: 400 }
      )
    }

    // Get HOD of the department
    const hod = student.department?.hod

    if (!hod) {
      return NextResponse.json(
        { success: false, message: "No HOD assigned to your department" },
        { status: 404 }
      )
    }

   

    // Send email to HOD
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Supervisor Request - ${student.department?.institution?.name || "RTAS"}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1F2937;
            margin: 0;
            padding: 0;
            background-color: #F3F4F6;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #FFFFFF;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid #E5E7EB;
          }
          .header {
            background-color: #3B82F6;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            color: #FFFFFF;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .info-box {
            background-color: #F9FAFB;
            border-left: 4px solid #3B82F6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-box p {
            margin: 5px 0;
            color: #374151;
          }
          .research-box {
            background-color: #EFF6FF;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .button {
            display: inline-block;
            background-color: #3B82F6;
            color: #FFFFFF;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #b01030;
          }
          .footer {
            text-align: center;
            padding: 20px;
            background-color: #F9FAFB;
            color: #6B7280;
            font-size: 12px;
            border-top: 1px solid #E5E7EB;
          }
          hr {
            border: none;
            border-top: 1px solid #E5E7EB;
            margin: 20px 0;
          }
          .text-muted {
            color: #6B7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Supervisor Request</h1>
          </div>
          
          <div class="content">
            <p>Dear <strong>${hod.fullName}</strong>,</p>
            
            <p>A student has requested a supervisor for their research project.</p>
            
            <div class="info-box">
              <p><strong>Student Name:</strong> ${student.fullName}</p>
              <p><strong>Student Email:</strong> ${student.email}</p>
              <p><strong>Program:</strong> ${student.program || "Not specified"}</p>
              <p><strong>Department:</strong> ${student.department?.name || "N/A"}</p>
            </div>
            
            <div class="research-box">
              <p><strong>📚 Research Interests:</strong></p>
              <p>${researchInterests}</p>
              ${message ? `<p><strong>💬 Additional Message:</strong></p><p>${message}</p>` : ""}
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${student.department?.institution?.slug}/${student.department?.code}/hod/supervisors" class="button">
                Review Request
              </a>
            </div>
            
            <hr />
            
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} RTAS</p>
            <p style="font-size: 11px;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to HOD using DropAPI
    const emailResult = await sendDropAPIEmail({
      to: hod.email,
      subject: `[RTAS] Supervisor Request from ${student.fullName}`,
      html: emailHtml,
      text: `
New Supervisor Request

Student: ${student.fullName}
Email: ${student.email}

Research Interests:
${researchInterests}

${message ? `Additional Message:\n${message}` : ""}

Please login to the HOD dashboard to review this request.
      `,
      metadata: {
        type: "supervisor_request",
        studentId: student.id,
      },
    });

    if (!emailResult.success) {
      console.error("Failed to send email to HOD:", emailResult.error);
    }

    // Create notification for HOD
    await db.notification.create({
      data: {
        userId: hod.id,
        title: "New Supervisor Request",
        message: `${student.fullName} has requested a supervisor. Research interests: ${researchInterests.substring(0, 100)}...`,
        type: "INFO",
      },
    });

    // Create user history record
    await db.userHistory.create({
      data: {
        userId: student.id,
        event: "SUPERVISOR_REQUEST",
        title: "Supervisor Request Submitted",
        details: `Research interests: ${researchInterests}`,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Supervisor request submitted successfully. The HOD has been notified.",
      data: { request: request },
    });
  } catch (error) {
    console.error("[SUPERVISOR_REQUEST_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}