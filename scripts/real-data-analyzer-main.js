#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { ChatGPTDataAnalyzer } = require('./chatgpt-data-analyzer.js');

/**
 * Main script for real data analysis
 */
async function main() {
  try {
    const inputFile = process.argv[2];
    
    if (!inputFile) {
      console.error('❌ Please provide an input file path');
      console.log('Usage: node real-data-analyzer-main.js <input-file>');
      process.exit(1);
    }
    
    const inputPath = path.resolve(inputFile);
    
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Input file not found: ${inputPath}`);
      process.exit(1);
    }
    
    console.log('🚀 Starting REAL DATA analysis...');
    console.log('📊 This will use ChatGPT to get actual team statistics and form data');
    
    const matchesData = JSON.parse(await fsPromises.readFile(inputPath, 'utf8'));
    console.log(`📊 Processing ${matchesData.length} matches from ${matchesData[0] ? matchesData[0].date : 'unknown date'}`);
    
    // Initialize ChatGPT analyzer
    const analyzer = new ChatGPTDataAnalyzer();
    
    // Analyze all matches with real data
    const analyses = await analyzer.analyzeAllMatches(matchesData);
    
    const analysisData = {
      date: matchesData[0] ? matchesData[0].date : new Date().toISOString().split('T')[0],
      totalMatches: matchesData.length,
      analyses: analyses,
      analysisType: 'REAL_DATA_CHATGPT',
      description: 'Analysis using real team statistics and form data from ChatGPT'
    };
    
    // Save to data directory
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      await fsPromises.mkdir(dataDir, { recursive: true });
    }
    
    const outputFilename = `real_analysis_${analysisData.date.replace(/-/g, '_')}.json`;
    const outputPath = path.join(dataDir, outputFilename);
    
    await fsPromises.writeFile(outputPath, JSON.stringify(analysisData, null, 2));
    console.log(`💾 Saved real data analysis to ${outputFilename}`);
    
    // Also save to public interface
    const publicAnalysisPath = path.join(__dirname, '..', 'data', 'analysis.json');
    await fsPromises.writeFile(publicAnalysisPath, JSON.stringify(analysisData, null, 2));
    console.log('🌐 Saved real data analysis to public interface: analysis.json');
    
    console.log('✅ Real data analysis completed successfully!');
    console.log(`📁 Analysis saved to: ${outputPath}`);
    console.log(`📊 Total matches analyzed: ${analyses.length}`);
    
    // Show sample analysis
    if (analyses.length > 0) {
      const sample = analyses[0];
      console.log(`\n📋 Sample REAL DATA analysis:`);
      console.log(`Match: ${sample.homeTeam} vs ${sample.awayTeam}`);
      console.log(`League: ${sample.league} (${sample.country})`);
      console.log(`Risk Level: ${sample.analysis.riskLevel.toUpperCase()}`);
      console.log(`Win Probabilities: Home ${sample.analysis.homeWinProbability}%, Draw ${sample.analysis.drawProbability}%, Away ${sample.analysis.awayWinProbability}%`);
      console.log(`Predicted Score: ${sample.predictions.likelyScore}`);
      console.log(`Analysis: ${sample.analysis.analysis}`);
      console.log(`Key Factors: ${sample.analysis.keyFactors.join(', ')}`);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main }; 