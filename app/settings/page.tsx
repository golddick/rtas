'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Bell, Lock, User, Eye, EyeOff, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/user/userStore'

export default function SettingsPage() {
  const router = useRouter()
  const { user, updateUserProfile, updatePassword, isLoading, error, clearError, deleteAccount } = useAuthStore()
  
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
  
  const [formData, setFormData] = useState({
    fullName: '',
    additionalEmail: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Load user data when available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName || '',
        additionalEmail: user.additionalEmail || '',
        phone: user.phone || '',
      }))
    }
  }, [user])

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    if (error) clearError()
    setSuccessMessage('')
  }

  const handleProfileUpdate = async () => {
    try {
      const updateData = {
        fullName: formData.fullName !== user?.fullName ? formData.fullName : undefined,
        phone: formData.phone !== user?.phone ? formData.phone : undefined,
        additionalEmail: formData.additionalEmail || undefined,
      }

      // Only send if there are changes
      if (Object.values(updateData).some(v => v !== undefined)) {
        await updateUserProfile(updateData)
        setSuccessMessage('Profile updated successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (err) {
      // Error handled by store
    }
  }

  const handlePasswordUpdate = async () => {
    // Validate passwords
    if (!formData.currentPassword) {
      alert('Please enter your current password')
      return
    }

    if (formData.newPassword.length < 8) {
      alert('New password must be at least 8 characters long')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      alert('New passwords do not match')
      return
    }

    try {
      await updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })
      
      setSuccessMessage('Password updated successfully!')
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      // Error handled by store
    }
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await deleteAccount()
        router.push('/login')
      } catch (err) {
        // Error handled by store
      }
    }
  }

  if (!user) {
    return null
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'SUPERVISOR': return 'Supervisor'
      case 'HOD': return 'Head of Department'
      case 'STUDENT': return 'Student'
      default: return role
    }
  }

  const getDepartmentDisplay = () => {
    if (user.role === 'SUPERVISOR' && user.supervisorDepartment) {
      return `${user.supervisorDepartment.name} (${user.supervisorDepartment.code})`
    }
    if (user.department) {
      return `${user.department.name} (${user.department.code})`
    }
    return 'Not Assigned'
  }

  // Get the dashboard route based on user role
  const getDashboardRoute = () => {
    const institutionSlug = user.institution?.slug || user.institution?.code?.toLowerCase() || 'institution'
    
    if (user.role === 'STUDENT') {
      const departmentCode = user.department?.code?.toLowerCase() || 'department'
      return `/dashboard/${institutionSlug}/${departmentCode}/student`
    }
    
    if (user.role === 'SUPERVISOR') {
      const departmentCode = user.supervisorDepartment?.code?.toLowerCase() || 'department'
      return `/dashboard/${institutionSlug}/${departmentCode}/supervisor`
    }
    
    if (user.role === 'HOD') {
      const departmentCode = user.department?.code?.toLowerCase() || 'department'
      return `/dashboard/${institutionSlug}/${departmentCode}/hod`
    }
    
    return '/dashboard'
  }

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border bg-background sticky top-0 z-40">
          <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <Link 
                href={getDashboardRoute()}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4 border-b border-border">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === 'profile'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === 'security'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Security
              </button>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-destructive flex-shrink-0" size={20} />
                <p className="text-sm text-destructive">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          )}

          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <User size={20} className="text-primary" />
                  </div>
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Info Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-secondary rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="font-medium">{getRoleDisplay(user.role)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium">{getDepartmentDisplay()}</p>
                  </div>
                  {user.role === 'STUDENT' && user.matricNumber && (
                    <div>
                      <p className="text-xs text-muted-foreground">Matric Number</p>
                      <p className="font-medium">{user.matricNumber}</p>
                    </div>
                  )}
                  {(user.role === 'SUPERVISOR' || user.role === 'HOD') && user.staffNumber && (
                    <div>
                      <p className="text-xs text-muted-foreground">Staff Number</p>
                      <p className="font-medium">{user.staffNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Email Verified</p>
                    <p className={`font-medium ${user.emailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {user.emailVerified ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                {/* Department (Read-only) */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Department <span className="text-muted-foreground">(Cannot be changed)</span></label>
                  <input
                    type="text"
                    value={getDepartmentDisplay()}
                    disabled
                    className="w-full px-4 py-2 rounded-lg border border-border bg-secondary text-muted-foreground cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Registration Email (Read-only) */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Registration Email <span className="text-muted-foreground">(Cannot be changed)</span></label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-4 py-2 rounded-lg border border-border bg-secondary text-muted-foreground cursor-not-allowed"
                    />
                  </div>

                  {/* Additional Email (Optional) */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Additional Email <span className="text-muted-foreground">(Optional)</span></label>
                    <input
                      type="email"
                      value={formData.additionalEmail}
                      onChange={(e) => handleInputChange('additionalEmail', e.target.value)}
                      placeholder="Add another email address"
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleProfileUpdate} 
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <span className="animate-spin">⚪</span>
                  ) : (
                    <Save size={18} />
                  )}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Lock size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Change your password and security settings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.currentPassword}
                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        disabled={isLoading}
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

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        placeholder="Enter new password (min. 8 characters)"
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handlePasswordUpdate} 
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <span className="animate-spin">⚪</span>
                  ) : (
                    <Lock size={18} />
                  )}
                  Update Password
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Danger Zone */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Danger Zone</CardTitle>
              <CardDescription className="text-red-600">Irreversible actions - proceed with caution</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="border-red-200 hover:bg-red-100 text-red-700"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  )
}