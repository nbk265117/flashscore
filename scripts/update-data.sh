#!/bin/bash

echo "🔄 Starting automatic data update and deployment..."

# Step 1: Update data files (if you have a data fetching script)
echo "📊 Updating data files..."
if [ -f "scripts/fetch-daily-data.js" ]; then
    echo "Running data fetch script..."
    node scripts/fetch-daily-data.js
else
    echo "No data fetch script found, skipping data update"
fi

# Step 2: Copy data files to public directory
echo "📁 Copying data files to public directory..."
mkdir -p public

# Copy all data files
cp data/processed_matches.json public/ 2>/dev/null || echo "⚠️  processed_matches.json not found"
cp data/analysis.json public/ 2>/dev/null || echo "⚠️  analysis.json not found"
cp data/comparison.json public/ 2>/dev/null || echo "⚠️  comparison.json not found"

# Step 3: Check if files were copied successfully
echo "✅ Verifying copied files..."
files_copied=0
if [ -f "public/processed_matches.json" ]; then
    echo "✅ processed_matches.json copied successfully"
    ((files_copied++))
fi

if [ -f "public/analysis.json" ]; then
    echo "✅ analysis.json copied successfully"
    ((files_copied++))
fi

if [ -f "public/comparison.json" ]; then
    echo "✅ comparison.json copied successfully"
    ((files_copied++))
fi

echo "📊 Total files copied: $files_copied"

# Step 4: Git operations
echo "📝 Preparing git commit..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "💾 Committing changes..."
    git commit -m "Auto-update: $(date '+%Y-%m-%d %H:%M:%S') - Update data files"
    
    echo "🚀 Pushing to GitHub..."
    git push origin main
    
    echo "🎉 Deployment completed!"
    echo "⏱️  Your site will be updated in 2-5 minutes"
    echo "🌐 Netlify: https://your-site-name.netlify.app"
    echo "🌐 GitHub Pages: https://nbk265117.github.io/flashscore/"
else
    echo "❌ No changes detected, skipping deployment"
fi

echo "✅ Automatic update process completed!" 