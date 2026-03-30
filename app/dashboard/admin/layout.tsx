import { Activity, BarChart3, FileText, HomeIcon, MessageSquare, School, Settings, Shield, Users } from "lucide-react"
import { Sidebar } from "./AdminSidebar"

export default function HodDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { department: string }
}) {
  const navItems = [
    { label: 'Dashboard', href: '/dashboard/admin', icon: <Shield size={20} /> },
    { label: 'Institution', href: '/dashboard/admin/institution', icon: <School size={20} /> },
    { label: 'Users', href: '/dashboard/admin/users', icon: <Users size={20} /> },
    { label: 'Departments', href: '/dashboard/admin/departments', icon: <BarChart3 size={20} /> },
    // { label: 'System Logs', href: '/dashboard/admin/logs', icon: <Activity size={20} /> },
  ]
  return <>


      <div className="min-h-screen relative  flex bg-background" >
      {/* Sidebar */}
      <Sidebar navItems={navItems} role="System Administrator" />

      {/* Main Content */}
        <main className="flex-1 hidden-scrollbar overflow-auto">
          <div className=" p-4">
            {children}
          </div>
        </main>
      </div>
  </>
}
 