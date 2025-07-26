'use client'

import { useEffect, useState } from 'react'

/**
 * Custom hook to detect when page visibility changes
 * Useful for mobile browsers that suspend tabs when switching
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true)
  const [wasHidden, setWasHidden] = useState(false)

  useEffect(() => {
    // Check if Page Visibility API is supported
    if (typeof document === 'undefined' || !('visibilityState' in document)) {
      return
    }

    const handleVisibilityChange = () => {
      const isCurrentlyVisible = !document.hidden
      
      // Track if page was previously hidden (for recovery detection)
      if (!isCurrentlyVisible) {
        setWasHidden(true)
      }
      
      setIsVisible(isCurrentlyVisible)
      
      console.log('📱 Page Visibility:', isCurrentlyVisible ? 'VISIBLE' : 'HIDDEN')
    }

    // Set initial visibility state
    setIsVisible(!document.hidden)

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Also listen for page focus/blur as fallback
    window.addEventListener('focus', () => {
      console.log('📱 Window focused')
      setIsVisible(true)
    })
    
    window.addEventListener('blur', () => {
      console.log('📱 Window blurred')
      setWasHidden(true)
    })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', () => setIsVisible(true))
      window.removeEventListener('blur', () => setWasHidden(true))
    }
  }, [])

  // Function to reset the wasHidden flag (call after successful recovery)
  const resetHiddenFlag = () => {
    setWasHidden(false)
  }

  return {
    isVisible,
    wasHidden,
    resetHiddenFlag,
    // Helper to detect if we just returned from being hidden
    justBecameVisible: isVisible && wasHidden
  }
}