/**
 * RTAS Design System
 * Comprehensive utility functions for consistent styling across the platform
 */

// Color tokens
export const COLORS = {
  primary: '#2563eb', // RTAS Blue
  background: '#ffffff',
  foreground: '#1a1a1a',
  card: '#ffffff',
  secondary: '#f5f5f5',
  muted: '#e5e5e5',
  border: '#e5e5e5',
  success: '#10b981',
  warning: '#f59e0b',
  destructive: '#ef4444',
} as const

// Spacing scale
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
} as const

// Animation durations
export const DURATIONS = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  verySlow: '1000ms',
} as const

// Animation easing functions
export const EASING = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeLinear: 'linear',
} as const

// Responsive breakpoints
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Z-index scale
export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
} as const

// Button variants
export const BUTTON_VARIANTS = {
  primary: {
    bg: 'bg-primary',
    text: 'text-primary-foreground',
    hover: 'hover:opacity-90',
    active: 'active:scale-95',
  },
  secondary: {
    bg: 'bg-secondary',
    text: 'text-foreground',
    hover: 'hover:bg-muted',
    active: 'active:scale-95',
  },
  outline: {
    bg: 'border-2 border-primary',
    text: 'text-primary',
    hover: 'hover:bg-primary/5',
    active: 'active:scale-95',
  },
  ghost: {
    bg: 'bg-transparent',
    text: 'text-primary',
    hover: 'hover:bg-secondary',
    active: 'active:scale-95',
  },
} as const

// Card variants
export const CARD_VARIANTS = {
  default: {
    bg: 'bg-card',
    border: 'border border-border',
    shadow: 'shadow-sm',
  },
  elevated: {
    bg: 'bg-card',
    border: 'border border-border',
    shadow: 'shadow-md',
  },
  ghost: {
    bg: 'bg-transparent',
    border: 'border border-border',
    shadow: 'shadow-none',
  },
} as const

// Status badge colors
export const STATUS_COLORS = {
  pending: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    icon: 'text-yellow-600',
  },
  approved: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'text-green-600',
  },
  rejected: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-600',
  },
  draft: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    icon: 'text-gray-600',
  },
} as const

// Animation classes
export const ANIMATIONS = {
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  slideLeft: 'animate-slide-left',
  slideRight: 'animate-slide-right',
  scaleIn: 'animate-scale-in',
  pulseSoft: 'animate-pulse-soft',
} as const

// Transition utilities
export const TRANSITIONS = {
  colors: 'transition-colors duration-200',
  all: 'transition-all duration-300',
  opacity: 'transition-opacity duration-200',
  transform: 'transition-transform duration-300',
  shadow: 'transition-shadow duration-300',
} as const

// Border radius values
export const RADIUS = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
} as const

// Shadows
export const SHADOWS = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
} as const

// Grid layouts
export const GRID = {
  container: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  twoColumn: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  threeColumn: 'grid grid-cols-1 md:grid-cols-3 gap-6',
  fourColumn: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
} as const
