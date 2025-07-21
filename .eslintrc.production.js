/**
 * Production ESLint Configuration
 * Purpose: Relaxed rules for production builds while maintaining code quality
 * Usage: npm run build:strict (for development) vs npm run build (for production)
 */

module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Disable console warnings for production (keep console.error)
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    
    // Allow magic numbers in specific contexts
    'no-magic-numbers': 'off',
    
    // Allow parameter reassignment for event handlers
    'no-param-reassign': ['error', { props: false }],
    
    // Allow some interactive patterns for UI modernization
    'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    
    // Allow any type in specific contexts (gradually remove)
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Allow unused variables with underscore prefix
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // Allow imports in any order for production
    'import/order': 'warn',
    
    // Allow unescaped entities in JSX
    'react/no-unescaped-entities': 'warn',
    
    // Allow hooks without exhaustive deps (with warnings)
    'react-hooks/exhaustive-deps': 'warn',
    
    // Allow naming conventions flexibility
    '@typescript-eslint/naming-convention': 'warn',
    
    // Allow object shorthand flexibility
    'object-shorthand': 'warn'
  },
  
  // Override for specific files
  overrides: [
    {
      // Strict rules for financial calculations
      files: ['src/lib/calculations/**/*.ts'],
      rules: {
        'no-console': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        'no-magic-numbers': ['error', { ignore: [0, 1, -1] }]
      }
    },
    {
      // Relaxed rules for UI components during modernization
      files: ['src/app/**/*.tsx', 'src/components/**/*.tsx'],
      rules: {
        'no-console': ['warn', { allow: ['error', 'warn', 'log'] }],
        'jsx-a11y/no-noninteractive-element-interactions': 'off',
        'no-param-reassign': 'off'
      }
    }
  ]
}