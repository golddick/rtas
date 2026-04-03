'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Shield, AlertCircle, CheckCircle, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { useAuthStore } from '@/store/admin/adminAuthStore'
import { resendOTP } from '@/lib/otp/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const verified = searchParams.get('verified')
  
  const { login, isLoading, error, clearError, pendingEmail } = useAuthStore()
  
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('') 
  const [success, setSuccess] = useState('')
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false)
  const [resendingOtp, setResendingOtp] = useState(false)
  const [resendSuccess, setResendSuccess] = useState('')
  const [resendError, setResendError] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })

  // Show success message if email was just verified
  useEffect(() => {
    if (verified === 'true') {
      setSuccess('Email verified successfully! You can now log in.')
      setShowVerificationPrompt(false)
    }
  }, [verified])

  // Check if there's a pending email from store (from previous login attempt)
  useEffect(() => {
    if (pendingEmail) {
      setFormData(prev => ({ ...prev, email: pendingEmail }))
      setShowVerificationPrompt(true)
    }
  }, [pendingEmail])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setLocalError('')
    setResendError('')
    setShowVerificationPrompt(false)
    if (error) clearError()
  }

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setLocalError('Please fill in all fields')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setLocalError('Please enter a valid email address')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    setShowVerificationPrompt(false)
    clearError()

    if (!validateForm()) {
      return
    }

    try {
      await login({
        email: formData.email,
        password: formData.password
      })
      
      // If login successful, redirect to dashboard
      router.push('/dashboard/admin')
    } catch (error: any) {
      // Check if error is due to unverified email
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        setShowVerificationPrompt(true)
        setLocalError('')
      }
      // Other errors are handled by store and displayed via error state
    }
  }

  const handleResendVerification = async () => {
    setResendingOtp(true)
    setResendError('')
    setResendSuccess('')
    
    try {
      const result = await resendOTP({
        email: formData.email,
        reason: 'not_received',
        metadata: {
          purpose: 'verify_email',
          source: 'login_page'
        }
      })
      
      if (result.success) {
        setResendSuccess('Verification code sent! Please check your email.')
        // Redirect to verification page after short delay
        setTimeout(() => {
          router.push(`/auth/admin/verify-email?email=${encodeURIComponent(formData.email)}&otpId=${result.data?.id}`)
        }, 1500)
      } else {
        setResendError(result.error || 'Failed to send verification code. Please try again.')
      }
    } catch (error) {
      setResendError('Failed to send verification code. Please try again.')
    } finally {
      setResendingOtp(false)
    }
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
          <CardTitle className="text-3xl">Admin Login</CardTitle>
          <p className="text-muted-foreground">
            Sign in to access the admin dashboard
          </p>
        </CardHeader>

        <CardContent>
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-3">
              <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-green-500">{success}</p>
            </div>
          )}

          {/* Resend Success Message */}
          {resendSuccess && (
            <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-3">
              <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-green-500">{resendSuccess}</p>
            </div>
          )}

          {/* Error Message */}
          {(localError || error) && !showVerificationPrompt && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-destructive">{localError || error}</p>
            </div>
          )}

          {/* Resend Error Message */}
          {resendError && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-destructive">{resendError}</p>
            </div>
          )}

          {/* Verification Prompt */}
          {showVerificationPrompt && (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-sm text-amber-600 font-medium mb-2">
                    Please verify your email before logging in
                  </p>
                  <p className="text-xs text-amber-600/80 mb-3">
                    We've sent a verification code to {formData.email}. Please check your inbox.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleResendVerification}
                      disabled={resendingOtp}
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendingOtp ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          Resend verification code
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowVerificationPrompt(false)
                        clearError()
                      }}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      Back to login
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showVerificationPrompt && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-muted-foreground" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@university.edu"
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <Link href="/auth/admin/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-muted-foreground" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="rememberMe"
                  id="remember"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border cursor-pointer"
                  disabled={isLoading}
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                  Remember me on this device
                </label>
              </div>

              {/* Login Button */}
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
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">New to RTAS?</span>
                </div>
              </div>

              {/* Signup Link */}
              <Link
                href="/auth/admin/signup"
                className="w-full py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-all duration-300 text-center block"
              >
                Create Admin Account
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}









