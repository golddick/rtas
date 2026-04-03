'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, User, Shield, Building2, Phone, CheckCircle, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { useAuthStore } from '@/store/admin/adminAuthStore'

export default function AdminSignupPage() {
  const router = useRouter()
  const { signup, isLoading: storeLoading, error: storeError, clearError } = useAuthStore()
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [localError, setLocalError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminCode: '',
    termsAccepted: false
  })

  // Sync store error with local error
  useEffect(() => {
    if (storeError) {
      setLocalError(storeError)
    }
  }, [storeError])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setLocalError('')
    if (storeError) clearError()
  }

  const validateForm = (): boolean => {
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setLocalError('Please fill in all required fields')
      return false
    }

    if (formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters long')
      return false
    }

    const hasUpperCase = /[A-Z]/.test(formData.password)
    const hasNumber = /[0-9]/.test(formData.password)
    
    if (!hasUpperCase || !hasNumber) {
      setLocalError('Password must contain at least one uppercase letter and one number')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match')
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
    setSuccess('')

    if (!validateForm()) {
      return
    }

    try {
      const result = await signup({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        adminCode: formData.adminCode || undefined
      })

      setSuccess('Account created successfully! Redirecting to verification...')
      
      // Redirect to verification page with email and otpId
      setTimeout(() => {
        if (result.data?.otpId) {
          router.push(`/auth/admin/verify-email?email=${encodeURIComponent(result.data.email)}&otpId=${result.data.otpId}`)
        } else {
          router.push(`/auth/admin/verify-email?email=${encodeURIComponent(formData.email)}`)
        }
      }, 1500)
      
    } catch (error: any) {
      // Error is handled by store
    }
  }

  const getPasswordStrength = (password: string): { strength: number; message: string } => {
    if (!password) return { strength: 0, message: '' }
    
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1
    
    const messages = ['Weak', 'Fair', 'Good', 'Strong']
    return { 
      strength, 
      message: strength > 0 ? messages[strength - 1] : 'Very Weak' 
    }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Column - Branding (Fixed) */}
      <div className="hidden md:flex md:w-1/2 lg:w-1/2 bg-gradient-to-br from-primary/10 to-primary/5 flex-col justify-center items-center p-12 border-r border-border animate-fade-in fixed left-0 top-0 bottom-0 overflow-y-auto">
        <div className="max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Shield className="text-primary-foreground" size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">Admin Portal</h1>
          <p className="text-lg text-muted-foreground">
            Create your system administrator account to manage the Research Topic Approval Workflow System
          </p>
          <div className="pt-8 space-y-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle className="text-primary" size={20} />
              </div>
              <p className="text-foreground">Full system configuration</p>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle className="text-primary" size={20} />
              </div>
              <p className="text-foreground">User and role management</p>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle className="text-primary" size={20} />
              </div>
              <p className="text-foreground">Department oversight</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Signup Form (Scrollable) */}
      <div className="w-full md:w-1/2 md:ml-[50%] flex flex-col justify-center items-center p-6 sm:p-12 overflow-y-auto min-h-screen">
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent p-0">
          <CardHeader className="mb-6 space-y-2 px-0">
            <div className="flex md:hidden justify-center mb-6">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="text-primary-foreground" size={24} />
              </div>
            </div>
            <CardTitle className="text-3xl text-center text-foreground">
              Create Admin Account
            </CardTitle>
            <p className="text-center text-muted-foreground text-sm">
              Register as a system administrator to manage the RTAS platform
            </p>
          </CardHeader>

          <CardContent className="space-y-6 px-0">
            {/* Error Message */}
            {localError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3 animate-shake">
                <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-destructive">{localError}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-3">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-green-500">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name Input */}
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-medium text-foreground">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-muted-foreground" size={20} />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                    disabled={storeLoading}
                    required
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-medium text-foreground">
                  Email Address <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-muted-foreground" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@university.edu"
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                    disabled={storeLoading}
                    required
                  />
                </div>
              </div>

              {/* Admin Code Input */}
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-medium text-foreground">Admin Registration Code</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 text-muted-foreground" size={20} />
                  <input
                    type="text"
                    name="adminCode"
                    value={formData.adminCode}
                    onChange={handleChange}
                    placeholder="Enter admin registration code"
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                    disabled={storeLoading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-medium text-foreground">
                  Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-muted-foreground" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                    disabled={storeLoading}
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
                
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`flex-1 rounded-full transition-all duration-300 ${
                            level <= passwordStrength.strength
                              ? level === 1
                                ? 'bg-red-500'
                                : level === 2
                                ? 'bg-yellow-500'
                                : level === 3
                                ? 'bg-blue-500'
                                : 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs mt-1 ${
                      passwordStrength.strength <= 1 
                        ? 'text-red-500' 
                        : passwordStrength.strength === 2 
                        ? 'text-yellow-500' 
                        : passwordStrength.strength === 3 
                        ? 'text-blue-500' 
                        : 'text-green-500'
                    }`}>
                      Password strength: {passwordStrength.message}
                    </p>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 8 characters with at least one uppercase letter and one number
                </p>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-medium text-foreground">
                  Confirm Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-muted-foreground" size={20} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'border-destructive'
                        : 'border-border'
                    }`}
                    disabled={storeLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start gap-2 animate-slide-up">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  id="terms"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="w-4 h-4 mt-1 rounded border-border cursor-pointer"
                  disabled={storeLoading}
                  required
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                  I accept the{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Signup Button */}
              <button
                type="submit"
                disabled={storeLoading}
                className="w-full px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all duration-300 hover:shadow-lg animate-scale-in disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {storeLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">Already have an account?</span>
              </div>
            </div>

            {/* Login Link */}
            <Link
              href="/auth/admin/login"
              className="w-full px-4 py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-all duration-300 text-center block"
            >
              Sign In Instead
            </Link>
          </CardContent>
        </Card>


      </div>
    </div>
  )
}








// 'use client'

// import Link from 'next/link'
// import { useRouter } from 'next/navigation'
// import { Mail, Lock, Eye, EyeOff, User, Shield, Building2, Phone, CheckCircle, AlertCircle } from 'lucide-react'
// import { useState, useEffect } from 'react'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
// import { useAuthStore } from '@/store/admin/adminAuthStore'

// export default function AdminSignupPage() {
//   const router = useRouter()
//   const { signup, isLoading: storeLoading, error: storeError, clearError } = useAuthStore()
  
//   const [showPassword, setShowPassword] = useState(false)
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false)
//   const [localError, setLocalError] = useState('')
//   const [success, setSuccess] = useState('')

//   const [formData, setFormData] = useState({
//     fullName: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     adminCode: '',
//     termsAccepted: false
//   })

//   // Sync store error with local error
//   useEffect(() => {
//     if (storeError) {
//       setLocalError(storeError)
//     }
//   }, [storeError])

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value, type, checked } = e.target
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }))
//     setLocalError('')
//     if (storeError) clearError()
//   }

//   const validateForm = (): boolean => {
//     if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
//       setLocalError('Please fill in all required fields')
//       return false
//     }

//     if (formData.password.length < 8) {
//       setLocalError('Password must be at least 8 characters long')
//       return false
//     }

//     const hasUpperCase = /[A-Z]/.test(formData.password)
//     const hasNumber = /[0-9]/.test(formData.password)
    
//     if (!hasUpperCase || !hasNumber) {
//       setLocalError('Password must contain at least one uppercase letter and one number')
//       return false
//     }

//     if (formData.password !== formData.confirmPassword) {
//       setLocalError('Passwords do not match')
//       return false
//     }

//     if (!formData.termsAccepted) {
//       setLocalError('You must accept the terms and conditions')
//       return false
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
//     if (!emailRegex.test(formData.email)) {
//       setLocalError('Please enter a valid email address')
//       return false
//     }

//     return true
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLocalError('')
//     setSuccess('')

//     if (!validateForm()) {
//       return
//     }

//     try {
//       const result = await signup({
//         fullName: formData.fullName,
//         email: formData.email,
//         password: formData.password,
//         adminCode: formData.adminCode || undefined
//       })

//       setSuccess('Account created successfully! Redirecting to verification...')
      
//       // Redirect to verification page with email and otpId
//       setTimeout(() => {
//         if (result.data?.otpId) {
//           router.push(`/auth/admin/verify-email?email=${encodeURIComponent(result.data.email)}&otpId=${result.data.otpId}`)
//         } else {
//           router.push(`/auth/admin/verify-email?email=${encodeURIComponent(formData.email)}`)
//         }
//       }, 1500)
      
//     } catch (error: any) {
//       // Error is handled by store
//     }
//   }

//   const getPasswordStrength = (password: string): { strength: number; message: string } => {
//     if (!password) return { strength: 0, message: '' }
    
//     let strength = 0
//     if (password.length >= 8) strength += 1
//     if (/[A-Z]/.test(password)) strength += 1
//     if (/[0-9]/.test(password)) strength += 1
//     if (/[^A-Za-z0-9]/.test(password)) strength += 1
    
//     const messages = ['Weak', 'Fair', 'Good', 'Strong']
//     return { 
//       strength, 
//       message: strength > 0 ? messages[strength - 1] : 'Very Weak' 
//     }
//   }

//   const passwordStrength = getPasswordStrength(formData.password)

//   return (
//     <div className="min-h-screen bg-background flex">
//       {/* Left Column - Branding */}
//       <div className="hidden md:flex md:w-1/2 lg:w-1/2 bg-gradient-to-br from-primary/10 to-primary/5 flex-col justify-center items-center p-12 border-r border-border animate-fade-in">
//         <div className="max-w-md space-y-6 text-center">
//           <div className="flex justify-center">
//             <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
//               <Shield className="text-primary-foreground" size={32} />
//             </div>
//           </div>
//           <h1 className="text-4xl font-bold text-foreground">Admin Portal</h1>
//           <p className="text-lg text-muted-foreground">
//             Create your system administrator account to manage the Research Topic Approval Workflow System
//           </p>
//           <div className="pt-8 space-y-4">
//             <div className="flex items-center gap-3 text-left">
//               <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
//                 <CheckCircle className="text-primary" size={20} />
//               </div>
//               <p className="text-foreground">Full system configuration</p>
//             </div>
//             <div className="flex items-center gap-3 text-left">
//               <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
//                 <CheckCircle className="text-primary" size={20} />
//               </div>
//               <p className="text-foreground">User and role management</p>
//             </div>
//             <div className="flex items-center gap-3 text-left">
//               <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
//                 <CheckCircle className="text-primary" size={20} />
//               </div>
//               <p className="text-foreground">Department oversight</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Right Column - Signup Form */}
//       <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 animate-slide-up">
//         <Card className="w-full max-w-md border-0 shadow-none bg-transparent p-0">
//           <CardHeader className="mb-6 space-y-2 px-0">
//             <div className="flex md:hidden justify-center mb-6">
//               <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
//                 <Shield className="text-primary-foreground" size={24} />
//               </div>
//             </div>
//             <CardTitle className="text-3xl text-center text-foreground">
//               Create Admin Account
//             </CardTitle>
//             <p className="text-center text-muted-foreground text-sm">
//               Register as a system administrator to manage the RTAS platform
//             </p>
//           </CardHeader>

//           <CardContent className="space-y-6 px-0">
//             {/* Error Message */}
//             {localError && (
//               <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3 animate-shake">
//                 <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
//                 <p className="text-sm text-destructive">{localError}</p>
//               </div>
//             )}

//             {/* Success Message */}
//             {success && (
//               <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-3">
//                 <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
//                 <p className="text-sm text-green-500">{success}</p>
//               </div>
//             )}

//             <form onSubmit={handleSubmit} className="space-y-4">
//               {/* Full Name Input */}
//               <div className="space-y-2 animate-slide-up">
//                 <label className="text-sm font-medium text-foreground">
//                   Full Name <span className="text-destructive">*</span>
//                 </label>
//                 <div className="relative">
//                   <User className="absolute left-3 top-3 text-muted-foreground" size={20} />
//                   <input
//                     type="text"
//                     name="fullName"
//                     value={formData.fullName}
//                     onChange={handleChange}
//                     placeholder="John Doe"
//                     className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
//                     disabled={storeLoading}
//                     required
//                   />
//                 </div>
//               </div>

//               {/* Email Input */}
//               <div className="space-y-2 animate-slide-up">
//                 <label className="text-sm font-medium text-foreground">
//                   Email Address <span className="text-destructive">*</span>
//                 </label>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-3 text-muted-foreground" size={20} />
//                   <input
//                     type="email"
//                     name="email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     placeholder="admin@university.edu"
//                     className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
//                     disabled={storeLoading}
//                     required
//                   />
//                 </div>
//               </div>


//               {/* Admin Code Input */}
//               <div className="space-y-2 animate-slide-up">
//                 <label className="text-sm font-medium text-foreground">Admin Registration Code</label>
//                 <div className="relative">
//                   <Shield className="absolute left-3 top-3 text-muted-foreground" size={20} />
//                   <input
//                     type="text"
//                     name="adminCode"
//                     value={formData.adminCode}
//                     onChange={handleChange}
//                     placeholder="Enter admin registration code"
//                     className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
//                     disabled={storeLoading}
//                   />
//                 </div>
//               </div>

//               {/* Password Input */}
//               <div className="space-y-2 animate-slide-up">
//                 <label className="text-sm font-medium text-foreground">
//                   Password <span className="text-destructive">*</span>
//                 </label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-3 text-muted-foreground" size={20} />
//                   <input
//                     type={showPassword ? 'text' : 'password'}
//                     name="password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     placeholder="••••••••"
//                     className="w-full pl-10 pr-10 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
//                     disabled={storeLoading}
//                     required
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
//                   >
//                     {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                   </button>
//                 </div>
                
//                 {/* Password strength indicator */}
//                 {formData.password && (
//                   <div className="mt-2">
//                     <div className="flex gap-1 h-1">
//                       {[1, 2, 3, 4].map((level) => (
//                         <div
//                           key={level}
//                           className={`flex-1 rounded-full transition-all duration-300 ${
//                             level <= passwordStrength.strength
//                               ? level === 1
//                                 ? 'bg-red-500'
//                                 : level === 2
//                                 ? 'bg-yellow-500'
//                                 : level === 3
//                                 ? 'bg-blue-500'
//                                 : 'bg-green-500'
//                               : 'bg-gray-200'
//                           }`}
//                         />
//                       ))}
//                     </div>
//                     <p className={`text-xs mt-1 ${
//                       passwordStrength.strength <= 1 
//                         ? 'text-red-500' 
//                         : passwordStrength.strength === 2 
//                         ? 'text-yellow-500' 
//                         : passwordStrength.strength === 3 
//                         ? 'text-blue-500' 
//                         : 'text-green-500'
//                     }`}>
//                       Password strength: {passwordStrength.message}
//                     </p>
//                   </div>
//                 )}
                
//                 <p className="text-xs text-muted-foreground mt-1">
//                   Minimum 8 characters with at least one uppercase letter and one number
//                 </p>
//               </div>

//               {/* Confirm Password Input */}
//               <div className="space-y-2 animate-slide-up">
//                 <label className="text-sm font-medium text-foreground">
//                   Confirm Password <span className="text-destructive">*</span>
//                 </label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-3 text-muted-foreground" size={20} />
//                   <input
//                     type={showConfirmPassword ? 'text' : 'password'}
//                     name="confirmPassword"
//                     value={formData.confirmPassword}
//                     onChange={handleChange}
//                     placeholder="••••••••"
//                     className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground ${
//                       formData.confirmPassword && formData.password !== formData.confirmPassword
//                         ? 'border-destructive'
//                         : 'border-border'
//                     }`}
//                     disabled={storeLoading}
//                     required
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                     className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
//                   >
//                     {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                   </button>
//                 </div>
//                 {formData.confirmPassword && formData.password !== formData.confirmPassword && (
//                   <p className="text-xs text-destructive mt-1">Passwords do not match</p>
//                 )}
//               </div>

//               {/* Terms and Conditions */}
//               <div className="flex items-start gap-2 animate-slide-up">
//                 <input
//                   type="checkbox"
//                   name="termsAccepted"
//                   id="terms"
//                   checked={formData.termsAccepted}
//                   onChange={handleChange}
//                   className="w-4 h-4 mt-1 rounded border-border cursor-pointer"
//                   disabled={storeLoading}
//                   required
//                 />
//                 <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
//                   I accept the{' '}
//                   <Link href="/terms" className="text-primary hover:underline">
//                     Terms and Conditions
//                   </Link>{' '}
//                   and{' '}
//                   <Link href="/privacy" className="text-primary hover:underline">
//                     Privacy Policy
//                   </Link>
//                 </label>
//               </div>

//               {/* Signup Button */}
//               <button
//                 type="submit"
//                 disabled={storeLoading}
//                 className="w-full px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all duration-300 hover:shadow-lg animate-scale-in disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {storeLoading ? (
//                   <span className="flex items-center justify-center gap-2">
//                     <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                     </svg>
//                     Creating Account...
//                   </span>
//                 ) : (
//                   'Create Account'
//                 )}
//               </button>
//             </form>

//             {/* Divider */}
//             <div className="relative">
//               <div className="absolute inset-0 flex items-center">
//                 <div className="w-full border-t border-border"></div>
//               </div>
//               <div className="relative flex justify-center text-sm">
//                 <span className="px-2 bg-background text-muted-foreground">Already have an account?</span>
//               </div>
//             </div>

//             {/* Login Link */}
//             <Link
//               href="/auth/admin/login"
//               className="w-full px-4 py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-all duration-300 text-center block"
//             >
//               Sign In Instead
//             </Link>
//           </CardContent>
//         </Card>

//         {/* Help Text */}
//         <p className="text-center text-muted-foreground text-xs mt-8 max-w-md">
//           Need help? <Link href="/admin/support" className="text-primary hover:underline">Contact support</Link>
//         </p>
//       </div>
//     </div>
//   )
// }