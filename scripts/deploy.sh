#!/bin/bash

# Flashinio Score Deployment Script
# Deploy to Netlify

echo "🚀 Starting deployment to Netlify..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Build the project (if needed)
echo "📦 Building project..."
npm run build

# Deploy to Netlify
echo "🌐 Deploying to Netlify..."
netlify deploy --prod --dir=public

echo "✅ Deployment completed!"
echo "🌍 Your site is live at: https://your-site-name.netlify.app" 