'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Eye, EyeOff, Award, Building2, GraduationCap, Briefcase, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { usePublicStore } from '@/store/public/publicStore'
import { useAuthStore } from '@/store/user/userStore'

interface Department {
  id: string
  name: string
  code: string
  institutionId: string
}

export default function RegisterPage() {
  const router = useRouter()

  const { signup, isLoading: authLoading, error: authError, clearError } = useAuthStore()
  const { 
    institutions, 
    departments, 
    fetchInstitutions, 
    fetchDepartments, 
    isLoading: publicLoading 
  } = usePublicStore()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [role, setRole] = useState<'student' | 'supervisor'>('student')
  const [selectedInstitution, setSelectedInstitution] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [program, setProgram] = useState<'BSC' | 'MSC' | 'PHD'>('BSC')
  const [staffNumber, setStaffNumber] = useState('')
  const [matricNumber, setMatricNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  })
  const [localError, setLocalError] = useState('')
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([])

  // Fetch institutions on mount
  useEffect(() => {
    fetchInstitutions()
  }, [])

  // Fetch all departments once on mount
  useEffect(() => {
    fetchDepartments()
  }, [])

  // Filter departments when institution changes
  useEffect(() => {
    if (selectedInstitution) {
      const filtered = departments.filter(
        dept => dept.institutionId === selectedInstitution
      )
      setFilteredDepartments(filtered)
      setSelectedDepartment('') // Reset department when institution changes
    } else {
      setFilteredDepartments([])
    }
  }, [selectedInstitution, departments])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setLocalError('')
    if (authError) clearError()
  }

  const validateForm = () => {
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setLocalError('Please fill in all required fields')
      return false
    }

    if (!selectedInstitution) {
      setLocalError('Please select an institution')
      return false
    }

    if (!selectedDepartment) {
      setLocalError('Please select a department')
      return false
    }

    if (formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters long')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match')
      return false
    }

    if (role === 'student' && !matricNumber) {
      setLocalError('Matric number is required for students')
      return false
    }

    if (role === 'supervisor' && !staffNumber) {
      setLocalError('Staff number is required for supervisors')
      return false
    }

    if (!formData.termsAccepted) {
      setLocalError('You must accept the terms and conditions')
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
  clearError()

  if (!validateForm()) {
    return
  }

  try {
    const userData: any = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      role: role === 'student' ? 'STUDENT' : 'SUPERVISOR',
      phone: phone || undefined,
      institutionId: selectedInstitution,
    }

    // Add role-specific fields with correct field names
    if (role === 'student') {
      userData.departmentId = selectedDepartment  // Students use departmentId
      userData.matricNumber = matricNumber
      userData.program = program
    } else if (role === 'supervisor') {
      userData.supervisorDepartmentId = selectedDepartment  // Supervisors use supervisorDepartmentId
      userData.staffNumber = staffNumber
    }

    console.log('Submitting user data:', userData) // For debugging
    await signup(userData)
    
    // Store email in session for verification
    sessionStorage.setItem('verificationEmail', formData.email)
    
    // Redirect to verification page
    router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}&purpose=signup`)
    
  } catch (err: any) {
    console.error('Signup error:', err)
    // Error handled by store
  }
}

  const programs = [
    { value: 'BSC', label: 'Undergraduate' },
    { value: 'MSC', label: 'Masters' },
    { value: 'PHD', label: 'PhD' }
  ]


  const isLoading = publicLoading || authLoading

  if (isLoading && institutions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left Column - Benefits */}
      <div className="hidden md:flex md:w-1/2 lg:w-1/2 bg-gradient-to-br from-primary/10 to-primary/5 flex-col justify-center items-center p-12 border-r border-border animate-fade-in">
        <div className="max-w-md space-y-8 text-center">
          <h1 className="text-4xl font-bold text-foreground">Join RTAS Today</h1>
          <p className="text-lg text-muted-foreground">
            Get started with the most efficient research topic management system
          </p>

          <div className="space-y-6 text-left pt-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Award className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Streamlined Process</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Simple 4-step approval workflow designed for efficiency
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Award className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Real-time Updates</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Get instant notifications on proposal status changes
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Award className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Secure & Reliable</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Enterprise-grade security for your research data
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Registration Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 overflow-y-auto animate-slide-up">
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent p-0">
          <CardHeader className="mb-8 space-y-2 px-0">
            <div className="flex md:hidden justify-center mb-6">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-2xl">R</span>
              </div>
            </div>
            <CardTitle className="text-3xl text-center text-foreground">Create Account</CardTitle>
            <p className="text-center text-muted-foreground text-sm">
              Join as a student or supervisor
            </p>
          </CardHeader>

          <CardContent className="space-y-5 px-0">
            {/* Error Message */}
            {(localError || authError) && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-destructive">{localError || authError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-medium text-foreground">Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-muted-foreground" size={20} />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                    disabled={authLoading}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-medium text-foreground">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-muted-foreground" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                    disabled={authLoading}
                    required
                  />
                </div>
              </div>

              {/* Phone (Optional) */}
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-medium text-foreground">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 801 234 5678"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                  disabled={authLoading}
                />
              </div>

              {/* Role Selection - Only Student and Supervisor */}
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-medium text-foreground">I am a <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {(['student', 'supervisor'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium capitalize ${
                        role === r
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-foreground hover:border-primary'
                      }`}
                    >
                      {r === 'student' ? (
                        <div className="flex items-center justify-center gap-2">
                          <GraduationCap size={16} />
                          Student
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Briefcase size={16} />
                          Supervisor
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Institution Selection */}
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-medium text-foreground">Institution <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 text-muted-foreground" size={20} />
                  <select
                    value={selectedInstitution}
                    onChange={(e) => setSelectedInstitution(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 appearance-none"
                    required
                    disabled={authLoading}
                  >
                    <option value="">Select Institution</option>
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Department Selection */}
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-medium text-foreground">Department <span className="text-red-500">*</span></label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  required
                  disabled={authLoading || !selectedInstitution}
                >
                  <option value="">
                    {!selectedInstitution 
                      ? 'Select an institution first' 
                      : filteredDepartments.length === 0 
                        ? 'No departments available'
                        : 'Select Department'
                    }
                  </option>
                  {filteredDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Select the department relevant to your role</p>
              </div>

              {/* Student-specific fields */}
              {role === 'student' && (
                <>
                  <div className="space-y-2 animate-slide-up">
                    <label className="text-sm font-medium text-foreground">Matric Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={matricNumber}
                      onChange={(e) => setMatricNumber(e.target.value)}
                      placeholder="e.g., MAT/2020/001"
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                      required
                      disabled={authLoading}
                    />
                  </div>

                  <div className="space-y-2 animate-slide-up">
                    <label className="text-sm font-medium text-foreground">Program <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-3 gap-2">
                      {programs.map((prog) => (
                        <button
                          key={prog.value}
                          type="button"
                          onClick={() => setProgram(prog.value as any)}
                          className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                            program === prog.value
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border text-foreground hover:border-primary'
                          }`}
                        >
                          {prog.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Supervisor-specific fields */}
              {role === 'supervisor' && (
                <div className="space-y-2 animate-slide-up">
                  <label className="text-sm font-medium text-foreground">Staff Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={staffNumber}
                    onChange={(e) => setStaffNumber(e.target.value)}
                    placeholder="e.g., ST-2024-001"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                    required
                    disabled={authLoading}
                  />
                </div>
              )}

              {/* Password */}
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-medium text-foreground">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-muted-foreground" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                    required
                    disabled={authLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">At least 8 characters</p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-medium text-foreground">Confirm Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-muted-foreground" size={20} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                    required
                    disabled={authLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2 animate-slide-up">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  id="terms"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border cursor-pointer mt-1"
                  disabled={authLoading}
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                  I agree to the <Link href="/terms" className="text-primary hover:underline">Terms and Conditions</Link>
                </label>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all duration-300 hover:shadow-lg animate-scale-in disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⚪</span>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center text-muted-foreground text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}