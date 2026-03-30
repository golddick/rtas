// app/dashboard/[institutionSlug]/[departmentCode]/student/layout.tsx
import { Sidebar } from "@/components/sidebar"
import { Clock, File, FileText, HomeIcon, MessageSquare, Users } from "lucide-react"
import { redirect, notFound } from "next/navigation"
import { cookies } from "next/headers"
import jwt from 'jsonwebtoken'

export default async function StudentDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ institutionSlug: string; departmentCode: string }>
}) {
  // Await params in Next.js 15
  const { institutionSlug, departmentCode } = await params

  console.log('Student layout - URL params:', { institutionSlug, departmentCode })

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

    // Check if user is a student
    if (decoded.role !== 'STUDENT') {
      console.error('User is not a student:', decoded.role)
      redirect('/login')
    }

    // Check if user has department code
    if (!decoded.departmentCode) {
      console.error('Student has no department code:', decoded.email)
      redirect('/login?error=no_department')
    }

    // Normalize department codes for comparison (case insensitive)
    const normalizedUrlDeptCode = departmentCode.toLowerCase()
    const normalizedUserDeptCode = decoded.departmentCode.toLowerCase()

    // Check if the URL matches the user's department
    if (decoded.institutionSlug !== institutionSlug || normalizedUserDeptCode !== normalizedUrlDeptCode) {
      console.log(`Redirecting student to correct URL: /dashboard/${decoded.institutionSlug}/${normalizedUserDeptCode}/student`)
      redirect(`/dashboard/${decoded.institutionSlug}/${normalizedUserDeptCode}/student`)
    }

  } catch (error) {
    console.error('Auth error:', error)
    redirect('/login')
  }

  const navItems = [
    { 
      label: 'Dashboard', 
      href: `/dashboard/${institutionSlug}/${departmentCode}/student`, 
      icon: <HomeIcon size={20} /> 
    },
    { 
      label: 'My Proposals', 
      href: `/dashboard/${institutionSlug}/${departmentCode}/student/proposals`, 
      icon: <FileText size={20} />, 
      // badge: 2 
    },
    { 
      label: 'My Supervisor', 
      href: `/dashboard/${institutionSlug}/${departmentCode}/student/supervisor`, 
      icon: <Users size={20} /> 
    },
    { 
      label: 'Project Plan', 
      href: `/dashboard/${institutionSlug}/${departmentCode}/student/project-plan`, 
      icon: <File size={20} /> 
    },
    { 
      label: 'Topic Bank', 
      href: `/dashboard/${institutionSlug}/${departmentCode}/student/topic-bank`, 
      icon: <File size={20} /> 
    },
    { 
      label: 'Messages', 
      href: `/dashboard/${institutionSlug}/${departmentCode}/student/messages`, 
      icon: <MessageSquare size={20} />, 
      // badge: 3 
    },
  ]

  return (
    <div className="min-h-screen relative flex bg-background">
      {/* Sidebar */}
      <Sidebar navItems={navItems} role="Student" />

      {/* Main Content */}
      <main className="flex-1 hidden-scrollbar overflow-auto">
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  )
}