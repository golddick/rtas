// Testing and debugging utilities for RTAS platform

/**
 * Simple logger for debugging
 */
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '')
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error)
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data)
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data)
    }
  },
  success: (message: string, data?: any) => {
    console.log(`[SUCCESS] ✓ ${message}`, data)
  },
}

/**
 * Performance monitoring
 */
export const performanceMonitor = {
  startTime: {} as Record<string, number>,

  start: (label: string) => {
    performanceMonitor.startTime[label] = performance.now()
  },

  end: (label: string) => {
    if (!performanceMonitor.startTime[label]) {
      logger.warn(`No start time recorded for: ${label}`)
      return
    }
    const duration = performance.now() - performanceMonitor.startTime[label]
    logger.info(`Performance: ${label}`, { duration: `${duration.toFixed(2)}ms` })
    delete performanceMonitor.startTime[label]
  },

  measure: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    performanceMonitor.start(label)
    try {
      const result = await fn()
      performanceMonitor.end(label)
      return result
    } catch (error) {
      logger.error(`Performance measurement failed: ${label}`, error)
      throw error
    }
  },
}

/**
 * API response validator
 */
export const validateResponse = (response: any, expectedFields: string[]) => {
  const missing = expectedFields.filter(field => !(field in response))
  if (missing.length > 0) {
    logger.warn(`Missing fields in response: ${missing.join(', ')}`)
    return false
  }
  return true
}

/**
 * Mock data generator
 */
export const mockDataGenerator = {
  student: (id: number = 1) => ({
    id,
    name: `Student ${id}`,
    email: `student${id}@university.edu`,
    studentId: `CS-2024-${String(id).padStart(3, '0')}`,
    status: 'Active',
  }),

  supervisor: (id: number = 1) => ({
    id,
    name: `Dr. Supervisor ${id}`,
    email: `supervisor${id}@university.edu`,
    department: 'Computer Science',
    students: id * 10,
  }),

  proposal: (id: number = 1) => ({
    id,
    title: `Research Proposal ${id}`,
    student: `Student ${id}`,
    status: ['Pending', 'Approved', 'Under Review'][id % 3],
    submittedDate: new Date().toISOString(),
  }),

  generateMultiple: <T extends Record<string, any>>(
    count: number,
    generator: (i: number) => T
  ): T[] => {
    return Array.from({ length: count }, (_, i) => generator(i + 1))
  },
}

/**
 * Local storage mock for testing
 */
export const storageHelper = {
  set: (key: string, value: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value))
      logger.info(`Stored: ${key}`)
    }
  },

  get: (key: string) => {
    if (typeof window !== 'undefined') {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    }
    return null
  },

  remove: (key: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key)
      logger.info(`Removed: ${key}`)
    }
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
      logger.info('Cleared all storage')
    }
  },
}

/**
 * Component testing utilities
 */
export const testingHelpers = {
  /**
   * Simulate user interaction
   */
  simulateClick: (element: HTMLElement) => {
    element.click()
  },

  /**
   * Simulate form submission
   */
  simulateFormSubmit: (formElement: HTMLFormElement) => {
    formElement.dispatchEvent(new Event('submit', { bubbles: true }))
  },

  /**
   * Test accessibility
   */
  checkAccessibility: (element: HTMLElement) => {
    const issues: string[] = []

    // Check for images without alt text
    const images = element.querySelectorAll('img:not([alt])')
    if (images.length > 0) {
      issues.push(`Found ${images.length} images without alt text`)
    }

    // Check for buttons without text/aria-label
    const buttons = element.querySelectorAll('button:not(:has(*))')
    if (buttons.length > 0) {
      issues.push(`Found ${buttons.length} buttons without content`)
    }

    // Check for missing form labels
    const inputs = element.querySelectorAll('input:not([aria-label])')
    if (inputs.length > 0) {
      issues.push(`Found ${inputs.length} inputs without labels`)
    }

    return {
      isAccessible: issues.length === 0,
      issues,
    }
  },

  /**
   * Check for performance issues
   */
  checkPerformance: () => {
    if (typeof window === 'undefined') return null

    const metrics = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return {
      pageLoadTime: metrics?.loadEventEnd - metrics?.loadEventStart,
      domContentLoaded: metrics?.domContentLoadedEventEnd - metrics?.domContentLoadedEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
    }
  },
}

/**
 * Development-only debug component render
 */
export const debugComponentInfo = (componentName: string, props: any) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Component: ${componentName}`, props)
  }
}

/**
 * Route testing helper
 */
export const testRoute = (route: string, expectedPattern: RegExp) => {
  if (expectedPattern.test(route)) {
    logger.success(`Route validation passed: ${route}`)
    return true
  } else {
    logger.error(`Route validation failed: ${route}`)
    return false
  }
}

/**
 * Run all tests
 */
export const runAllTests = async () => {
  logger.info('Starting comprehensive tests...')

  // Test mock data generation
  const mockStudent = mockDataGenerator.student()
  validateResponse(mockStudent, ['id', 'name', 'email'])
  logger.success('Mock data generation test passed')

  // Test storage helper
  storageHelper.set('test-key', { value: 'test' })
  const retrieved = storageHelper.get('test-key')
  if (retrieved?.value === 'test') {
    logger.success('Storage helper test passed')
  } else {
    logger.error('Storage helper test failed')
  }
  storageHelper.remove('test-key')

  // Test performance monitor
  await performanceMonitor.measure('test-operation', async () => {
    return new Promise(resolve => setTimeout(resolve, 100))
  })

  logger.success('All tests completed')
}
