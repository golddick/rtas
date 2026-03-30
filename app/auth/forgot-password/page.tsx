




// app/auth/forgot-password/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { useForgotPassword } from '@/store/user/userStore'


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const { loading, error, success, message, forgotPassword, clearState } = useForgotPassword()

  useEffect(() => {
    return () => clearState()
  }, [clearState])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await forgotPassword({ email })
  }

  return (
    <Container className="min-h-screen flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-primary mb-4 hover:underline">
            <ArrowLeft size={16} />
            Back to Login
          </Link>
          <CardTitle>Forgot Password?</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Enter your email to reset your password</p>
        </CardHeader>
        <CardContent>
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@university.edu"
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                We'll send you a link to reset your password. Check your email within the next 30 minutes.
              </div>

              <Button type="submit" disabled={loading || !email} className="w-full">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Remember your password?{' '}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Login here
                </Link>
              </p>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Check Your Email</h3>
                <p className="text-sm text-muted-foreground">
                  {message || `We've sent a password reset link to ${email}`}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                The link expires in 30 minutes. If you don't see the email, check your spam folder.
              </div>
              <Button variant="outline" onClick={clearState} className="w-full">
                Try Another Email
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}