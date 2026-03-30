import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export interface Admin {
  id: string
  fullName: string
  email: string
  department?: string | null
  phoneNumber?: string | null
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR'
  isActive: boolean
  isEmailVerified: boolean
  lastLogin?: string | null
  createdAt: string
}

export interface AdminSignupData {
  fullName: string
  email: string
  password: string
  department?: string
  phoneNumber?: string
  adminCode?: string
}

export interface AdminLoginData {
  email: string
  password: string
}

export interface SendOTPData {
  email: string
  length?: number
  expiry?: number
  brandName?: string
  purpose: 'signup' | 'login' | 'reset_password' | 'verify_email'
  metadata?: Record<string, any>
}

export interface VerifyOTPData {
  email: string
  code: string
  otpId?: string
  purpose: 'signup' | 'login' | 'reset_password' | 'verify_email'
}

export interface ResendOTPData {
  email: string
  otpId?: string
  reason?: 'expired' | 'not_received' | 'new_request'
  purpose: 'signup' | 'login' | 'reset_password' | 'verify_email'
}

export interface OTPSession {
  email: string
  otpId: string
  purpose: string
  expiresAt: string
  isVerified: boolean
}

export interface ForgotPasswordResponse {
  id: string
  expiresAt: string
}

export interface SignupResponse {
  success: boolean
  message: string
  data: {
    admin: Admin
    email: string
    otpId: string
    expiresAt: string
  }
}

export interface OTPAuthState {
  // State
  admin: Admin | null
  token: string | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  otpSession: OTPSession | null
  pendingEmail: string | null

  // OTP Actions
  sendOTP: (data: SendOTPData) => Promise<{ id: string; expiresAt: string }>
  verifyOTP: (data: VerifyOTPData) => Promise<boolean>
  resendOTP: (data: ResendOTPData) => Promise<{ id: string; expiresAt: string }>
  clearOTPSession: () => void

  // Admin Auth Actions
  signup: (data: AdminSignupData) => Promise<SignupResponse>
  login: (data: AdminLoginData) => Promise<void>
  logout: () => void
  clearError: () => void
  checkAuth: () => Promise<boolean>
  forgotPassword: (email: string) => Promise<ForgotPasswordResponse>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>
  setPendingEmail: (email: string | null) => void
}

// API Base URLs
const OTP_API_BASE = process.env.NEXT_PUBLIC_DROPAPHI_URL || 'http://localhost:3001/api/v1'
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

