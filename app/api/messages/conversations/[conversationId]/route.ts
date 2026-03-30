// app/api/messages/conversations/[conversationId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

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
      where: { id: decoded.id }
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

// GET /api/messages/conversations/[conversationId] - Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    console.log('[GET_CONVERSATION_MESSAGES] Params:', params)
    
    const auth = await verifyUser()
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      )
    }

    const { user } = auth
    const { conversationId } =  await params

    console.log(conversationId, 'ser')

    // Validate conversationId
    if (!conversationId) {
      console.error('[GET_CONVERSATION_MESSAGES] Missing conversationId')
      return NextResponse.json(
        { success: false, message: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    console.log('[GET_CONVERSATION_MESSAGES]', { conversationId, userId: user.id })

    // Verify user is a participant
    const participant = await db.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id
      }
    })

    if (!participant) {
      console.log('[GET_CONVERSATION_MESSAGES] User not a participant')
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get conversation with participants - Fix: use findFirst instead of findUnique with proper where clause
    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId
      },
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
        }
      }
    })

    if (!conversation) {
      console.log('[GET_CONVERSATION_MESSAGES] Conversation not found')
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get messages
    const messages = await db.message.findMany({
      where: {
        conversationId
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Get the other participant
    const otherParticipant = conversation.participants.find(p => p.userId !== user.id)?.user

    // Mark unread messages as read for this user
    const unreadMessages = messages.filter(m => m.receiverId === user.id && !m.isRead)
    
    if (unreadMessages.length > 0) {
      await db.message.updateMany({
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

      // Update unread count in conversation
      await db.conversation.update({
        where: { id: conversationId },
        data: {
          unreadCount: 0
        }
      })
      
      console.log('[GET_CONVERSATION_MESSAGES]', { 
        messagesMarkedRead: unreadMessages.length 
      })
    }

    // Format messages
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      isRead: msg.isRead,
      readAt: msg.readAt,
      createdAt: msg.createdAt,
      isOwn: msg.senderId === user.id
    }))

    return NextResponse.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          status: conversation.status,
          lastMessageAt: conversation.lastMessageAt,
          lastMessage: conversation.lastMessage,
          unreadCount: conversation.unreadCount
        },
        otherParticipant: otherParticipant || null,
        messages: formattedMessages
      }
    })

  } catch (error) {
    console.error('[GET_CONVERSATION_MESSAGES]', error)
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