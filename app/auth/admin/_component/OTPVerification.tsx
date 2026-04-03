'use client'

import { useState, useEffect, useRef } from 'react'
import { Mail, CheckCircle, AlertCircle, Clock, RefreshCw, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { useAuthStore } from '@/store/admin/adminAuthStore'

interface OTPVerificationProps {
  email: string
  otpId?: string
  purpose: 'signup' | 'login' | 'reset_password' | 'verify_email'
  onVerified: () => void
  onCancel?: () => void
}

export default function OTPVerification({ email, otpId: initialOtpId, purpose, onVerified, onCancel }: OTPVerificationProps) {
  const { verifyOTP, resendOTP, isLoading, error, clearError } = useAuthStore()
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [otpId, setOtpId] = useState<string | null>(initialOtpId || null)
  const [verificationError, setVerificationError] = useState('')
  const [success, setSuccess] = useState('')
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

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

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleResend = async () => {
    try {
      const result = await resendOTP({
        email,
        otpId: otpId || undefined,
        reason: 'not_received',
        purpose
      })
      
      setOtpId(result.id)
      setTimeLeft(60)
      setOtp(['', '', '', '', '', '']) // Clear OTP inputs
      setSuccess('New verification code sent')
      setVerificationError('')
      
      setTimeout(() => setSuccess(''), 5000)
    } catch (error: any) {
      setVerificationError(error.message)
    }
  }

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('')
      const newOtp = [...otp]
      pastedCode.forEach((char, i) => {
        if (i < 6) newOtp[i] = char
      })
      setOtp(newOtp)
      
      // Focus last filled input or next empty
      const lastFilledIndex = Math.min(pastedCode.length, 5)
      if (inputRefs.current[lastFilledIndex]) {
        inputRefs.current[lastFilledIndex]?.focus()
      }
    } else {
      // Handle single digit
      if (/^\d*$/.test(value)) {
        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        // Auto-focus next input
        if (value && index < 5 && inputRefs.current[index + 1]) {
          inputRefs.current[index + 1]?.focus()
        }
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').trim()
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('')
      setOtp(digits)
      if (inputRefs.current[5]) {
        inputRefs.current[5]?.focus()
      }
    }
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length !== 6) {
      setVerificationError('Please enter all 6 digits')
      return
    }

    setVerificationError('')
    
    try {
      await verifyOTP({
        email,
        code,
        otpId: otpId || undefined,
        purpose
      })
      
      setSuccess('Code verified successfully!')
      setTimeout(() => {
        onVerified()
      }, 1000)
    } catch (error: any) {
      setVerificationError(error.message)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      if (error) clearError()
    }
  }, [error, clearError])

  return (
    <Card className="w-full max-w-md border-0 shadow-lg">
      <CardHeader>
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="text-primary" size={32} />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Verify Your Email</CardTitle>
        <p className="text-center text-muted-foreground text-sm">
          Enter the verification code sent to<br />
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Message */}
        {(error || verificationError) && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-destructive">{error || verificationError}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-3">
            <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-green-500">{success}</p>
          </div>
        )}

        {/* OTP Input */}
        <div className="space-y-4">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-semibold border-2 border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200 bg-background"
                disabled={isLoading || timeLeft <= 0}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <Clock size={16} className={timeLeft < 120 ? 'text-destructive' : 'text-muted-foreground'} />
            <span className={timeLeft < 120 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
              Code expires in {formatTime(timeLeft)}
            </span>
          </div>

          {/* Resend Option */}
          {timeLeft <= 0 ? (
            <button
              onClick={handleResend}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 text-primary hover:underline disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Resend verification code
            </button>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Didn't receive the code? You can request a new one when the timer expires
            </p>
          )}
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={isLoading || otp.join('').length !== 6 || timeLeft <= 0}
          className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </span>
          ) : (
            'Verify Code'
          )}
        </button>

        {/* Cancel Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="w-full py-3 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Go to Login
          </button>
        )}
      </CardContent>
    </Card>
  )
}