#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Update analysis data to replace N/A and 0 values with "-"
 */
function updateAnalysisDisplay() {
  const dataDir = path.join(__dirname, '..', 'data');
  const publicDataDir = path.join(__dirname, '..', 'public', 'data');
  
  const files = [
    path.join(dataDir, 'analysis.json'),
    path.join(publicDataDir, 'analysis.json')
  ];
  
  files.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      console.log(`📝 Updating: ${filePath}`);
      
      try {
        // Read the file
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Update each analysis entry
        data.analyses.forEach(analysis => {
          // Replace 0 probabilities with "-"
          if (analysis.probabilities) {
            if (analysis.probabilities.homeWin === 0) analysis.probabilities.homeWin = "-";
            if (analysis.probabilities.draw === 0) analysis.probabilities.draw = "-";
            if (analysis.probabilities.awayWin === 0) analysis.probabilities.awayWin = "-";
          }
          
          // Replace N/A predictions with "-"
          if (analysis.predictions) {
            if (analysis.predictions.likelyScore === "N/A") analysis.predictions.likelyScore = "-";
            if (analysis.predictions.halftimeResult === "N/A") analysis.predictions.halftimeResult = "-";
            if (analysis.predictions.overUnder === "N/A") analysis.predictions.overUnder = "-";
          }
          
          // Replace 0 analysis probabilities with "-"
          if (analysis.analysis) {
            if (analysis.analysis.homeWinProbability === 0) analysis.analysis.homeWinProbability = "-";
            if (analysis.analysis.drawProbability === 0) analysis.analysis.drawProbability = "-";
            if (analysis.analysis.awayWinProbability === 0) analysis.analysis.awayWinProbability = "-";
          }
        });
        
        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✅ Updated: ${filePath}`);
        
      } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
      }
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  });
}

// Run the update
updateAnalysisDisplay();
console.log('🎯 Analysis display updated successfully!');
