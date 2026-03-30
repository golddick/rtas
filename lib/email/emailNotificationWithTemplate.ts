// lib/dropapi/email.ts
import { NextRequest } from 'next/server'

interface SendEmailParams {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  html?: string
  text?: string
  fromName?: string
  replyTo?: string
  headers?: Record<string, string>
  metadata?: Record<string, any>
  template?: string  // Add template support
  templateData?: Record<string, any>  // Add template data support
  brandName?: string  // Add brand name support
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

const DROPAPI_BASE = process.env.NEXT_PUBLIC_DROPAPHI_URL || 'http://localhost:3001/api/v1'
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
  template,
  templateData,
  brandName,
}: SendEmailParams): Promise<SendEmailResponse> {
  try {
    // Build the request body
    const requestBody: any = {
      to,
      cc,
      bcc,
      subject,
      fromName,
      replyTo,
      headers,
      metadata: {
        ...metadata,
        source: 'rtas-admin',
      },
    }

    // If template is provided, use it
    if (template) {
      requestBody.template = template
      if (templateData) {
        requestBody.templateData = templateData
      }
      if (brandName) {
        requestBody.brandName = brandName
      }
    } else {
      // Otherwise use html/text
      if (html) requestBody.html = html
      if (text) requestBody.text = text
    }

    const response = await fetch(`${DROPAPI_BASE}/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': DROPAPI_KEY,
      },
      body: JSON.stringify(requestBody),
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

// Convenience function for sending proposal notification emails
export async function sendProposalNotificationEmail({
  to,
  studentName,
  proposalTitle,
  action,
  actionUrl,
  institutionName,
}: {
  to: string
  studentName: string
  proposalTitle: string
  action: 'submitted' | 'updated' | 'withdrawn'
  actionUrl: string
  institutionName: string
}) {
  const actionMessages = {
    submitted: {
      title: 'New Proposal Submitted',
      icon: '📝',
      type: 'info',
      message: `${studentName} has submitted a new research proposal: "${proposalTitle}". Please review it at your earliest convenience.`,
      actionText: 'Review Proposal'
    },
    updated: {
      title: 'Proposal Updated',
      icon: '✏️',
      type: 'info',
      message: `${studentName} has updated their research proposal: "${proposalTitle}". Please review the changes.`,
      actionText: 'View Proposal'
    },
    withdrawn: {
      title: 'Proposal Withdrawn',
      icon: '🗑️',
      type: 'warning',
      message: `${studentName} has withdrawn their research proposal: "${proposalTitle}".`,
      actionText: 'View Proposals'
    }
  }

  const actionData = actionMessages[action]

  return sendDropAPIEmail({
    to,
    subject: `${actionData.title}: ${proposalTitle}`,
    template: 'notification',
    templateData: {
      title: actionData.title,
      message: actionData.message,
      icon: actionData.icon,
      type: actionData.type,
      actionUrl,
      actionText: actionData.actionText,
      footer: `${institutionName} Research Management System`
    },
    brandName: institutionName,
    fromName: institutionName,
    metadata: {
      type: 'proposal_notification',
      action,
      proposalTitle,
      studentName
    }
  })
}
