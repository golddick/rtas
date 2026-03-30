// app/auth/reset-password/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { useResetPassword } from '@/store/user/userStore'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const { loading, error, success, message, resetPassword, clearState } = useResetPassword()

  useEffect(() => {
    if (!token) {
      router.push('/login')
    }
    return () => clearState()
  }, [token, router, clearState])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      return
    }
    if (password.length < 8) {
      return
    }
    
    if (token) {
      await resetPassword({ token, password })
      
      if (success) {
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    }
  }

  const passwordStrength = (() => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++
    return strength
  })()

  const strengthLabel = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength] || 'Weak'
  const strengthColor = ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-green-600'][passwordStrength] || 'bg-red-500'

  const passwordsMatch = password === confirmPassword
  const isValid = password.length >= 8 && passwordsMatch

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-primary mb-4 hover:underline">
          <ArrowLeft size={16} />
          Back to Login
        </Link>
        <CardTitle>Reset Password</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">Create a strong new password for your account</p>
      </CardHeader>
      <CardContent>
        {!success ? (
          <form onSubmit={handleReset} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {password && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i < passwordStrength ? strengthColor : 'bg-secondary'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Strength: <span className="font-medium">{strengthLabel}</span>
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {confirmPassword && (
              <div className={`text-xs p-2 rounded ${passwordsMatch ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </div>
            )}

            <div className="bg-secondary rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">Password Requirements:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className={password.length >= 8 ? 'text-green-600' : ''}>
                  {password.length >= 8 ? '✓' : '○'} At least 8 characters
                </li>
                <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-green-600' : ''}>
                  {/[a-z]/.test(password) && /[A-Z]/.test(password) ? '✓' : '○'} Mix of uppercase and lowercase
                </li>
                <li className={/\d/.test(password) ? 'text-green-600' : ''}>
                  {/\d/.test(password) ? '✓' : '○'} Include a number
                </li>
                <li className={/[^a-zA-Z\d]/.test(password) ? 'text-green-600' : ''}>
                  {/[^a-zA-Z\d]/.test(password) ? '✓' : '○'} Include a special character
                </li>
              </ul>
            </div>

            <Button type="submit" disabled={loading || !isValid} className="w-full">
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Password Reset Successfully</h3>
              <p className="text-sm text-muted-foreground">
                {message || 'Your password has been reset. Redirecting to login...'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Container className="min-h-screen flex items-center justify-center py-12">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      }>
        <ResetPasswordForm />
      </Suspense>
    </Container>
  )
}

