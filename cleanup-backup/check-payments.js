#!/usr/bin/env node

/**
 * Script to analyze payment data in migration JSON file
 * Usage: node scripts/check-payments.js path/to/your/migration-data.json
 */

const fs = require('fs');
const path = require('path');

function analyzePayments(jsonFilePath) {
  try {
    console.log(`📋 Analyzing payments in: ${jsonFilePath}`);
    console.log('=' .repeat(60));

    // Read and parse JSON file
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const data = JSON.parse(jsonData);

    let totalPayments = 0;
    let topLevelPayments = 0;
    let sessionPayments = 0;
    const paymentsByDate = new Map();
    const paymentsByPlayer = new Map();
    const paymentMethods = new Map();

    // Check top-level payments
    if (data.payments && Array.isArray(data.payments)) {
      topLevelPayments = data.payments.length;
      console.log(`💰 Top-level payments array: ${topLevelPayments} payments`);
      
      // Analyze top-level payments
      data.payments.forEach(payment => {
        totalPayments++;
        
        // Count by date
        const date = payment.payment_date;
        paymentsByDate.set(date, (paymentsByDate.get(date) || 0) + 1);
        
        // Count by player
        const player = payment.player_name;
        paymentsByPlayer.set(player, (paymentsByPlayer.get(player) || 0) + 1);
        
        // Count by method
        const method = payment.payment_method || 'unknown';
        paymentMethods.set(method, (paymentMethods.get(method) || 0) + 1);
      });
    } else {
      console.log(`⚠️  No top-level payments array found`);
    }

    // Check session-level payments
    if (data.sessions && Array.isArray(data.sessions)) {
      console.log(`🏸 Sessions found: ${data.sessions.length}`);
      
      data.sessions.forEach((session, index) => {
        if (session.payments && Array.isArray(session.payments)) {
          const sessionPaymentCount = session.payments.length;
          sessionPayments += sessionPaymentCount;
          console.log(`   Session ${index + 1} (${session.date}): ${sessionPaymentCount} payments`);
          
          // Analyze session payments
          session.payments.forEach(payment => {
            totalPayments++;
            
            // Count by date
            const date = payment.payment_date;
            paymentsByDate.set(date, (paymentsByDate.get(date) || 0) + 1);
            
            // Count by player
            const player = payment.player_name;
            paymentsByPlayer.set(player, (paymentsByPlayer.get(player) || 0) + 1);
            
            // Count by method
            const method = payment.payment_method || 'unknown';
            paymentMethods.set(method, (paymentMethods.get(method) || 0) + 1);
          });
        }
      });
    } else {
      console.log(`⚠️  No sessions array found`);
    }

    console.log('\n📊 PAYMENT SUMMARY');
    console.log('=' .repeat(60));
    console.log(`💰 Total payments found: ${totalPayments}`);
    console.log(`   └─ Top-level payments: ${topLevelPayments}`);
    console.log(`   └─ Session-level payments: ${sessionPayments}`);

    if (totalPayments !== 456) {
      console.log(`⚠️  Expected 456 payments, found ${totalPayments} (difference: ${456 - totalPayments})`);
    } else {
      console.log(`✅ Found exactly 456 payments as expected!`);
    }

    // Show date distribution
    console.log(`\n📅 PAYMENTS BY DATE (showing top 10):`);
    const sortedDates = Array.from(paymentsByDate.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    sortedDates.forEach(([date, count]) => {
      console.log(`   ${date}: ${count} payments`);
    });

    // Show player distribution
    console.log(`\n👥 PAYMENTS BY PLAYER (showing top 10):`);
    const sortedPlayers = Array.from(paymentsByPlayer.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    sortedPlayers.forEach(([player, count]) => {
      console.log(`   ${player}: ${count} payments`);
    });

    // Show payment methods
    console.log(`\n💳 PAYMENTS BY METHOD:`);
    Array.from(paymentMethods.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([method, count]) => {
        console.log(`   ${method}: ${count} payments`);
      });

    // Check for date range
    const allDates = Array.from(paymentsByDate.keys()).sort();
    if (allDates.length > 0) {
      console.log(`\n📅 DATE RANGE:`);
      console.log(`   Earliest payment: ${allDates[0]}`);
      console.log(`   Latest payment: ${allDates[allDates.length - 1]}`);
    }

    // Check for sessions date range
    if (data.sessions && data.sessions.length > 0) {
      const sessionDates = data.sessions.map(s => s.date).sort();
      console.log(`\n🏸 SESSION DATE RANGE:`);
      console.log(`   Earliest session: ${sessionDates[0]}`);
      console.log(`   Latest session: ${sessionDates[sessionDates.length - 1]}`);
    }

    console.log('\n✅ Analysis complete!');

  } catch (error) {
    console.error(`❌ Error analyzing payments: ${error.message}`);
    
    if (error.code === 'ENOENT') {
      console.error(`   File not found: ${jsonFilePath}`);
    } else if (error instanceof SyntaxError) {
      console.error(`   Invalid JSON format in file`);
    }
    
    process.exit(1);
  }
}

// Get file path from command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node scripts/check-payments.js path/to/your/migration-data.json');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/check-payments.js data/migration-data.json');
  console.log('  node scripts/check-payments.js /Users/yourname/Downloads/badminton-data.json');
  process.exit(1);
}

const jsonFilePath = args[0];

// Check if file exists
if (!fs.existsSync(jsonFilePath)) {
  console.error(`❌ File not found: ${jsonFilePath}`);
  process.exit(1);
}

// Run the analysis
analyzePayments(jsonFilePath);