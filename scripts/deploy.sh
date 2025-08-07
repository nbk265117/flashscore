#!/bin/bash

echo "🚀 Starting deployment process..."

# Create public directory if it doesn't exist
mkdir -p public

# Copy data files to public directory
echo "📁 Copying data files to public directory..."
cp data/processed_matches.json public/ 2>/dev/null || echo "⚠️  processed_matches.json not found"
cp data/analysis.json public/ 2>/dev/null || echo "⚠️  analysis.json not found"
cp data/comparison.json public/ 2>/dev/null || echo "⚠️  comparison.json not found"

# Check if files were copied successfully
echo "✅ Checking copied files..."
if [ -f "public/processed_matches.json" ]; then
    echo "✅ processed_matches.json copied successfully"
else
    echo "❌ processed_matches.json not found in data directory"
fi

if [ -f "public/analysis.json" ]; then
    echo "✅ analysis.json copied successfully"
else
    echo "❌ analysis.json not found in data directory"
fi

if [ -f "public/comparison.json" ]; then
    echo "✅ comparison.json copied successfully"
else
    echo "❌ comparison.json not found in data directory"
fi

echo "🎉 Deployment preparation completed!"
echo "📝 Next steps:"
echo "   1. git add ."
echo "   2. git commit -m 'Auto-deploy: Update data files'"
echo "   3. git push origin main" 