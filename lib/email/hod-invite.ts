// lib/email/hod-invite.ts
import { sendHODInviteEmail as sendDropAPIHODInvite } from './email'

export async function sendHODInviteEmail({
  email,
  departmentName,
  code,
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
  return sendDropAPIHODInvite({
    email,
    departmentName,
    code,
    institutionName,
    departmentId,
    inviterName,
    tempPassword,
    hodFullName,
  })
}