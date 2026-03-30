

// app/dashboard/[institutionSlug]/[departmentCode]/supervisor/layout.tsx
import { Sidebar } from "@/components/sidebar"
import { CheckCircle, File, FileText, HomeIcon, MessageSquare, Users } from "lucide-react"
import { redirect, notFound } from "next/navigation"
import { cookies } from "next/headers"
import jwt from 'jsonwebtoken'

export default async function SupervisorDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ institutionSlug: string; departmentCode: string }>
}) {
  // Await the params
  const { institutionSlug, departmentCode } = await params

  console.log('URL params after await:', { institutionSlug, departmentCode })

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
      email: decoded.email
    })

    // Check if user is a supervisor
    if (decoded.role !== 'SUPERVISOR') {
      console.error('User is not a supervisor:', decoded.role)
      redirect('/login')
    }

    // Check if user has department code
    if (!decoded.departmentCode) {
      console.error('User has no department code:', decoded.email)
      redirect('/login?error=no_department')
    }

    // Normalize department codes for comparison (case insensitive)
    const normalizedUrlDeptCode = departmentCode.toLowerCase()
    const normalizedUserDeptCode = decoded.departmentCode.toLowerCase()

    // Check if the URL matches the user's department
    if (decoded.institutionSlug !== institutionSlug || normalizedUserDeptCode !== normalizedUrlDeptCode) {
      console.log(`Redirecting to correct URL: /dashboard/${decoded.institutionSlug}/${normalizedUserDeptCode}/supervisor`)
      redirect(`/dashboard/${decoded.institutionSlug}/${normalizedUserDeptCode}/supervisor`)
    }

    // User is authorized, proceed to render
    const navItems = [
      { 
        label: 'Dashboard', 
        href: `/dashboard/${institutionSlug}/${departmentCode}/supervisor`, 
        icon: <HomeIcon size={20} /> 
      },
      { 
        label: 'My Students', 
        href: `/dashboard/${institutionSlug}/${departmentCode}/supervisor/students`, 
        icon: <Users size={20} /> 
      },
      { 
        label: 'Proposals to Review', 
        href: `/dashboard/${institutionSlug}/${departmentCode}/supervisor/proposals`, 
        icon: <FileText size={20} />, 
        // badge: 5 
      },
      { 
        label: 'Research Topics', 
        href: `/dashboard/${institutionSlug}/${departmentCode}/supervisor/topics`, 
        icon: <File size={20} /> 
      },
      { 
        label: 'Approved Topics', 
        href: `/dashboard/${institutionSlug}/${departmentCode}/supervisor/approved`, 
        icon: <CheckCircle size={20} /> 
      },
      { 
        label: 'Messages', 
        href: `/dashboard/${institutionSlug}/${departmentCode}/supervisor/messages`, 
        icon: <MessageSquare size={20} />, 
        // badge: 2 
      },
    ]

    return (
      <div className="min-h-screen relative flex bg-background">
        {/* Sidebar */}
        <Sidebar navItems={navItems} role="supervisor" />

        {/* Main Content */}
        <main className="flex-1 hidden-scrollbar overflow-auto">
          <div className="p-4">
            {children}
          </div>
        </main>
      </div>
    )

  } catch (error) {
    console.error('Auth error:', error)
    redirect('/login')
  }
}