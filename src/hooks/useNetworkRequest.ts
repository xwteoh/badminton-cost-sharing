'use client'

import { useCallback, useState } from 'react'

interface NetworkRequestOptions {
  timeout?: number
  maxRetries?: number
  retryDelay?: number
}

interface NetworkRequestState<T> {
  data: T | null
  loading: boolean
  error: string | null
  retryCount: number
  isRetrying: boolean
}

/**
 * Custom hook for robust network requests with timeout and retry logic
 * Designed for mobile browsers that may suspend network requests
 */
export function useNetworkRequest<T>() {
  const [state, setState] = useState<NetworkRequestState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
    isRetrying: false
  })

  const executeRequest = useCallback(async (
    requestFn: () => Promise<T>,
    options: NetworkRequestOptions = {}
  ): Promise<T | null> => {
    const {
      timeout = 8000, // 8 seconds timeout for mobile
      maxRetries = 3,
      retryDelay = 1000
    } = options

    const attempt = async (attemptNumber: number): Promise<T> => {
      console.log(`🔄 Network request attempt ${attemptNumber}/${maxRetries + 1}`)
      
      // Update loading state
      setState(prev => ({
        ...prev,
        loading: true,
        isRetrying: attemptNumber > 1,
        error: null
      }))

      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        })

        // Race between the actual request and timeout
        const result = await Promise.race([
          requestFn(),
          timeoutPromise
        ])

        // Success - reset state
        setState(prev => ({
          ...prev,
          data: result,
          loading: false,
          error: null,
          retryCount: 0,
          isRetrying: false
        }))

        console.log(`✅ Network request successful on attempt ${attemptNumber}`)
        return result

      } catch (error: any) {
        console.log(`❌ Network request failed on attempt ${attemptNumber}:`, error.message)
        
        // If we have retries left, try again
        if (attemptNumber <= maxRetries) {
          setState(prev => ({
            ...prev,
            retryCount: attemptNumber,
            error: `Attempt ${attemptNumber} failed: ${error.message}`
          }))

          // Wait before retrying (exponential backoff)
          const delay = retryDelay * Math.pow(2, attemptNumber - 1)
          console.log(`⏳ Retrying in ${delay}ms...`)
          
          await new Promise(resolve => setTimeout(resolve, delay))
          return attempt(attemptNumber + 1)
        }

        // All retries exhausted
        const finalError = `Failed after ${maxRetries + 1} attempts: ${error.message}`
        setState(prev => ({
          ...prev,
          loading: false,
          error: finalError,
          retryCount: maxRetries + 1,
          isRetrying: false
        }))

        throw new Error(finalError)
      }
    }

    try {
      return await attempt(1)
    } catch (error) {
      console.error('🚨 Network request failed completely:', error)
      return null
    }
  }, [])

  const retry = useCallback((
    requestFn: () => Promise<T>,
    options?: NetworkRequestOptions
  ) => {
    console.log('🔄 Manual retry triggered')
    setState(prev => ({ ...prev, retryCount: 0, error: null }))
    return executeRequest(requestFn, options)
  }, [executeRequest])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      retryCount: 0,
      isRetrying: false
    })
  }, [])

  return {
    ...state,
    executeRequest,
    retry,
    reset,
    // Helper computed properties
    hasError: !!state.error,
    canRetry: !state.loading && !!state.error,
    isInitialLoad: state.retryCount === 0 && state.loading
  }
}