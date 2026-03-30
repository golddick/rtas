import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  animated?: boolean
  delay?: 'none' | 'sm' | 'md' | 'lg'
}

export function Container({
  children,
  className,
  maxWidth = 'lg',
  animated = false,
  delay = 'none',
}: ContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  }

  const delayClasses = {
    none: '',
    sm: 'animation-delay-100',
    md: 'animation-delay-200',
    lg: 'animation-delay-300',
  }

  return (
    <div
      className={cn(
        'mx-auto px-4 sm:px-6 lg:px-8',
        maxWidthClasses[maxWidth],
        animated && 'animate-slide-up',
        className
      )}
    >
      {children}
    </div>
  )
}
