// app/dashboard/[institutionSlug]/[departmentCode]/hod/layout.tsx
import { Sidebar } from "@/components/sidebar"
import { BarChart3, FileText, HomeIcon, MessageSquare, Users } from "lucide-react"
import { redirect, notFound } from "next/navigation"
import { cookies } from "next/headers"
import jwt from 'jsonwebtoken'

export default async function HodDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ institutionSlug: string; departmentCode: string }>
}) {
  // Await params in Next.js 15
  const { institutionSlug, departmentCode } = await params

  console.log('HOD layout - URL params:', { institutionSlug, departmentCode })

  // Check if params are valid
  if (!institutionSlug || !departmentCode) {
    console.error('Missing params:', { institutionSlug, departmentCode })
    notFound()
  }

  // Get token from cookies
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    redirect('/login')
  }

  try {
    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string
      email: string
      role: string
      fullName: string
      institutionSlug: string
      institutionCode: string
      departmentCode: string
      departmentName: string
      departmentId: string
      status: string
      emailVerified: boolean
    }

    console.log('Decoded token data:', {
      role: decoded.role,
      institutionSlug: decoded.institutionSlug,
      departmentCode: decoded.departmentCode,
      email: decoded.email,
      fullName: decoded.fullName
    })

    // Check if user is HOD
    if (decoded.role !== 'HOD') {
      console.error('User is not HOD:', decoded.role)
      redirect('/login')
    }

    // Check if user has department code
    if (!decoded.departmentCode) {
      console.error('HOD has no department code:', decoded.email)
      redirect('/login?error=no_department')
    }

    // Normalize department codes for comparison (case insensitive)
    const normalizedUrlDeptCode = departmentCode.toLowerCase()
    const normalizedUserDeptCode = decoded.departmentCode.toLowerCase()

    // Check if the URL matches the user's department
    if (decoded.institutionSlug !== institutionSlug || normalizedUserDeptCode !== normalizedUrlDeptCode) {
      console.log(`Redirecting HOD to correct URL: /dashboard/${decoded.institutionSlug}/${normalizedUserDeptCode}/hod`)
      redirect(`/dashboard/${decoded.institutionSlug}/${normalizedUserDeptCode}/hod`)
    }

  } catch (error) {
    console.error('Auth error:', error)
    redirect('/login')
  }

  const navItems = [
    { 
      label: 'Dashboard', 
      href: `/dashboard/${institutionSlug}/${departmentCode}/hod`, 
      icon: <HomeIcon size={20} /> 
    },
    { 
      label: 'Supervisors', 
      href: `/dashboard/${institutionSlug}/${departmentCode}/hod/supervisors`, 
      icon: <Users size={20} /> 
    },
    { 
      label: 'Students', 
      href: `/dashboard/${institutionSlug}/${departmentCode}/hod/students`, 
      icon: <Users size={20} /> 
    },
    { 
      label: 'All Proposals', 
      href: `/dashboard/${institutionSlug}/${departmentCode}/hod/proposals`, 
      icon: <FileText size={20} /> 
    },
    { 
      label: 'Messages', 
      href: `/dashboard/${institutionSlug}/${departmentCode}/hod/messages`, 
      icon: <MessageSquare size={20} />, 
      // badge: 1 
    },
  ]

  return (
    <div className="min-h-screen relative flex bg-background">
      {/* Sidebar */}
      <Sidebar navItems={navItems} role="Head of Department" />

      {/* Main Content */}
      <main className="flex-1 hidden-scrollbar overflow-auto">
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  )
}