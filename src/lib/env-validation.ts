/**
 * Environment Variable Validation
 * Purpose: Validate required environment variables at startup
 * Prevents runtime failures due to missing configuration
 */

interface RequiredEnvVars {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
}

interface OptionalEnvVars {
  DATABASE_URL?: string
  NODE_ENV?: string
  NEXT_PUBLIC_SITE_URL?: string
  SENTRY_DSN?: string
  NEXT_PUBLIC_SENTRY_DSN?: string
  NEXT_PUBLIC_GA_ID?: string
  VERCEL_ANALYTICS_ID?: string
  SMTP_HOST?: string
  SMTP_PORT?: string
  SMTP_USER?: string
  SMTP_PASSWORD?: string
  RATE_LIMIT_MAX?: string
  RATE_LIMIT_WINDOW?: string
  NEXTAUTH_SECRET?: string
  NEXTAUTH_URL?: string
}

export type EnvVars = RequiredEnvVars & OptionalEnvVars

/**
 * Validate that all required environment variables are present
 */
export function validateEnv(): EnvVars {
  const requiredVars: (keyof RequiredEnvVars)[] = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const missing: string[] = []
  const env: Partial<EnvVars> = {}

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (!value || value.trim() === '') {
      missing.push(varName)
    } else {
      env[varName] = value
    }
  }

  // Check for missing required variables
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n\n` +
      'Please check your .env.local file and ensure all required variables are set.\n' +
      'See .env.example for the complete list of environment variables.'
    )
  }

  // Add optional variables if present
  const optionalVars: (keyof OptionalEnvVars)[] = [
    'DATABASE_URL',
    'NODE_ENV', 
    'NEXT_PUBLIC_SITE_URL',
    'SENTRY_DSN',
    'NEXT_PUBLIC_SENTRY_DSN',
    'NEXT_PUBLIC_GA_ID',
    'VERCEL_ANALYTICS_ID',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER', 
    'SMTP_PASSWORD',
    'RATE_LIMIT_MAX',
    'RATE_LIMIT_WINDOW',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]

  for (const varName of optionalVars) {
    const value = process.env[varName]
    if (value && value.trim() !== '') {
      env[varName] = value
    }
  }

  return env as EnvVars
}

/**
 * Validate Supabase configuration specifically
 */
export function validateSupabaseConfig(): void {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = validateEnv()

  // Validate Supabase URL format
  try {
    const url = new URL(NEXT_PUBLIC_SUPABASE_URL)
    if (!url.hostname.includes('supabase')) {
      console.warn('⚠️  Supabase URL does not appear to be a valid Supabase URL')
    }
  } catch (error) {
    throw new Error(`Invalid Supabase URL format: ${NEXT_PUBLIC_SUPABASE_URL}`)
  }

  // Validate anon key is not empty and has reasonable length
  if (NEXT_PUBLIC_SUPABASE_ANON_KEY.length < 50) {
    throw new Error('Supabase anon key appears to be invalid (too short)')
  }

  console.log('✅ Supabase configuration validated successfully')
}

/**
 * Get typed environment variables
 */
export function getEnv(): EnvVars {
  return validateEnv()
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Get the base URL for the application
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  return isDevelopment() ? 'http://localhost:3000' : 'https://localhost:3000'
}