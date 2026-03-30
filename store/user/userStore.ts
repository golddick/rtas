// store/auth/authStore.ts (updated - fix the selector functions)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

export interface SignupData {
  email: string
  fullName: string
  password: string
  role: 'HOD' | 'SUPERVISOR' | 'STUDENT'
  phone?: string
  institutionId?: string
  departmentId?: string
  // Student specific
  matricNumber?: string
  program?: 'BSC' | 'MSC' | 'PHD'
  // Staff specific 
  staffNumber?: string
  supervisorDepartmentId?: string
  // Invitation
  invitationCode?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  password: string
}

export interface User {
  id: string
  email: string
  fullName: string
  role: string
  phone?: string | null
  additionalEmail?: string | null
  emailVerified?: boolean
  matricNumber?: string | null
  staffNumber?: string | null
  program?: string | null
  institution?: {
    id: string
    name: string
    code: string
    slug: string
  } | null
  department?: {
    id: string
    name: string
    code: string
  } | null
  supervisorDepartment?: {
    id: string
    name: string
    code: string
  } | null
}

export interface UpdateProfileData {
  fullName?: string
  phone?: string | null
  additionalEmail?: string | null
  matricNumber?: string | null
  staffNumber?: string | null
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

interface AuthState {
  // State
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  signupStep: 'form' | 'otp' | 'success'
  signupData: Partial<SignupData>
  
  // Password reset state
  forgotPasswordLoading: boolean
  forgotPasswordError: string | null
  forgotPasswordSuccess: boolean
  forgotPasswordMessage: string | null
  resetPasswordLoading: boolean
  resetPasswordError: string | null
  resetPasswordSuccess: boolean
  resetPasswordMessage: string | null

  // Actions
  signup: (data: SignupData) => Promise<User>
  login: (data: LoginData) => Promise<User>
  logout: () => void 
  clearError: () => void
  setSignupStep: (step: 'form' | 'otp' | 'success') => void
  updateSignupData: (data: Partial<SignupData>) => void
  resetSignup: () => void
  checkEmailExists: (email: string) => Promise<boolean>
  updateEmailVerification: (email: string) => Promise<boolean>
  
  // Password Reset Actions
  forgotPassword: (data: ForgotPasswordData) => Promise<void>
  resetPassword: (data: ResetPasswordData) => Promise<void>
  clearForgotPasswordState: () => void
  clearResetPasswordState: () => void
  
  // Profile Management
  updateUserProfile: (data: UpdateProfileData) => Promise<User>
  updatePassword: (data: ChangePasswordData) => Promise<void>
  deleteAccount: () => Promise<void>
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      signupStep: 'form',
      signupData: {},
      
      // Password reset initial state
      forgotPasswordLoading: false,
      forgotPasswordError: null,
      forgotPasswordSuccess: false,
      forgotPasswordMessage: null,
      resetPasswordLoading: false,
      resetPasswordError: null,
      resetPasswordSuccess: false,
      resetPasswordMessage: null,

      // Signup
      signup: async (data: SignupData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/auth/user/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Signup failed')
          }

          set({ 
            isLoading: false,
            signupStep: 'success',
            signupData: data
          })

