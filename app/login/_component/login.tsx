'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { useAuthStore } from '@/store/user/userStore'
import { sendOTP } from '@/lib/otp/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('code')
  const emailParam = searchParams.get('email')
  const message = searchParams.get('message')
  const redirectPath = searchParams.get('redirect') || '/dashboard'

  const { login, isLoading, error, clearError } = useAuthStore()

  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: emailParam || '',
    password: '',
    rememberMe: false
  })
  const [localError, setLocalError] = useState('')
  const [successMessage, setSuccessMessage] = useState(message || '')
  const [isSendingOTP, setIsSendingOTP] = useState(false)

  useEffect(() => {
    if (message) {
      setTimeout(() => setSuccessMessage(''), 5000)
    }
  }, [message])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setLocalError('')
    if (error) clearError()
  }

  const validateForm = () => {
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

  const handleSendOTP = async () => {
    setIsSendingOTP(true)
    try {
      const result = await sendOTP({
        email: formData.email,
        length: 6,
        expiry: 10,
        brandName: 'RTAS',
        metadata: {
          purpose: 'email_verification',
          from: 'login'
        }
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to send verification code')
      }

      // Store email in session storage for verification page
      sessionStorage.setItem('verificationEmail', formData.email)
      if (result.data?.id) {
        sessionStorage.setItem('otpId', result.data.id)
      }

      // Redirect to verification page
      router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}&purpose=login`)
    } catch (err: any) {
      setLocalError(err.message || 'Failed to send verification code')
    } finally {
      setIsSendingOTP(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    clearError()

    if (!validateForm()) {
      return
    }

    try {
      const user = await login({
        email: formData.email,
        password: formData.password
      })

      // Check if email is verified (you need to add this field to your user object)
      if (!user.emailVerified) {
        await handleSendOTP()
        return
      }

      // If this was an HOD invite, accept it after login
      if (inviteCode && user.role === 'HOD') {
        try {
          await fetch('/api/invite/accept', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              code: inviteCode,
              userId: user.id 
            })
          })
        } catch (inviteError) {
          console.error('Failed to accept invitation:', inviteError)
        }
      }

      console.log(user, 'login user')

      // Redirect based on role
      if (redirectPath !== '/dashboard') {
        router.push(redirectPath)
      } else {
        // Build role-based path with institution slug and department code
        const institutionSlug = user.institution?.slug || 
          user.institution?.code?.toLowerCase().replace(/\s+/g, '-') || 
          'institution'
        
        // Get the correct department based on role
        let departmentCode = 'department'
        
        switch (user.role) {
          case 'HOD':
            departmentCode = user.department?.code?.toLowerCase() || 'department'
            router.push(`/dashboard/${institutionSlug}/${departmentCode}/hod`)
            break
            
          case 'SUPERVISOR':
            // For supervisors, use supervisorDepartment, NOT department
            departmentCode = user.supervisorDepartment?.code?.toLowerCase() || 'department'
            console.log('Supervisor redirect:', {
              institutionSlug,
              departmentCode,
              fullPath: `/dashboard/${institutionSlug}/${departmentCode}/supervisor`
            })
            router.push(`/dashboard/${institutionSlug}/${departmentCode}/supervisor`)
            break
            
          case 'STUDENT':
            departmentCode = user.department?.code?.toLowerCase() || 'department'
            router.push(`/dashboard/${institutionSlug}/${departmentCode}/student`)
            break
            
          default:
            router.push('/dashboard')
        }
      }
    } catch (err: any) {
      // Error handled by store
      console.error('Login error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Column - Branding */}
      <div className="hidden md:flex md:w-1/2 lg:w-1/2 bg-gradient-to-br from-primary/10 to-primary/5 flex-col justify-center items-center p-12 border-r border-border animate-fade-in">
        <div className="max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-3xl">R</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">Welcome back to RTAS</h1>
          <p className="text-lg text-muted-foreground">
            Research Topic Approval Workflow System - Streamline your research supervision process
          </p>
          <div className="pt-8 space-y-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">✓</span>
              </div>
              <p className="text-foreground">Easy proposal submission</p>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">✓</span>
              </div>
              <p className="text-foreground">Real-time tracking</p>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">✓</span>
              </div>
              <p className="text-foreground">Instant notifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 animate-slide-up">
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent p-0">
          <CardHeader className="mb-8 space-y-2 px-0">
            <div className="flex md:hidden justify-center mb-6">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-2xl">R</span>
              </div>
            </div>
            <CardTitle className="text-3xl text-center text-foreground">
              Sign In
            </CardTitle>
            <p className="text-center text-muted-foreground text-sm">
              Enter your credentials to access your account
            </p>
            {inviteCode && (
              <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-3">
                <CheckCircle className="text-primary flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-foreground">
                  You have an invitation waiting. Sign in to accept it.
                </p>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6 px-0">
            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-3">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-green-600">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {(localError || error) && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-destructive">{localError || error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-muted-foreground" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading || isSendingOTP}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2 animate-slide-up">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
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
                    disabled={isLoading || isSendingOTP}
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
              <div className="flex items-center gap-2 animate-slide-up">
                <input
                  type="checkbox"
                  name="rememberMe"
                  id="remember"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border cursor-pointer"
                  disabled={isLoading || isSendingOTP}
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                  Remember me on this device
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading || isSendingOTP}
                className="w-full px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all duration-300 hover:shadow-lg animate-scale-in disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading || isSendingOTP ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⚪</span>
                    {isSendingOTP ? 'Sending verification...' : 'Signing in...'}
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">New to RTAS?</span>
              </div>
            </div>

            {/* Register Link */}
            <Link
              href={inviteCode ? `/signup/hod?code=${inviteCode}` : '/register'}
              className="w-full px-4 py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-all duration-300 text-center block"
            >
              Create Account
            </Link>

            {/* Hidden invite code input for form submission */}
            {inviteCode && (
              <input type="hidden" name="inviteCode" value={inviteCode} />
            )}
          </CardContent>
        </Card>


      </div>
    </div>
  )
}
















