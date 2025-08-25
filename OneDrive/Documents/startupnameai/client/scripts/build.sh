#!/bin/bash
set -e

echo "🚀 Starting network-resilient build process..."

# Set npm configuration for network issues
npm config set fetch-timeout 600000
npm config set fetch-retries 10
npm config set fetch-retry-mintimeout 10000
npm config set fetch-retry-maxtimeout 60000
npm config set audit false
npm config set fund false

echo "📦 Installing dependencies with network resilience..."
npm ci --prefer-offline --no-audit --no-fund --loglevel=error || {
  echo "❌ npm ci failed, trying npm install..."
  npm install --prefer-offline --no-audit --no-fund --loglevel=error
}

echo "🏗️ Building application..."
CI=false npm run build

echo "✅ Build completed successfully!"