          return result.data
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Signup failed'
          })
          throw error
        }
      },

      // Login
      login: async (data: LoginData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/auth/user/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Login failed')
          }

          set({ 
            user: result.data.user,
            token: result.data.token,
            isLoading: false,
            error: null,
            isAuthenticated: true
          })

          localStorage.setItem('auth_token', result.data.token)
          
          return result.data.user
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Login failed'
          })
          throw error
        }
      },

      // Logout
      logout: () => {
        localStorage.removeItem('auth_token')
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          error: null,
          signupData: {},
          signupStep: 'form',
          // Reset password states
          forgotPasswordLoading: false,
          forgotPasswordError: null,
          forgotPasswordSuccess: false,
          forgotPasswordMessage: null,
          resetPasswordLoading: false,
          resetPasswordError: null,
          resetPasswordSuccess: false,
          resetPasswordMessage: null,
        })
      },

      // Forgot Password
      forgotPassword: async (data: ForgotPasswordData) => {
        set({ 
          forgotPasswordLoading: true, 
          forgotPasswordError: null,
          forgotPasswordSuccess: false,
          forgotPasswordMessage: null
        })
        
        try {
          const response = await fetch(`${API_BASE}/api/auth/user/forgot-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || 'Failed to send reset link')
          }

          set({ 
            forgotPasswordSuccess: true,
            forgotPasswordMessage: result.message,
            forgotPasswordLoading: false
          })
        } catch (error: any) {
          set({ 
            forgotPasswordError: error.message || 'Failed to send reset link',
            forgotPasswordLoading: false,
            forgotPasswordSuccess: false
          })
          throw error
        }
      },

      // Reset Password
      resetPassword: async (data: ResetPasswordData) => {
        set({ 
          resetPasswordLoading: true, 
          resetPasswordError: null,
          resetPasswordSuccess: false,
          resetPasswordMessage: null
        })
        
        try {
          const response = await fetch(`${API_BASE}/api/auth/user/reset-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || 'Failed to reset password')
          }

          set({ 
            resetPasswordSuccess: true,
            resetPasswordMessage: result.message,
            resetPasswordLoading: false
          })
        } catch (error: any) {
          set({ 
            resetPasswordError: error.message || 'Failed to reset password',
            resetPasswordLoading: false,
            resetPasswordSuccess: false
          })
          throw error
        }
      },

      // Clear Forgot Password State
      clearForgotPasswordState: () => {
        set({
          forgotPasswordLoading: false,
          forgotPasswordError: null,
          forgotPasswordSuccess: false,
          forgotPasswordMessage: null,
        })
      },

      // Clear Reset Password State
      clearResetPasswordState: () => {
        set({
          resetPasswordLoading: false,
          resetPasswordError: null,
          resetPasswordSuccess: false,
          resetPasswordMessage: null,
        })
      },

      // Update Email Verification
      updateEmailVerification: async (email: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/auth/user/verify-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to verify email')
          }

          // Update the user in store if they're logged in
          const currentUser = get().user
          if (currentUser && currentUser.email === email) {
            set({ 
              user: { ...currentUser, emailVerified: true },
              isLoading: false 
            })
          } else {
            set({ isLoading: false })
          }

          return true
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to verify email'
          })
          return false
        }
      },

      // Update User Profile
      updateUserProfile: async (data: UpdateProfileData) => {
        set({ isLoading: true, error: null })
        
        try {
          const token = get().token
          if (!token) {
            throw new Error('Not authenticated')
          }

          const response = await fetch(`${API_BASE}/api/auth/user/profile`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to update profile')
          }

          // Merge the updated data with current user
          const currentUser = get().user
          set({ 
            user: currentUser ? { ...currentUser, ...result.data } : null,
            isLoading: false 
          })

          return result.data
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to update profile'
          })
          throw error
        }
      },

      // Update Password
      updatePassword: async ({ currentPassword, newPassword }: ChangePasswordData) => {
        set({ isLoading: true, error: null })
        
        try {
          const token = get().token
          if (!token) {
            throw new Error('Not authenticated')
          }

          const response = await fetch(`${API_BASE}/api/auth/user/change-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword }),
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to update password')
          }

          set({ isLoading: false })
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to update password'
          })
          throw error
        }
      },

      // Delete Account
      deleteAccount: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const token = get().token
          if (!token) {
            throw new Error('Not authenticated')
          }

          const response = await fetch(`${API_BASE}/api/auth/user/delete-account`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to delete account')
          }

          // Clear all stored data
          localStorage.removeItem('auth_token')
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false,
            isLoading: false,
            error: null,
            signupData: {},
            signupStep: 'form'
          })
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to delete account'
          })
          throw error
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Signup step management
      setSignupStep: (step) => set({ signupStep: step }),
      
      updateSignupData: (data) => set({ 
        signupData: { ...get().signupData, ...data } 
      }),
      
      resetSignup: () => set({ 
        signupStep: 'form', 
        signupData: {} 
      }),

      // Check if email exists
      checkEmailExists: async (email: string) => {
        try {
          const response = await fetch(`${API_BASE}/api/auth/user/check-email?email=${encodeURIComponent(email)}`, {
            credentials: 'include',
          })
          const result = await response.json()
          return result.exists
        } catch (error) {
          console.error('Failed to check email:', error)
          return false
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
)

// Selector hooks - FIXED with memoization
export const useUser = () => useAuthStore((state) => state.user)

export const useAuth = () => useAuthStore(
  useShallow((state) => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    signupStep: state.signupStep
  }))
)

// Password reset selectors - FIXED with useShallow
export const useForgotPassword = () => {
  const forgotPassword = useAuthStore((state) => state.forgotPassword)
  const clearState = useAuthStore((state) => state.clearForgotPasswordState)
  const state = useAuthStore(
    useShallow((state) => ({
      loading: state.forgotPasswordLoading,
      error: state.forgotPasswordError,
      success: state.forgotPasswordSuccess,
      message: state.forgotPasswordMessage,
    }))
  )
  
  return {
    ...state,
    forgotPassword,
    clearState
  }
}

export const useResetPassword = () => {
  const resetPassword = useAuthStore((state) => state.resetPassword)
  const clearState = useAuthStore((state) => state.clearResetPasswordState)
  const state = useAuthStore(
    useShallow((state) => ({
      loading: state.resetPasswordLoading,
      error: state.resetPasswordError,
      success: state.resetPasswordSuccess,
      message: state.resetPasswordMessage,
    }))
  )
  
  return {
    ...state,
    resetPassword,
    clearState
  }
}













// import { create } from 'zustand'
// import { persist } from 'zustand/middleware'

// export interface SignupData {
//   email: string
//   fullName: string
//   password: string
//   role: 'HOD' | 'SUPERVISOR' | 'STUDENT'
//   phone?: string
//   institutionId?: string
//   departmentId?: string
//   // Student specific
//   matricNumber?: string
//   program?: 'BSC' | 'MSC' | 'PHD'
//   // Staff specific 
//   staffNumber?: string
//   supervisorDepartmentId?: string
//   // Invitation
//   invitationCode?: string
// }

// export interface LoginData {
//   email: string
//   password: string
// }

// export interface User {
//   id: string
//   email: string
//   fullName: string
//   role: string
//   phone?: string | null
//   additionalEmail?: string | null
//   emailVerified?: boolean
//   matricNumber?: string | null
//   staffNumber?: string | null
//   program?: string | null
//   institution?: {
//     id: string
//     name: string
//     code: string
//     slug: string
//   } | null
//   department?: {
//     id: string
//     name: string
//     code: string
//   } | null
//   supervisorDepartment?: {
//     id: string
//     name: string
//     code: string
//   } | null
// }

// export interface UpdateProfileData {
//   fullName?: string
//   phone?: string | null
//   additionalEmail?: string | null
//   matricNumber?: string | null
//   staffNumber?: string | null
// }

// export interface ChangePasswordData {
//   currentPassword: string
//   newPassword: string
// }

// interface AuthState {
//   // State
//   user: User | null
//   token: string | null
//   isLoading: boolean
//   error: string | null
//   isAuthenticated: boolean
//   signupStep: 'form' | 'otp' | 'success'
//   signupData: Partial<SignupData>

//   // Actions
//   signup: (data: SignupData) => Promise<User>
//   login: (data: LoginData) => Promise<User>
//   logout: () => void 
//   clearError: () => void
//   setSignupStep: (step: 'form' | 'otp' | 'success') => void
//   updateSignupData: (data: Partial<SignupData>) => void
//   resetSignup: () => void
//   checkEmailExists: (email: string) => Promise<boolean>
//   updateEmailVerification: (email: string) => Promise<boolean>
  
//   // Profile Management
//   updateUserProfile: (data: UpdateProfileData) => Promise<User>
//   updatePassword: (data: ChangePasswordData) => Promise<void>
//   deleteAccount: () => Promise<void>
// }

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

// export const useAuthStore = create<AuthState>()(
//   persist(
//     (set, get) => ({
//       // Initial state
//       user: null,
//       token: null,
//       isLoading: false,
//       error: null,
//       isAuthenticated: false,
//       signupStep: 'form',
//       signupData: {},

//       // Signup
//       signup: async (data: SignupData) => {
//         set({ isLoading: true, error: null })
        
//         try {
//           const response = await fetch(`${API_BASE}/api/auth/user/signup`, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(data),
//           })

//           const result = await response.json()

//           if (!response.ok) {
//             throw new Error(result.message || 'Signup failed')
//           }

//           set({ 
//             isLoading: false,
//             signupStep: 'success',
//             signupData: data
//           })

//           return result.data
//         } catch (error: any) {
//           set({ 
//             isLoading: false, 
//             error: error.message || 'Signup failed'
//           })
//           throw error
//         }
//       },

//       // Login
//       login: async (data: LoginData) => {
//         set({ isLoading: true, error: null })
        
//         try {
//           const response = await fetch(`${API_BASE}/api/auth/user/login`, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(data),
//             credentials: 'include',
//           })

//           const result = await response.json()

//           if (!response.ok) {
//             throw new Error(result.message || 'Login failed')
//           }

//           set({ 
//             user: result.data.user,
//             token: result.data.token,
//             isLoading: false,
//             error: null,
//             isAuthenticated: true
//           })

//           localStorage.setItem('auth_token', result.data.token)
          
//           return result.data.user
//         } catch (error: any) {
//           set({ 
//             isLoading: false, 
//             error: error.message || 'Login failed'
//           })
//           throw error
//         }
//       },

//       // Logout
//       logout: () => {
//         localStorage.removeItem('auth_token')
//         set({ 
//           user: null, 
//           token: null, 
//           isAuthenticated: false,
//           error: null,
//           signupData: {},
//           signupStep: 'form'
//         })
//       },

//       // Update Email Verification
//       updateEmailVerification: async (email: string) => {
//         set({ isLoading: true, error: null })
        
//         try {
//           const response = await fetch(`${API_BASE}/api/auth/user/verify-email`, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ email }),
//           })

//           const result = await response.json()

//           if (!response.ok) {
//             throw new Error(result.message || 'Failed to verify email')
//           }

//           // Update the user in store if they're logged in
//           const currentUser = get().user
//           if (currentUser && currentUser.email === email) {
//             set({ 
//               user: { ...currentUser, emailVerified: true },
//               isLoading: false 
//             })
//           } else {
//             set({ isLoading: false })
//           }

//           return true
//         } catch (error: any) {
//           set({ 
//             isLoading: false, 
//             error: error.message || 'Failed to verify email'
//           })
//           return false
//         }
//       },

//       // Update User Profile
//       updateUserProfile: async (data: UpdateProfileData) => {
//         set({ isLoading: true, error: null })
        
//         try {
//           const token = get().token
//           if (!token) {
//             throw new Error('Not authenticated')
//           }

//           const response = await fetch(`${API_BASE}/api/auth/user/profile`, {
//             method: 'PATCH',
//             headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify(data),
//             credentials: 'include',
//           })

//           const result = await response.json()

//           if (!response.ok) {
//             throw new Error(result.message || 'Failed to update profile')
//           }

//           // Merge the updated data with current user
//           const currentUser = get().user
//           set({ 
//             user: currentUser ? { ...currentUser, ...result.data } : null,
//             isLoading: false 
//           })

//           return result.data
//         } catch (error: any) {
//           set({ 
//             isLoading: false, 
//             error: error.message || 'Failed to update profile'
//           })
//           throw error
//         }
//       },

//       // Update Password
//       updatePassword: async ({ currentPassword, newPassword }: ChangePasswordData) => {
//         set({ isLoading: true, error: null })
        
//         try {
//           const token = get().token
//           if (!token) {
//             throw new Error('Not authenticated')
//           }

//           const response = await fetch(`${API_BASE}/api/auth/user/change-password`, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify({ currentPassword, newPassword }),
//             credentials: 'include',
//           })

//           const result = await response.json()

//           if (!response.ok) {
//             throw new Error(result.message || 'Failed to update password')
//           }

//           set({ isLoading: false })
//         } catch (error: any) {
//           set({ 
//             isLoading: false, 
//             error: error.message || 'Failed to update password'
//           })
//           throw error
//         }
//       },

//       // Delete Account
//       deleteAccount: async () => {
//         set({ isLoading: true, error: null })
        
//         try {
//           const token = get().token
//           if (!token) {
//             throw new Error('Not authenticated')
//           }

//           const response = await fetch(`${API_BASE}/api/auth/user/delete-account`, {
//             method: 'DELETE',
//             headers: {
//               'Authorization': `Bearer ${token}`
//             },
//             credentials: 'include',
//           })

//           const result = await response.json()

//           if (!response.ok) {
//             throw new Error(result.message || 'Failed to delete account')
//           }

//           // Clear all stored data
//           localStorage.removeItem('auth_token')
//           set({ 
//             user: null, 
//             token: null, 
//             isAuthenticated: false,
//             isLoading: false,
//             error: null,
//             signupData: {},
//             signupStep: 'form'
//           })
//         } catch (error: any) {
//           set({ 
//             isLoading: false, 
//             error: error.message || 'Failed to delete account'
//           })
//           throw error
//         }
//       },

//       // Clear error
//       clearError: () => set({ error: null }),

//       // Signup step management
//       setSignupStep: (step) => set({ signupStep: step }),
      
//       updateSignupData: (data) => set({ 
//         signupData: { ...get().signupData, ...data } 
//       }),
      
//       resetSignup: () => set({ 
//         signupStep: 'form', 
//         signupData: {} 
//       }),

//       // Check if email exists
//       checkEmailExists: async (email: string) => {
//         try {
//           const response = await fetch(`${API_BASE}/api/auth/user/check-email?email=${encodeURIComponent(email)}`, {
//             credentials: 'include',
//           })
//           const result = await response.json()
//           return result.exists
//         } catch (error) {
//           console.error('Failed to check email:', error)
//           return false
//         }
//       },
//     }),
//     {
//       name: 'auth-storage',
//       partialize: (state) => ({ 
//         user: state.user, 
//         token: state.token,
//         isAuthenticated: state.isAuthenticated
//       }),
//     }
//   )
// )

// // Selector hooks
// export const useUser = () => useAuthStore((state) => state.user)
// export const useAuth = () => useAuthStore((state) => ({
//   isAuthenticated: state.isAuthenticated,
//   isLoading: state.isLoading,
//   error: state.error,
//   signupStep: state.signupStep
// }))








