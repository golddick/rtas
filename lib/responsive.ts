/**
 * Responsive Design Utilities
 * Helper functions for consistent responsive behavior across RTAS
 */

// Responsive class builders
export const responsive = {
  // Grid layouts
  grid: {
    twoCol: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    threeCol: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    fourCol: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
    sixCol: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4',
  },

  // Flexbox layouts
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    colCenter: 'flex flex-col items-center justify-center',
    colBetween: 'flex flex-col items-start justify-between',
  },

  // Typography scales
  text: {
    heading1: 'text-4xl md:text-5xl lg:text-6xl font-bold leading-tight',
    heading2: 'text-3xl md:text-4xl font-bold leading-snug',
    heading3: 'text-2xl md:text-3xl font-bold',
    heading4: 'text-xl md:text-2xl font-semibold',
    body: 'text-base md:text-lg leading-relaxed',
    small: 'text-sm md:text-base',
    tiny: 'text-xs md:text-sm',
  },

  // Padding scales
  padding: {
    page: 'px-4 sm:px-6 lg:px-8 py-6 md:py-12',
    section: 'px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-32',
    card: 'p-4 md:p-6',
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  },

  // Width utilities
  width: {
    full: 'w-full',
    half: 'w-full md:w-1/2',
    third: 'w-full md:w-1/3',
    twoThirds: 'w-full md:w-2/3',
  },

  // Display utilities
  display: {
    hideOnMobile: 'hidden md:block',
    showOnMobile: 'block md:hidden',
    hideOnTablet: 'hidden lg:block',
    showOnTablet: 'block lg:hidden',
  },

  // Common combinations
  button: {
    primary: 'px-4 md:px-6 py-2 md:py-3 font-semibold rounded-lg transition-all duration-300',
    full: 'w-full px-4 py-3 font-semibold rounded-lg transition-all duration-300',
  },

  // Input sizes
  input: {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-4 py-3 md:py-4 text-base md:text-lg',
  },

  // Container sizes
  container: {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  },
} as const

// Media query helpers
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

// Responsive margin utilities
export const margin = {
  responsiveX: 'mx-4 sm:mx-6 lg:mx-8',
  responsiveY: 'my-6 md:my-12 lg:my-16',
  responsiveAll: 'mx-4 sm:mx-6 lg:mx-8 my-6 md:my-12',
  tightTop: 'mt-2 md:mt-4 lg:mt-6',
  tightBottom: 'mb-2 md:mb-4 lg:mb-6',
} as const

// Common responsive patterns
export const patterns = {
  // Hero section
  hero: 'py-20 md:py-32 lg:py-40 px-4 sm:px-6 lg:px-8',

  // Feature grid
  featureGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8',

  // Dashboard grid
  dashboardStats: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',

  // Two column with sidebar
  twoColumnWithSidebar: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
  mainContent: 'lg:col-span-2 space-y-6',
  sidebar: 'lg:col-span-1 space-y-6',

  // Card grid
  cardGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6',

  // Form layout
  formLayout: 'space-y-5 md:space-y-6',
  formRow: 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6',

  // Navigation bar
  navbar: 'px-4 sm:px-6 lg:px-8 py-4 md:py-6',

  // Section
  section: 'py-12 md:py-20 lg:py-32 px-4 sm:px-6 lg:px-8',
} as const

// Animation delays for staggered effects
export const animationDelays = {
  '0': 'animation-delay: 0ms',
  '100': 'animation-delay: 100ms',
  '200': 'animation-delay: 200ms',
  '300': 'animation-delay: 300ms',
  '400': 'animation-delay: 400ms',
  '500': 'animation-delay: 500ms',
} as const

// Z-index scale
export const zIndex = {
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  notification: 80,
} as const

// Touch-friendly sizing
export const touchTargets = {
  xs: 'w-8 h-8', // 32px
  sm: 'w-10 h-10', // 40px
  md: 'w-12 h-12', // 48px
  lg: 'w-14 h-14', // 56px
  xl: 'w-16 h-16', // 64px
} as const
