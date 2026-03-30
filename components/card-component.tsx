import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
  animated?: boolean
  interactive?: boolean
}

export function Card({
  children,
  className,
  onClick,
  hover = true,
  animated = false,
  interactive = false,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card text-card-foreground rounded-lg border border-border p-6',
        hover && 'hover:border-primary hover:shadow-sm transition-all duration-300',
        interactive && 'cursor-pointer',
        animated && 'animate-scale-in',
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn('mb-4 pb-4 border-b border-border', className)}>{children}</div>
}

interface CardTitleProps {
  children: ReactNode
  className?: string
  level?: 'h1' | 'h2' | 'h3' | 'h4'
}

export function CardTitle({ children, className, level = 'h3' }: CardTitleProps) {
  const Component = level
  return (
    <Component className={cn('text-xl font-semibold text-foreground', className)}>
      {children}
    </Component>
  )
}

interface CardDescriptionProps {
  children: ReactNode
  className?: string
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('', className)}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return <div className={cn('mt-4 pt-4 border-t border-border flex gap-3', className)}>{children}</div>
}
