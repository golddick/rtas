'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { ArrowLeft, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { verifyOTP, resendOTP } from '@/lib/otp/client'
import { useAuthStore } from '@/store/user/userStore'

export default function VerifyOTPPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const purpose = searchParams.get('purpose') || 'verification'

  const { updateEmailVerification, isLoading: authLoading } = useAuthStore()

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [verified, setVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpId, setOtpId] = useState<string | null>(null)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // Get OTP ID from session storage
    const storedOtpId = sessionStorage.getItem('otpId')
    if (storedOtpId) {
      setOtpId(storedOtpId)
    }

    // Redirect if no email
    if (!email) {
      router.push('/login')
    }
  }, [email, router])

  // Timer for OTP expiry
  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').trim()
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('')
      setOtp(digits)
    }
  }

  const handleVerify = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    if (!email) {
      setError('Email is required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // First verify the OTP with DropAPI
      const result = await verifyOTP({
        email,
        code: otpCode,
        otpId: otpId || undefined
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to verify OTP')
      }

      const verified = await updateEmailVerification(email)

        if (!verified) {
        throw new Error('Failed to update email verification status')
      }

      setVerified(true)
      setSuccess('Email verified successfully!')
      
      // Clear session storage
      sessionStorage.removeItem('verificationEmail')
      sessionStorage.removeItem('otpId')

      // Redirect after 2 seconds based on purpose
      setTimeout(() => {
        if (purpose === 'login') {
          // If this was from login, try login again
          router.push('/login?message=Email verified. Please sign in again.')
        } else if (purpose === 'signup') {
          // If this was from signup, go to login with success message
          router.push('/login?message=Account created and email verified. Please sign in.')
        } else {
          router.push('/dashboard')
        }
      }, 2000)
      
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      setError('Email is required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await resendOTP({
        email,
        otpId: otpId || undefined,
        reason: 'not_received',
        metadata: {
          purpose: 'email_verification',
          from: 'verify-page'
        }
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to resend OTP')
      }

      setOtpId(result.data?.id || null)
      setTimeLeft(600) // Reset timer to 10 minutes
      setSuccess('New verification code sent!')
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000)
      
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!email) {
    return null
  }

  return (
    <Container className="min-h-screen flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-primary mb-4 hover:underline">
            <ArrowLeft size={16} />
            Back to Login
          </Link>
          <CardTitle>Verify Your Email</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Enter the 6-digit code sent to<br />
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!verified ? (
            <>
              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3">
                  <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-3">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              {/* OTP Input */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Verification Code</label>
                <div 
                  className="flex gap-2 justify-center mb-4" 
                  onPaste={handlePaste}
                >
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      className="w-12 h-12 border-2 border-border rounded-lg text-center text-lg font-semibold bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                      disabled={isLoading || timeLeft <= 0}
                    />
                  ))}
                </div>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <Clock size={16} />
                <span>Code expires in {formatTime(timeLeft)}</span>
              </div>

              {/* Verify Button */}
              <Button
                onClick={handleVerify}
                disabled={otp.join('').length !== 6 || isLoading || timeLeft <= 0}
                className="w-full"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⚪</span>
                    Verifying...
                  </span>
                ) : (
                  'Verify Code'
                )}
              </Button>

              {/* Resend Option */}
              {timeLeft <= 0 ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Code expired?</p>
                  <button
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-sm text-primary hover:underline font-medium disabled:opacity-50"
                  >
                    Resend New Code
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the code?{' '}
                    <button
                      onClick={handleResend}
                      disabled={isLoading}
                      className="text-primary hover:underline font-medium disabled:opacity-50"
                    >
                      Resend
                    </button>
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Email Verified!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Your email has been verified successfully. Redirecting...
                </p>
              </div>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}




