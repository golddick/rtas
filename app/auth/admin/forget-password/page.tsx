// app/admin/forgot-password/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { useAuthStore } from '@/store/admin/adminAuthStore'
import OTPVerification from '../_component/OTPVerification'

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading, error, clearError } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [localError, setLocalError] = useState('')
  const [success, setSuccess] = useState('')

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    setSuccess('')
    clearError()

    if (!email) {
      setLocalError('Please enter your email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setLocalError('Please enter a valid email address')
      return
    }

    try {
      await forgotPassword(email)
      setStep('otp')
      setSuccess('Verification code sent to your email')
    } catch (error: any) {
      setLocalError(error.message)
    }
  }

  const handleOTPVerified = () => {
    // Redirect to reset password page with email
    window.location.href = `/admin/reset-password?email=${encodeURIComponent(email)}`
  }

  const handleOTPCancel = () => {
    setStep('email')
  }

  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <OTPVerification
          email={email}
          purpose="reset_password"
          onVerified={handleOTPVerified}
          onCancel={handleOTPCancel}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Shield className="text-primary-foreground" size={32} />
            </div>
          </div>
          <CardTitle className="text-3xl">Forgot Password</CardTitle>
          <p className="text-muted-foreground">
            Enter your email address and we'll send you a verification code to reset your password.
          </p>
        </CardHeader>

        <CardContent>
          {/* Error Message */}
          {(localError || error) && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-destructive">{localError || error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-3">
              <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-green-500">{success}</p>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-muted-foreground" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@university.edu"
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                'Send Reset Code'
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <Link 
                href="/admin/login" 
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 