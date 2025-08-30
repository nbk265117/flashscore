#!/bin/bash

echo "🚀 Starting deployment process..."

# Create public directory if it doesn't exist
mkdir -p public

# Copy data files to public directory
echo "📁 Copying data files to public directory..."
mkdir -p public/data
cp data/processed_matches.json public/data/ 2>/dev/null || echo "⚠️  processed_matches.json not found"
cp data/analysis.json public/data/ 2>/dev/null || echo "⚠️  analysis.json not found"
cp data/comparison.json public/data/ 2>/dev/null || echo "⚠️  comparison.json not found"
cp data/enhanced_matches_2025_08_30.json public/data/ 2>/dev/null || echo "⚠️  enhanced_matches_2025_08_30.json not found"

# Check if files were copied successfully
echo "✅ Checking copied files..."
if [ -f "public/data/processed_matches.json" ]; then
    echo "✅ processed_matches.json copied successfully"
else
    echo "❌ processed_matches.json not found in data directory"
fi

if [ -f "public/data/analysis.json" ]; then
    echo "✅ analysis.json copied successfully"
else
    echo "❌ analysis.json not found in data directory"
fi

if [ -f "public/data/comparison.json" ]; then
    echo "✅ comparison.json copied successfully"
else
    echo "❌ comparison.json not found in data directory"
fi

if [ -f "public/data/enhanced_matches_2025_08_30.json" ]; then
    echo "✅ enhanced_matches_2025_08_30.json copied successfully"
else
    echo "❌ enhanced_matches_2025_08_30.json not found in data directory"
fi

echo "🎉 Deployment preparation completed!"
echo "📝 Next steps:"
echo "   1. git add ."
echo "   2. git commit -m 'Auto-deploy: Update data files'"
echo "   3. git push origin main" 