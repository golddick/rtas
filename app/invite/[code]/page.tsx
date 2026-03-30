'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle, AlertCircle, Clock, Building2, User, LogIn, UserPlus, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/user/userStore'

interface InvitationData {
  id: string
  code: string
  email: string
  status: string
  isExpired: boolean
  expiresAt: string
  createdAt: string
  department: {
    id: string
    name: string
    code: string
    description: string
    faculty: string
    maxStudents: number
  }
  institution: {
    id: string
    name: string
    code: string
  }
  invitedBy: {
    name: string
    email: string
    role: string
  }
}

export default function HodInvitationPage() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string

  const { checkEmailExists, isLoading: storeLoading } = useAuthStore()

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [userExists, setUserExists] = useState<boolean | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [autoAccepted, setAutoAccepted] = useState(false)

  useEffect(() => {
    if (code) {
      fetchInvitation()
    } else {
      setError('No invitation code provided')
      setIsLoading(false)
    }
  }, [code])

  const fetchInvitation = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/invite?code=${code}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load invitation')
      }

      setInvitation(result.data)
      
      // Check if user already exists with this email using store
      const exists = await checkEmailExists(result.data.email)
      setUserExists(exists)
      
      // If user exists, automatically accept the invitation
      if (exists) {
        await autoAcceptInvitation(result.data.email)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const autoAcceptInvitation = async (email: string) => {
    setIsAccepting(true)
    
    try {
      // Store invitation data
      useAuthStore.getState().updateSignupData({
        email,
        invitationCode: code,
        role: 'HOD'
      })

      // Call API to accept invitation
      const response = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to accept invitation')
      }

      setAutoAccepted(true)
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push(`/login?message=Invitation accepted! Please login with your credentials.&email=${encodeURIComponent(email)}`)
      }, 2000)
      
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleAcceptInvitation = () => {
    // Store invitation data in store's signup data
    useAuthStore.getState().updateSignupData({
      email: invitation?.email,
      invitationCode: code,
      role: 'HOD'
    })

    if (userExists) {
      // User exists - redirect to login with email and code
      router.push(`/login?code=${code}&email=${encodeURIComponent(invitation?.email || '')}`)
    } else {
      // User doesn't exist - redirect to HOD signup with code
      router.push(`/signup/hod?code=${code}`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateDaysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  if (isLoading || storeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="text-red-600" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Invalid Invitation</h2>
              <p className="text-muted-foreground mb-6">
                {error || 'The invitation link is invalid or has expired.'}
              </p>
            </div>
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (invitation.isExpired || invitation.status !== 'PENDING') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-yellow-200 bg-yellow-50">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="text-yellow-600" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Invitation {invitation.status.toLowerCase()}</h2>
              <p className="text-muted-foreground mb-6">
                This invitation has {invitation.isExpired ? 'expired' : `already been ${invitation.status.toLowerCase()}`}.
              </p>
            </div>
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const daysLeft = calculateDaysLeft(invitation.expiresAt)

  // Show auto-accept loading state
  if (isAccepting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Accepting Invitation</h2>
              <p className="text-muted-foreground">
                Please wait while we process your invitation...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show success message after auto-accept
  if (autoAccepted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Invitation Accepted!</h2>
              <p className="text-muted-foreground mb-4">
                Your invitation has been successfully accepted. You will be redirected to the login page.
              </p>
            </div>
            <div className="flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">R</span>
              </div>
              <div>
                <CardTitle className="text-2xl">Head of Department Invitation</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">RTAS Platform</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* Welcome Message */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Welcome to RTAS</h2>
              <p className="text-muted-foreground">
                You have been invited to become the Head of Department.
              </p>
            </div>

            {/* Department Details Card */}
            <div className="bg-secondary rounded-lg p-6 space-y-4 border border-border">
              <div className="flex items-start gap-3">
                <Building2 className="text-primary mt-1" size={20} />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Institution</h3>
                  <p className="text-lg font-bold text-foreground">{invitation.institution.name}</p>
                  <p className="text-xs text-muted-foreground">Code: {invitation.institution.code}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Department</h3>
                <p className="text-xl font-bold text-foreground">{invitation.department.name}</p>
                <p className="text-sm text-muted-foreground mt-1">Code: {invitation.department.code}</p>
                <p className="text-sm text-muted-foreground mt-2">Faculty: {invitation.department.faculty}</p>
                <p className="text-sm text-muted-foreground mt-1">Max Students per Supervisor: {invitation.department.maxStudents}</p>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-foreground">{invitation.department.description}</p>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-start gap-3">
                  <User className="text-primary mt-1" size={20} />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Invited By</h3>
                    <p className="text-foreground font-medium">{invitation.invitedBy.name}</p>
                    <p className="text-sm text-muted-foreground">{invitation.invitedBy.role}</p>
                    <p className="text-xs text-muted-foreground">{invitation.invitedBy.email}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex items-start gap-2">
                <Clock className={`mt-1 ${daysLeft < 3 ? 'text-orange-500' : 'text-primary'}`} size={18} />
                <div>
                  <h3 className="text-sm font-medium text-foreground">Expires in</h3>
                  <p className={`text-sm ${daysLeft < 3 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                    {daysLeft} days ({formatDate(invitation.expiresAt)})
                  </p>
                </div>
              </div>
            </div>

            {/* Email Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Mail className="text-blue-600" size={20} />
                <div>
                  <p className="text-sm font-medium text-blue-900">Invitation sent to:</p>
                  <p className="text-base font-semibold text-blue-800">{invitation.email}</p>
                </div>
              </div>
            </div>

            {/* Status Message */}
            <div className={`rounded-lg p-4 ${
              userExists 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`text-sm ${
                userExists ? 'text-green-800' : 'text-blue-800'
              }`}>
                {userExists 
                  ? '✓ An account with this email already exists. Click the button below to accept the invitation.'
                  : '→ No account found with this email. You\'ll need to create one to accept the invitation.'
                }
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleAcceptInvitation}
                className="flex-1 bg-primary text-primary-foreground hover:opacity-90 transition-all py-6 text-lg gap-3"
              >
                {userExists ? (
                  <>
                    <LogIn size={20} />
                    Accept & Sign In
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    Create Account & Accept
                  </>
                )}
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1"
              >
                <Link href="/">Decline</Link>
              </Button>
            </div>

            {/* Terms Notice */}
            <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
              <p>By accepting this invitation, you agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}






