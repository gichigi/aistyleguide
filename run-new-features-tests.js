#!/usr/bin/env node

/**
 * Test Runner for New Features Unit Tests
 * 
 * This script runs the comprehensive test suite for all new features
 * implemented in the restore-paywall-version branch.
 */

const fs = require('fs');
const path = require('path');

// Import the test suite
const { NewFeaturesTestSuite, runNewFeaturesTests } = require('./unit-tests-new-features.js');

console.log('🚀 AI Style Guide - New Features Test Runner');
console.log('=============================================\n');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this from the project root.');
  process.exit(1);
}

// Run the tests
async function main() {
  try {
    console.log('📋 Testing all new features from restore-paywall-version branch...\n');
    
    await runNewFeaturesTests();
    
    console.log('\n✨ Test run completed!');
    
  } catch (error) {
    console.error('\n💥 Test runner error:', error.message);
    process.exit(1);
  }
}

// Run the tests
main();
