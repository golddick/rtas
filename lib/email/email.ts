



// lib/dropapi/email.ts
import { NextRequest } from 'next/server'

interface SendEmailParams {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  html: string
  text?: string
  fromName?: string
  replyTo?: string
  headers?: Record<string, string>
  metadata?: Record<string, any>
}

interface SendEmailResponse {
  success: boolean
  data?: {
    id: string
    messageId: string
    status: string
  }
  error?: string
}

const DROPAPI_BASE = process.env.NEXT_PUBLIC_DROPAPHI_URL || 'https://dropaphi.vercel.app/api/v1'
const DROPAPI_KEY = process.env.DROPAPHI_API_KEY || 'da_test__dtHFb0DfG'

export async function sendDropAPIEmail({
  to,
  cc,
  bcc,
  subject,
  html,
  text,
  fromName = 'RTAS',
  replyTo,
  headers,
  metadata = {},
}: SendEmailParams): Promise<SendEmailResponse> {
  try {
    const response = await fetch(`${DROPAPI_BASE}/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': DROPAPI_KEY,
      },
      body: JSON.stringify({
        to,
        cc,
        bcc,
        subject,
        html,
        text,
        fromName,
        replyTo,
        headers,
        metadata: {
          ...metadata,
          source: 'rtas-admin',
        },
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('[DROPAPI_EMAIL_ERROR]', result)
      return {
        success: false,
        error: result.error || result.message || 'Failed to send email',
      }
    }

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    console.error('[DROPAPI_EMAIL_EXCEPTION]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending email',
    }
  }
}

// Convenience function for sending HOD invitations
export async function sendHODInviteEmail({
  email,
  code,
  departmentName,
  institutionName,
  departmentId,
  inviterName,
  tempPassword,
  hodFullName,
}: {
  email: string
  departmentName: string
  code: string
  institutionName: string
  departmentId: string
  inviterName: string
  tempPassword?: string
  hodFullName?: string
}) {
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${code}`
  
  const loginDetails = tempPassword ? `
    <div style="background-color: #EFF6FF; border: 1px solid #3B82F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #1F2937; font-weight: 600;">Your Login Credentials</h3>
      <p style="margin: 5px 0; color: #374151;"><strong style="color: #1F2937;">Email:</strong> ${email}</p>
      <p style="margin: 5px 0; color: #374151;"><strong style="color: #1F2937;">Temporary Password:</strong> <code style="background-color: #FFFFFF; color: #1F2937; padding: 4px 8px; border-radius: 4px; font-size: 14px; border: 1px solid #D1D5DB;">${tempPassword}</code></p>
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #6B7280;">Please change your password after first login.</p>
    </div>
  ` : ''

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HOD Invitation - ${institutionName}</title>
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
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          color: #FFFFFF;
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
          background: #FFFFFF;
        }
        .button {
          display: inline-block;
          background-color: #3B82F6;
          color: #FFFFFF;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
          border: none;
        }
        .button:hover {
          background-color: #2563EB;
        }
        .footer {
          text-align: center;
          padding: 30px;
          background-color: #F9FAFB;
          color: #6B7280;
          font-size: 12px;
          border-top: 1px solid #E5E7EB;
        }
        .info-box {
          background-color: #F9FAFB;
          border-left: 4px solid #3B82F6;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box p {
          color: #374151;
        }
        ul {
          color: #374151;
          padding-left: 20px;
        }
        li {
          margin-bottom: 8px;
          color: #4B5563;
        }
        .text-muted {
          color: #6B7280;
        }
        .text-primary {
          color: #3B82F6;
        }
        hr {
          border: none;
          border-top: 1px solid #E5E7EB;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Head of Department Invitation</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 16px; color: #1F2937;">Dear ${hodFullName || email},</p>
          
          <p style="color: #374151;"><strong style="color: #1F2937;">${inviterName}</strong> has invited you to become the <strong style="color: #1F2937;">Head of Department</strong> for:</p>
          
          <div class="info-box">
            <p style="margin:0; font-size:16px; color: #1F2937;"><strong>Department:</strong> ${departmentName}</p>
            <p style="margin:10px 0 0 0; font-size:16px; color: #1F2937;"><strong>Institution:</strong> ${institutionName}</p>
          </div>
          
          ${loginDetails}
          
          <div style="text-align: center;">
            <a href="${acceptUrl}" class="button">Accept Invitation & Login</a>
          </div>
          
          <hr />
          
          <p style="font-size: 14px; color: #6B7280; text-align: center; margin-top: 20px;">
            This invitation will expire in 7 days.
          </p>
          
          <p style="font-size: 14px; color: #6B7280; text-align: center;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">© ${new Date().getFullYear()} ${institutionName}. All rights reserved.</p>
          <p style="margin: 10px 0 0 0; font-size: 11px; color: #9CA3AF;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
HOD Invitation - ${institutionName}

Dear ${hodFullName || email},

${inviterName} has invited you to become the Head of Department for:

Department: ${departmentName}
Institution: ${institutionName}

${tempPassword ? `
LOGIN CREDENTIALS:
Email: ${email}
Temporary Password: ${tempPassword}
` : ''}

Accept the invitation here: ${acceptUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} ${institutionName}. All rights reserved.
  `

  return sendDropAPIEmail({
    to: email,
    subject: `HOD Invitation: ${departmentName} - ${institutionName}`,
    html,
    text,
    fromName: institutionName,
    metadata: {
      type: 'hod_invitation',
      departmentId,
      departmentName,
      institutionName,
    },
  })
}

// Convenience function for sending welcome emails
export async function sendWelcomeEmail({
  email,
  fullName,
  role,
  institutionName,
}: {
  email: string
  fullName: string
  role: string
  institutionName: string
}) {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${institutionName}</title>
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
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
          background: #FFFFFF;
        }
        .button {
          display: inline-block;
          background-color: #3B82F6;
          color: #FFFFFF;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
          border: none;
        }
        .button:hover {
          background-color: #2563EB;
        }
        .footer {
          text-align: center;
          padding: 30px;
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${institutionName}!</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 16px; color: #1F2937;">Hello ${fullName},</p>
          
          <p style="color: #374151;">Your account has been created as <strong style="color: #1F2937;">${role}</strong>. You can now log in to access your dashboard.</p>
          
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Log In Now</a>
          </div>
          
          <hr />
          
          <p style="font-size: 14px; color: #6B7280; text-align: center;">
            If you didn't create this account, please contact your system administrator.
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">© ${new Date().getFullYear()} ${institutionName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendDropAPIEmail({
    to: email,
    subject: `Welcome to ${institutionName}`,
    html,
    fromName: institutionName,
    metadata: {
      type: 'welcome',
      role,
    },
  })
}