// components/header.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, LayoutDashboard, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/user/userStore'

export function Header() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()

  const getDashboardPath = () => {
    if (!user?.role) return '/dashboard'
    
    const institutionSlug = user.institution?.slug || ''
    const departmentCode = user.department?.code || user.supervisorDepartment?.code || ''
    
    switch (user.role) {
      case 'STUDENT':
        return `/dashboard/${institutionSlug}/${departmentCode}/student`
      case 'SUPERVISOR':
        return `/dashboard/${institutionSlug}/${departmentCode}/supervisor`
      case 'HOD':
        return `/dashboard/${institutionSlug}/${departmentCode}/hod`
      default:
        return '/dashboard'
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
    setMobileMenuOpen(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border animate-fade-in">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">R</span>
            </div>
            <span className="font-bold text-xl text-foreground hidden sm:inline">RTAS</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-foreground hover:text-primary transition-colors duration-200">Home</Link>
            <Link href="#features" className="text-foreground hover:text-primary transition-colors duration-200">Features</Link>
            <Link href="#how" className="text-foreground hover:text-primary transition-colors duration-200">How It Works</Link>
            <Link href="#about" className="text-foreground hover:text-primary transition-colors duration-200">About</Link>
            <Link href="#contact" className="text-foreground hover:text-primary transition-colors duration-200">Contact</Link>
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.fullName}</p>
                      <p className="text-xs leading-none text-muted-foreground mt-1 capitalize">
                        {user.role?.toLowerCase()}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardPath()} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="px-4 py-2 text-primary font-medium hover:bg-secondary transition-colors duration-200 rounded-lg"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-all duration-200"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors duration-200"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-border animate-slide-down">
            <div className="flex flex-col gap-4 pt-4">
              <Link href="/" className="text-foreground hover:text-primary transition-colors duration-200">Home</Link>
              <Link href="#features" className="text-foreground hover:text-primary transition-colors duration-200">Features</Link>
              <Link href="#how" className="text-foreground hover:text-primary transition-colors duration-200">How It Works</Link>
              <Link href="#about" className="text-foreground hover:text-primary transition-colors duration-200">About</Link>
              <Link href="#contact" className="text-foreground hover:text-primary transition-colors duration-200">Contact</Link>
              
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                {isAuthenticated && user ? (
                  <>
                    <div className="px-4 py-2 bg-secondary rounded-lg">
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">{user.role?.toLowerCase()}</p>
                    </div>
                    <Link 
                      href={getDashboardPath()}
                      className="px-4 py-2 text-center flex items-center justify-center gap-2 text-primary font-medium hover:bg-secondary transition-colors duration-200 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard size={18} />
                      Dashboard
                    </Link>
            
                    <button 
                      onClick={handleLogout}
                      className="px-4 py-2 text-center flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 transition-colors duration-200 rounded-lg"
                    >
                      <LogOut size={18} />
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      className="px-4 py-2 text-center text-primary font-medium hover:bg-secondary transition-colors duration-200 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link 
                      href="/register" 
                      className="px-4 py-2 text-center bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-all duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}




// 'use client'

// import { useState } from 'react'
// import Link from 'next/link'
// import { Menu, X } from 'lucide-react'

// export function Header() {
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

//   return (
//     <header className="sticky top-0 z-50 bg-background border-b border-border animate-fade-in">
//       <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center h-16">
//           {/* Logo */}
//           <div className="flex items-center gap-2">
//             <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
//               <span className="text-primary-foreground font-bold text-lg">R</span>
//             </div>
//             <span className="font-bold text-xl text-foreground hidden sm:inline">RTAS</span>
//           </div>

//           {/* Desktop Navigation */} 
//           <div className="hidden md:flex items-center gap-8">
//             <Link href="/" className="text-foreground hover:text-primary transition-colors duration-200">Home</Link>
//             <Link href="#features" className="text-foreground hover:text-primary transition-colors duration-200">Features</Link>
//             <Link href="#how" className="text-foreground hover:text-primary transition-colors duration-200">How It Works</Link>
//             <Link href="#about" className="text-foreground hover:text-primary transition-colors duration-200">About</Link>
//             <Link href="#contact" className="text-foreground hover:text-primary transition-colors duration-200">Contact</Link>
//           </div>

//           {/* Auth Buttons */}
//           <div className="hidden sm:flex items-center gap-3">
//             <Link 
//               href="/login" 
//               className="px-4 py-2 text-primary font-medium hover:bg-secondary transition-colors duration-200 rounded-lg"
//             >
//               Login
//             </Link>
//             <Link 
//               href="/register" 
//               className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-all duration-200"
//             >
//               Register
//             </Link>
//           </div>

//           {/* Mobile Menu Button */}
//           <button 
//             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//             className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors duration-200"
//           >
//             {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
//           </button>
//         </div>

//         {/* Mobile Menu */}
//         {mobileMenuOpen && (
//           <div className="md:hidden pb-4 border-t border-border animate-slide-down">
//             <div className="flex flex-col gap-4 pt-4">
//               <Link href="/" className="text-foreground hover:text-primary transition-colors duration-200">Home</Link>
//               <Link href="#features" className="text-foreground hover:text-primary transition-colors duration-200">Features</Link>
//               <Link href="#how" className="text-foreground hover:text-primary transition-colors duration-200">How It Works</Link>
//               <Link href="#about" className="text-foreground hover:text-primary transition-colors duration-200">About</Link>
//               <Link href="#contact" className="text-foreground hover:text-primary transition-colors duration-200">Contact</Link>
//               <div className="flex flex-col gap-2 pt-2 border-t border-border">
//                 <Link 
//                   href="/login" 
//                   className="px-4 py-2 text-center text-primary font-medium hover:bg-secondary transition-colors duration-200 rounded-lg"
//                 >
//                   Login
//                 </Link>
//                 <Link 
//                   href="/register" 
//                   className="px-4 py-2 text-center bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-all duration-200"
//                 >
//                   Register
//                 </Link>
//               </div>
//             </div>
//           </div>
//         )}
//       </nav>
//     </header>
//   )
// }
