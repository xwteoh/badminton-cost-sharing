#!/usr/bin/env node

/**
 * Deploy Database Schema to Supabase
 * This script prepares our schema for deployment to Supabase
 */

const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')
const { config } = require('dotenv')

// Load environment variables from .env.local
config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local')
  process.exit(1)
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

console.log('🚀 Badminton App - Database Schema Deployment\n')

try {
  // Read schema file
  const schemaPath = join(__dirname, '..', 'database', 'schema.sql')
  const schemaSQL = readFileSync(schemaPath, 'utf8')
  
  // Read RLS policies file
  const rlsPath = join(__dirname, '..', 'database', 'rls_policies_simple.sql')
  const rlsSQL = readFileSync(rlsPath, 'utf8')
  
  console.log('📋 DEPLOYMENT INSTRUCTIONS')
  console.log('='.repeat(50))
  console.log('1. Open your Supabase SQL Editor:')
  console.log(`   🔗 https://supabase.com/dashboard/project/${projectRef}/sql`)
  console.log('')
  console.log('2. First, execute the DATABASE SCHEMA:')
  console.log('   📄 Copy and paste the content from: database/schema.sql')
  console.log('   ⚡ This will create all tables, indexes, and triggers')
  console.log('')
  console.log('3. Then, execute the RLS POLICIES:')
  console.log('   📄 Copy and paste the content from: database/rls_policies_simple.sql')
  console.log('   🔒 This will secure your data with Row Level Security')
  console.log('')
  console.log('📊 WHAT WILL BE CREATED:')
  console.log('  ✅ Tables: users, players, sessions, session_participants, payments, player_balances')
  console.log('  ✅ Indexes for performance optimization')
  console.log('  ✅ Triggers for automatic balance calculations')
  console.log('  ✅ Row Level Security policies')
  console.log('  ✅ Realtime subscriptions')
  console.log('')
  console.log('⚠️  IMPORTANT NOTES:')
  console.log('  - Execute schema.sql FIRST, then rls_policies_simple.sql')
  console.log('  - If you see "relation already exists" errors, that\'s normal for re-runs')
  console.log('  - All tables will be empty initially (we\'ll populate via the app)')
  console.log('')
  
  // Write combined SQL to a single file for easy copying
  const combinedSQL = `-- Badminton App Database Deployment
-- Execute this entire script in your Supabase SQL Editor
-- Project: ${projectRef}
-- Generated: ${new Date().toISOString()}

-- =============================================================================
-- STEP 1: DATABASE SCHEMA
-- =============================================================================

${schemaSQL}

-- =============================================================================
-- STEP 2: ROW LEVEL SECURITY POLICIES  
-- =============================================================================

${rlsSQL}

-- =============================================================================
-- DEPLOYMENT COMPLETE
-- =============================================================================
-- Your database is now ready for the Badminton Cost Sharing app!
`

  const outputPath = join(__dirname, '..', 'database', 'deploy.sql')
  writeFileSync(outputPath, combinedSQL)
  
  console.log('📁 READY-TO-DEPLOY FILE CREATED:')
  console.log(`   📄 ${outputPath}`)
  console.log('   💡 You can copy the entire content of this file and paste it into Supabase SQL Editor')
  console.log('')
  console.log('🎯 NEXT STEPS:')
  console.log('   1. Copy content from database/deploy.sql')
  console.log(`   2. Paste into: https://supabase.com/dashboard/project/${projectRef}/sql`)
  console.log('   3. Click "Run" to execute')
  console.log('   4. Come back here and continue with the integration!')
  
} catch (err) {
  console.error('❌ Error preparing deployment:', err.message)
  process.exit(1)
}