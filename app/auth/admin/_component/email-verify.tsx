'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import OTPVerification from '../_component/OTPVerification'
import { useAuthStore } from '@/store/admin/adminAuthStore'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const otpId = searchParams.get('otpId')
  
  const { pendingEmail, setPendingEmail, otpSession } = useAuthStore()
  
  const [error, setError] = useState('')

  // Redirect if no email
  useEffect(() => {
    if (!email && !pendingEmail) {
      router.push('/auth/admin/signup')
    }
  }, [email, pendingEmail, router])

  const handleVerified = () => {
    // Clear pending email and redirect to login
    setPendingEmail(null)
    router.push('/auth/admin/login?verified=true')
  }

  const handleCancel = () => {
    setPendingEmail(null)
    router.push('/auth/admin/login')
  }

  if (!email && !pendingEmail) {
    return null
  }

  const emailToVerify = email || pendingEmail || ''

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <OTPVerification
        email={emailToVerify}
        otpId={otpId || undefined}
        purpose="verify_email"
        onVerified={handleVerified}
        onCancel={handleCancel}
      />
    </div>
  )
}