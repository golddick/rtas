// app/api/messages/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { dropid } from 'dropid'
import { sendDropAPIEmail } from '@/lib/email/email'
import { createMessageNotification } from '@/lib/notifications'

async function verifyUser() {
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

    const user = await db.user.findUnique({
      where: { id: decoded.id },
      include: {
        department: true,
        institution: true
      }
    })

    if (!user) {
      return { error: 'User not found', status: 404 }
    }

    return { user }
  } catch (error) {
    console.error('[VERIFY_USER]', error)
    return { error: 'Invalid token', status: 401 }
  }
}

// GET /api/messages/conversations - Get all conversations for user
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUser()
    if ('error' in auth) {
      return NextResponse.json(
        { message: auth.error },
        { status: auth.status }
      )
    }

    const { user } = auth
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'ACTIVE'

    console.log('[GET_CONVERSATIONS]', { userId: user.id, status })

    // Get conversations where user is a participant
    const participants = await db.conversationParticipant.findMany({
      where: {
        userId: user.id,
        conversation: {
          status: status as any
        }
      },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                    matricNumber: true,
                    staffNumber: true
                  }
                }
              }
            },
            messages: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 2
            }
          }
        }
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc'
        }
      }
    })

    console.log('[GET_CONVERSATIONS]', { count: participants.length })

    // Format conversations
    const formattedConversations = participants
      .map(participant => {
        const conversation = participant.conversation
        // Get the other participant
        const otherParticipant = conversation.participants.find(p => p.userId !== user.id)?.user
        
        if (!otherParticipant) return null

        const lastMessage = conversation.messages[0]
        
        // Calculate unread count for this user in this conversation
        const unreadCount = conversation.unreadCount || 0

        return {
          id: conversation.id,
          name: otherParticipant.fullName,
          role: otherParticipant.role === 'SUPERVISOR' ? 'Supervisor' : 
                 otherParticipant.role === 'HOD' ? 'HOD' : 'Student',
          email: otherParticipant.email,
          lastMessage: lastMessage?.content || 'No messages yet',
          timestamp: lastMessage?.createdAt || conversation.updatedAt,
          unread: unreadCount > 0,
          unreadCount: unreadCount,
          avatar: otherParticipant.fullName.split(' ').map(n => n[0]).join(''),
          otherUserId: otherParticipant.id,
          status: conversation.status
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      data: formattedConversations
    })

  } catch (error) {
    console.error('[CONVERSATIONS_GET]', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/messages/conversations - Create a new conversation or send message
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUser()
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      )
    }

    const { user } = auth
    const body = await request.json()
    const { recipientId, content, subject } = body

    if (!recipientId || !content) {
      return NextResponse.json(
        { success: false, message: 'Recipient and content are required' },
        { status: 400 }
      )
    }

    console.log('[POST_CONVERSATION]', { senderId: user.id, recipientId, contentLength: content.length })

    // Get recipient
    const recipient = await db.user.findUnique({
      where: { id: recipientId },
      include: {
        department: true,
        institution: true
      }
    })

    if (!recipient) {
      return NextResponse.json(
        { success: false, message: 'Recipient not found' },
        { status: 404 }
      )
    }

    // Find existing conversation where both users are participants
    let conversation = await db.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: recipientId } } }
        ]
      },
      include: {
        participants: true
      }
    })

    if (!conversation) {
      // Create new conversation
      conversation = await db.conversation.create({
        data: {
          id: dropid('conv'),
          participants: {
            create: [
              {
                id: dropid('cp'),
                userId: user.id,
                role: user.role.toLowerCase()
              },
              {
                id: dropid('cp'),
                userId: recipientId,
                role: recipient.role.toLowerCase()
              }
            ]
          }
        },
        include: {
          participants: true
        }
      })
      console.log('[POST_CONVERSATION]', { newConversationId: conversation.id })
    }

    // Create message
    const message = await db.message.create({
      data: {
        id: dropid('msg'),
        content,
        senderId: user.id,
        receiverId: recipientId,
        conversationId: conversation.id,
        isRead: false
      }
    })

    console.log('[POST_CONVERSATION]', { messageId: message.id })

    // Update conversation
    await db.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: content,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
        unreadCount: {
          increment: 1
        }
      }
    })

    // Send email notification and create in-app notification
    try {
      const institutionSlug = user.institution?.slug || ''
      const departmentCode = user.department?.code || ''
      const messagesUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${institutionSlug}/${departmentCode}/messages`

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>New Message from ${user.fullName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1F2937; margin: 0; padding: 0; background-color: #F3F4F6; }
            .container { max-width: 600px; margin: 20px auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background-color: #3B82F6; padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 30px; }
            .message-box { background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }
            .button { display: inline-block; background-color: #3B82F6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500; margin-top: 20px; }
            .button:hover { background-color: #2563EB; }
            .footer { text-align: center; padding: 20px; background-color: #F9FAFB; color: #6B7280; font-size: 12px; border-top: 1px solid #E5E7EB; }
            hr { border: none; border-top: 1px solid #E5E7EB; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Message</h1>
            </div>
            <div class="content">
              <p><strong>From:</strong> ${user.fullName}</p>
              <p><strong>To:</strong> ${recipient.fullName}</p>
              ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
              <div class="message-box">
                <p style="margin: 0; white-space: pre-wrap;">${content}</p>
              </div>
              <div style="text-align: center;">
                <a href="${messagesUrl}" class="button">Reply to Message</a>
              </div>
            </div>
            <div class="footer">
              <p>This message was sent from the RTAS platform.</p>
            </div>
          </div>
        </body>
        </html>
      `

      // Send email
      await sendDropAPIEmail({
        to: recipient.email,
        subject: subject || `New message from ${user.fullName}`,
        html: emailHtml,
        fromName: user.institution?.name || 'RTAS',
        metadata: {
          type: 'message_notification',
          conversationId: conversation.id,
          messageId: message.id
        }
      })

      // Create in-app notification
      await createMessageNotification({
        userId: recipient.id,
        senderName: user.fullName, 
        messageContent: content
      })

      // Update message with email tracking info
      await db.message.update({
        where: { id: message.id },
        data: {
          emailSent: true,
          emailSentAt: new Date()
        }
      })

      console.log('[POST_CONVERSATION]', { emailSent: true, notificationCreated: true })

    } catch (emailError) {
      console.error('[POST_CONVERSATION] Email/Notification error:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      data: {
        message,
        conversation,
        emailSent: true
      }
    })

  } catch (error) {
    console.error('[CONVERSATIONS_POST]', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// PATCH /api/messages/conversations - Update conversation (archive, delete, mark read)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyUser()
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      )
    }

    const { user } = auth
    const body = await request.json()
    const { conversationId, action } = body

    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    console.log('[PATCH_CONVERSATION]', { conversationId, action, userId: user.id })

    // Verify user is a participant
    const participant = await db.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id
      }
    })

    if (!participant) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'archive':
        await db.conversation.update({
          where: { id: conversationId },
          data: { status: 'ARCHIVED' }
        })
        console.log('[PATCH_CONVERSATION]', { action: 'archived', conversationId })
        break

      case 'unarchive':
        await db.conversation.update({
          where: { id: conversationId },
          data: { status: 'ACTIVE' }
        })
        console.log('[PATCH_CONVERSATION]', { action: 'unarchived', conversationId })
        break

      case 'delete':
        await db.conversation.update({
          where: { id: conversationId },
          data: { status: 'DELETED' }
        })
        console.log('[PATCH_CONVERSATION]', { action: 'deleted', conversationId })
        break

      case 'mark_read':
        // Mark all messages in conversation as read for this user
        const result = await db.message.updateMany({
          where: {
            conversationId,
            receiverId: user.id,
            isRead: false
          },
          data: {
            isRead: true,
            readAt: new Date()
          }
        })
        
        // Reset unread count
        await db.conversation.update({
          where: { id: conversationId },
          data: { unreadCount: 0 }
        })
        
        console.log('[PATCH_CONVERSATION]', { 
          action: 'marked_read', 
          conversationId, 
          messagesRead: result.count 
        })
        break

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation updated successfully'
    })

  } catch (error) {
    console.error('[CONVERSATIONS_PATCH]', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}