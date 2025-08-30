#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function checkEnhancedData() {
  try {
    const dataPath = path.join(__dirname, '..', 'data', 'enhanced_matches_2025_08_30.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log('🔍 Checking enhanced data structure...\n');
    
    // Check first few matches
    const firstMatch = data.matches[0];
    console.log('📋 First match structure:');
    console.log(JSON.stringify(firstMatch, null, 2));
    
    // Check for confidence values
    const matchesWithConfidence = data.matches.filter(m => m.enhancedData && m.enhancedData.confidence);
    const matchesWithoutConfidence = data.matches.filter(m => !m.enhancedData || !m.enhancedData.confidence);
    
    console.log(`\n📊 Confidence Analysis:`);
    console.log(`Matches with confidence: ${matchesWithConfidence.length}`);
    console.log(`Matches without confidence: ${matchesWithoutConfidence.length}`);
    
    if (matchesWithConfidence.length > 0) {
      const sampleMatch = matchesWithConfidence[0];
      console.log(`\n✅ Sample match with confidence:`);
      console.log(`Home: ${sampleMatch.homeTeam} vs Away: ${sampleMatch.awayTeam}`);
      console.log(`Confidence: ${sampleMatch.enhancedData.confidence}`);
      console.log(`Winner: ${sampleMatch.enhancedData.winner}`);
    }
    
    if (matchesWithoutConfidence.length > 0) {
      const sampleMatch = matchesWithoutConfidence[0];
      console.log(`\n❌ Sample match without confidence:`);
      console.log(`Home: ${sampleMatch.homeTeam} vs Away: ${sampleMatch.awayTeam}`);
      console.log(`Enhanced data:`, sampleMatch.enhancedData);
    }
    
    // Check all unique confidence values
    const confidenceValues = [...new Set(data.matches
      .filter(m => m.enhancedData && m.enhancedData.confidence)
      .map(m => m.enhancedData.confidence))];
    
    console.log(`\n🎯 Unique confidence values:`, confidenceValues);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

if (require.main === module) {
  checkEnhancedData();
}
