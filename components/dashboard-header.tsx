// components/dashboard-header.tsx
'use client'

import { Bell, Search, User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useUser } from '@/store/user/userStore'
import { useNotificationStore } from '@/store/notification/notificationStore'
import { NotificationPanel } from './modals/notification-panel'


interface DashboardHeaderProps {
  title: string
  subtitle?: string
  showSearch?: boolean
  showNotifications?: boolean
  onSearch?: (query: string) => void
}

export function DashboardHeader({
  title,
  subtitle,
  showSearch = true,
  showNotifications = true,
  onSearch,
}: DashboardHeaderProps) {
  const router = useRouter()
  const user = useUser()
  const { logout } = useAuthStore()
  const { unreadCount, fetchNotifications } = useNotificationStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch notifications on mount to get unread count
    if (user) {
      fetchNotifications(true)
    }
  }, [user])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'HOD':
        return 'Head of Department'
      case 'SUPERVISOR':
        return 'Supervisor'
      case 'STUDENT':
        return 'Student'
      default:
        return role
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    }
    setSearchOpen(false)
  }

  const handleNotificationClick = (notification: any) => {
    // Handle notification click - navigate to relevant page
    console.log('Notification clicked:', notification)
    setNotificationsOpen(false)
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="bg-background border-b border-border animate-fade-in sticky top-0 z-40">
      <div className="px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left Side - Title */}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">{title}</h1>
            {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {showSearch && (
              <div className="relative" ref={searchRef}>
                {searchOpen ? (
                  <form onSubmit={handleSearchSubmit} className="flex items-center">
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg border border-border">
                      <Search size={18} className="text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-48 md:w-64"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setSearchOpen(false)}
                        className="text-muted-foreground hover:text-foreground text-lg"
                      >
                        ×
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors duration-200"
                  >
                    <Search size={20} className="text-foreground" />
                  </button>
                )}
              </div>
            )}

            {/* Notifications */}
            {showNotifications && (
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 hover:bg-secondary rounded-lg transition-colors duration-200"
                >
                  <Bell size={20} className="text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
                  )}
                </button>
                <NotificationPanel
                  isOpen={notificationsOpen}
                  onClose={() => setNotificationsOpen(false)}
                  onNotificationClick={handleNotificationClick}
                />
              </div>
            )}

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-secondary rounded-lg transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground capitalize font-semibold text-sm">
                  {user?.fullName ? getInitials(user.fullName) : 'U'}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground capitalize">
                    {user?.fullName || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user?.role ? getRoleDisplay(user.role) : ''}
                  </span>
                </div>
                <ChevronDown size={16} className="text-muted-foreground hidden md:block" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground capitalize">{user?.fullName || 'User'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
                    {user?.department && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {user.department.name}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      router.push('/profile')
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors flex items-center gap-2"
                  >
                    <User size={16} />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      router.push('/settings')
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors flex items-center gap-2"
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                  <div className="border-t border-border" />
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      handleLogout()
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



