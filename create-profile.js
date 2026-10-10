#!/usr/bin/env node

// CLI Tool to Create User Profiles
// Usage: node create-profile.js

const readline = require('readline');
const path = require('path');

// Add parent directory to require path
require('module').Module._initPaths();

const profileService = require('./backend/services/profile.service');
const logger = require('./backend/utils/logger');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function createProfile() {
  console.log('\n🚀 Welcome to Algo Trading Platform!');
  console.log('=====================================\n');
  console.log('Let\'s create your trading profile...\n');

  try {
    // Get profile name
    const name = await question('Profile name (lowercase, no spaces): ');
    
    if (!name || !name.match(/^[a-z0-9_-]+$/)) {
      console.error('❌ Error: Profile name must contain only lowercase letters, numbers, hyphens, and underscores');
      rl.close();
      return;
    }

    // Get display name
    const displayName = await question(`Display name (default: ${name}): `) || name;

    // Get capital
    const capitalInput = await question('Initial capital (₹) (default: 100000): ');
    const capital = parseInt(capitalInput) || 100000;

    if (capital < 10000) {
      console.error('❌ Error: Minimum capital is ₹10,000');
      rl.close();
      return;
    }

    // Get risk level
    console.log('\nRisk Level Options:');
    console.log('  1. CONSERVATIVE (Low risk, smaller positions, tight stops)');
    console.log('  2. MODERATE (Balanced risk, medium positions)');
    console.log('  3. AGGRESSIVE (High risk, larger positions, wider stops)');
    const riskChoice = await question('\nChoose risk level (1/2/3, default: 2): ') || '2';
    
    const riskLevels = {
      '1': 'CONSERVATIVE',
      '2': 'MODERATE',
      '3': 'AGGRESSIVE'
    };
    const riskLevel = riskLevels[riskChoice] || 'MODERATE';

    // Paper trading
    const paperTradingInput = await question('\nEnable paper trading? (Y/n, default: Y): ') || 'Y';
    const paperTrading = paperTradingInput.toLowerCase() !== 'n';

    // Confirm
    console.log('\n📋 Profile Summary:');
    console.log('=====================================');
    console.log(`Name:          ${name}`);
    console.log(`Display Name:  ${displayName}`);
    console.log(`Capital:       ₹${capital.toLocaleString('en-IN')}`);
    console.log(`Risk Level:    ${riskLevel}`);
    console.log(`Paper Trading: ${paperTrading ? 'Yes' : 'No'}`);
    console.log('=====================================\n');

    const confirm = await question('Create this profile? (Y/n): ') || 'Y';
    
    if (confirm.toLowerCase() === 'n') {
      console.log('\n❌ Profile creation cancelled\n');
      rl.close();
      return;
    }

    // Create profile
    const profile = await profileService.createProfile({
      name,
      displayName,
      capital,
      riskLevel,
      paperTrading
    });

    console.log('\n✅ Profile created successfully!\n');
    console.log('📁 Profile location:', path.join(__dirname, 'profiles', name));
    console.log('\n🎯 Next steps:');
    console.log('  1. Start the server: npm run dev');
    console.log('  2. Open the web UI: http://localhost:3000');
    console.log('  3. Load your profile and browse default strategies');
    console.log('  4. Start trading!\n');

    if (paperTrading) {
      console.log('💡 You\'re in paper trading mode - practice without risking real money!');
      console.log('   You can disable it later in profile settings.\n');
    }

    rl.close();

  } catch (error) {
    console.error('\n❌ Error creating profile:', error.message);
    rl.close();
  }
}

// Run
createProfile();
