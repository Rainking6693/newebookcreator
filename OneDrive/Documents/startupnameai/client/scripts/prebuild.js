#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting StartupNamer.ai pre-build optimization...');

// Ensure all required environment variables are present
const requiredEnvVars = [
  'REACT_APP_API_URL',
  'REACT_APP_STRIPE_PUBLISHABLE_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease set these variables in your Netlify dashboard.');
  process.exit(1);
}

// Validate API URL format
const apiUrl = process.env.REACT_APP_API_URL;
if (!apiUrl.startsWith('https://')) {
  console.error('❌ REACT_APP_API_URL must use HTTPS in production');
  process.exit(1);
}

// Create build info
const buildInfo = {
  buildTime: new Date().toISOString(),
  environment: 'production',
  apiUrl: process.env.REACT_APP_API_URL,
  version: require('../package.json').version,
  commit: process.env.COMMIT_REF || 'unknown'
};

// Write build info to public directory
fs.writeFileSync(
  path.join(__dirname, '../public/build-info.json'),
  JSON.stringify(buildInfo, null, 2)
);

console.log('✅ Pre-build optimization complete!');
console.log(`📦 Building for: ${apiUrl}`);