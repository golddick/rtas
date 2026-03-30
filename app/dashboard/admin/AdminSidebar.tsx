'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, LogOut, Settings, Home, BarChart3, FileText, Users, Clock, MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/store/admin/adminAuthStore'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

interface SidebarProps {
  navItems: NavItem[]
  role: string
}

export function Sidebar({ navItems, role }: SidebarProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const { logout, admin } = useAuthStore()

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    try {
      await logout()
      // Redirect to admin login page
      router.push('/auth/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
      // Still redirect even if logout fails
      router.push('/auth/admin/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:relative top-0 left-0 h-screen w-64 bg-sidebar border-r border-border transform transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">R</span>
            </div>
            <div>
              <h2 className="font-bold text-foreground">RTAS Admin</h2>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
              {admin && (
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {admin.fullName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors duration-200 group relative"
            >
              <span className="text-sidebar-foreground group-hover:text-sidebar-accent-foreground transition-colors duration-200">
                {item.icon}
              </span>
              <span className="flex-1 text-sm">{item.label}</span>
              {item.badge && (
                <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <span className="animate-spin">⚪</span>
                <span>Logging out...</span>
              </>
            ) : (
              <>
                <LogOut size={20} />
                <span>Logout</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}