// Create store with persistence
export const useAuthStore = create<OTPAuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      admin: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      otpSession: null,
      pendingEmail: null,

      // Send OTP using DropAPI
      sendOTP: async (data: SendOTPData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${OTP_API_BASE}/otp/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': process.env.NEXT_PUBLIC_DROPAPHI_KEY || 'da_test__dtHFb0DfG',
            },
            body: JSON.stringify({
              email: data.email,
              length: data.length || 6,
              expiry: data.expiry || 10,
              brandName: data.brandName || 'RTAS',
              metadata: {
                purpose: data.purpose,
                ...data.metadata,
              },
            }),
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || 'Failed to send OTP')
          }

          // Store OTP session
          const otpSession: OTPSession = {
            email: data.email,
            otpId: result.data.id,
            purpose: data.purpose,
            expiresAt: result.data.expiresAt,
            isVerified: false,
          }

          set({ 
            otpSession,
            isLoading: false,
            error: null
          })

          return { id: result.data.id, expiresAt: result.data.expiresAt }
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to send OTP'
          })
          throw error
        }
      },

      // Verify OTP using DropAPI
      verifyOTP: async (data: VerifyOTPData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${OTP_API_BASE}/otp/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': process.env.NEXT_PUBLIC_DROPAPHI_KEY || 'da_test__dtHFb0DfG',
            },
            body: JSON.stringify({
              email: data.email,
              code: data.code,
              id: data.otpId,
            }),
          })

          const result = await response.json()

          if (!response.ok) {
            if (result.attemptsRemaining !== undefined) {
              throw new Error(`Invalid code. ${result.attemptsRemaining} attempts remaining`)
            }
            throw new Error(result.error || 'Failed to verify OTP')
          }

          // If this is email verification, update the admin in your backend
          if (data.purpose === 'verify_email') {
            const verifyResponse = await fetch(`${API_BASE}/api/auth/admin/verify-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: data.email,
              }),
            })

            if (!verifyResponse.ok) {
              const verifyResult = await verifyResponse.json()
              throw new Error(verifyResult.message || 'Failed to verify email')
            }
          }

          // Update OTP session
          if (get().otpSession?.email === data.email) {
            set({ 
              otpSession: { 
                ...get().otpSession!, 
                isVerified: true 
              },
              isLoading: false
            })
          } else {
            set({ isLoading: false })
          }

          return true
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to verify OTP'
          })
          throw error
        }
      },

      // Resend OTP using DropAPI
      resendOTP: async (data: ResendOTPData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${OTP_API_BASE}/otp/resend`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': process.env.NEXT_PUBLIC_DROPAPHI_KEY || 'da_test__dtHFb0DfG',
            },
            body: JSON.stringify({
              email: data.email,
              otpId: data.otpId,
              reason: data.reason || 'not_received',
              brandName: 'RTAS',
              metadata: {
                purpose: data.purpose,
              },
            }),
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || 'Failed to resend OTP')
          }

          // Update OTP session
          set({ 
            otpSession: {
              email: data.email,
              otpId: result.data.id,
              purpose: data.purpose,
              expiresAt: result.data.expiresAt,
              isVerified: false,
            },
            isLoading: false
          })

          return { id: result.data.id, expiresAt: result.data.expiresAt }
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to resend OTP'
          })
          throw error
        }
      },

      // Clear OTP session
      clearOTPSession: () => set({ otpSession: null, error: null, pendingEmail: null }),

      // Set pending email
      setPendingEmail: (email: string | null) => set({ pendingEmail: email }),

      // Signup - creates admin account (OTP is sent by the API)
      signup: async (data: AdminSignupData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/auth/admin/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fullName: data.fullName,
              email: data.email,
              password: data.password,
              department: data.department,
              phoneNumber: data.phoneNumber,
              adminCode: data.adminCode,
            }),
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || result.message || 'Failed to create admin account')
          }

          // Store OTP session from the response
          if (result.data) {
            const otpSession: OTPSession = {
              email: result.data.email,
              otpId: result.data.otpId,
              purpose: 'verify_email',
              expiresAt: result.data.expiresAt,
              isVerified: false,
            }

            set({ 
              isLoading: false,
              error: null,
              otpSession,
              pendingEmail: result.data.email
            })
          } else {
            set({ 
              isLoading: false,
              error: null,
              pendingEmail: result.email || data.email
            })
          }

          return result
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'An error occurred during signup'
          })
          throw error
        }
      },

      // Login
      login: async (data: AdminLoginData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/auth/admin/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include', 
          })

          const result = await response.json()

          if (!response.ok) {
            // Handle email not verified case
            if (response.status === 403 && result.message?.includes('verify your email')) {
              set({ 
                pendingEmail: data.email,
                isLoading: false,
                error: result.message
              })
              throw new Error('EMAIL_NOT_VERIFIED')
            }
            throw new Error(result.message || 'Failed to login')
          }

          set({ 
            admin: result.admin,
            token: result.token,
            isLoading: false,
            error: null,
            isAuthenticated: true,
            pendingEmail: null
          })

          localStorage.setItem('adminToken', result.token)
          
        } catch (error: any) {
          if (error.message !== 'EMAIL_NOT_VERIFIED') {
            set({ 
              isLoading: false, 
              error: error.message || 'An error occurred during login'
            })
          }
          throw error
        }
      },

      // Forgot Password - Send OTP
      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const otpResult = await get().sendOTP({
            email,
            purpose: 'reset_password',
            brandName: 'RTAS',
            expiry: 15
          })

          set({ isLoading: false })
          
          return otpResult
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to send reset code'
          })
          throw error
        }
      },

      // Reset Password with OTP
      resetPassword: async (email: string, code: string, newPassword: string) => {
        set({ isLoading: true, error: null })
        
        try {
          // First verify OTP
          await get().verifyOTP({
            email,
            code,
            purpose: 'reset_password'
          })

          // Then reset password
          const response = await fetch(`${API_BASE}/api/auth/admin/reset-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              newPassword,
            }),
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to reset password')
          }

          set({ 
            isLoading: false,
            error: null,
            otpSession: null
          })

        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to reset password'
          })
          throw error
        }
      },

      // Logout
     logout: async () => {
        try {
            // Call logout endpoint to clear cookie
            await fetch(`${API_BASE}/api/auth/admin/logout`, {
            method: 'POST',
            credentials: 'include', 
            })
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            // Clear local storage and state
            localStorage.removeItem('adminToken')
            set({ 
            admin: null, 
            token: null, 
            isAuthenticated: false,
            error: null,
            otpSession: null,
            pendingEmail: null
            })
        }
        },

      // Clear error
      clearError: () => set({ error: null }),

      // Check authentication
      checkAuth: async () => {
        const { token, admin } = get()
        
        if (!token || !admin) {
          return false
        }

        try {
          const response = await fetch(`${API_BASE}/api/auth/admin/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              credentials: 'include', 
            }
          })

          if (!response.ok) {
            throw new Error('Invalid token')
          }

          const data = await response.json()
          
          set({ 
            admin: data.admin,
            isAuthenticated: true 
          })
          
          return true
        } catch (error) {
          localStorage.removeItem('adminToken')
          set({ 
            admin: null, 
            token: null, 
            isAuthenticated: false 
          })
          return false
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        admin: state.admin, 
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
)

// Selector hooks
export const useAdmin = () => useAuthStore((state) => state.admin)
export const useAuth = () => useAuthStore((state) => ({
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  error: state.error,
  otpSession: state.otpSession,
  pendingEmail: state.pendingEmail
}))













