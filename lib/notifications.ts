// lib/notifications.ts
import { db } from '@/lib/db'
import { dropid } from 'dropid'

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'

interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type?: NotificationType
}

export async function createNotification({
  userId,
  title,
  message,
  type = 'INFO'
}: CreateNotificationParams) {
  try {
    const notification = await db.notification.create({
      data: {
        id:dropid('not'),
        userId,
        title,
        message,
        type
      }
    })
    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    return null
  }
}

export async function createMessageNotification({
  userId,
  senderName,
  messageContent
}: {
  userId: string
  senderName: string
  messageContent: string
}) {
  return createNotification({
    userId,
    title: 'New Message',
    message: `${senderName} sent you a message: "${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}"`,
    type: 'INFO'
  })
}

export async function createProposalNotification({
  userId,
  proposalTitle,
  status
}: {
  userId: string
  proposalTitle: string
  status: string
}) {
  const statusMessages = {
    SUBMITTED: 'has been submitted',
    UNDER_REVIEW: 'is under review',
    APPROVED: 'has been approved',
    REJECTED: 'has been rejected',
    REVISION_REQUESTED: 'needs revision'
  }

  const message = statusMessages[status as keyof typeof statusMessages] || `status updated to ${status}`

  return createNotification({
    userId,
    title: `Proposal ${status}`,
    message: `Your proposal "${proposalTitle}" ${message}.`,
    type: status === 'APPROVED' ? 'SUCCESS' : status === 'REJECTED' ? 'ERROR' : 'INFO'
  })
}