#!/usr/bin/env node

const fs = require('fs');

console.log('🔍 Quick Logic Validation');
console.log('========================');

try {
  const data = JSON.parse(fs.readFileSync('data/analysis_2025_08_08T00:00:00+00:00.json', 'utf8'));
  
  console.log(`\n📊 Total matches: ${data.analyses.length}`);
  
  // Sample match analysis
  const sample = data.analyses[0];
  console.log('\n📊 Sample Match Analysis:');
  console.log(`Match: ${sample.homeTeam} vs ${sample.awayTeam}`);
  console.log(`League: ${sample.league}`);
  console.log(`Home Win: ${sample.analysis.homeWinProbability}%`);
  console.log(`Away Win: ${sample.analysis.awayWinProbability}%`);
  console.log(`Draw: ${sample.analysis.drawProbability}%`);
  console.log(`Risk Level: ${sample.analysis.riskLevel}`);
  
  const totalProb = sample.analysis.homeWinProbability + sample.analysis.awayWinProbability + sample.analysis.drawProbability;
  console.log(`Total Probability: ${totalProb}%`);
  
  // Logic checks
  console.log('\n✅ Logic Check:');
  const probSumCheck = Math.abs(totalProb - 100) <= 5;
  console.log(`- Probabilities sum to ~100%: ${probSumCheck ? 'PASS' : 'FAIL'}`);
  
  const homeProb = sample.analysis.homeWinProbability;
  const riskLevel = sample.analysis.riskLevel;
  let riskCheck = false;
  
  if (homeProb > 55 && riskLevel === 'LOW') {
    riskCheck = true;
  } else if (homeProb > 35 && homeProb <= 55 && riskLevel === 'MEDIUM') {
    riskCheck = true;
  } else if (homeProb <= 35 && riskLevel === 'HIGH') {
    riskCheck = true;
  }
  
  console.log(`- Risk level matches probability: ${riskCheck ? 'PASS' : 'FAIL'}`);
  
  // Check all matches for consistency
  console.log('\n🔍 Checking all matches for consistency...');
  let consistentMatches = 0;
  let totalProbErrors = 0;
  let riskLevelErrors = 0;
  
  data.analyses.forEach((match, index) => {
    const homeProb = match.analysis.homeWinProbability;
    const awayProb = match.analysis.awayWinProbability;
    const drawProb = match.analysis.drawProbability;
    const riskLevel = match.analysis.riskLevel;
    
    const totalProb = homeProb + awayProb + drawProb;
    if (Math.abs(totalProb - 100) > 5) {
      totalProbErrors++;
    }
    
    let expectedRiskLevel;
    if (homeProb > 55) {
      expectedRiskLevel = 'LOW';
    } else if (homeProb > 35) {
      expectedRiskLevel = 'MEDIUM';
    } else {
      expectedRiskLevel = 'HIGH';
    }
    
    if (riskLevel !== expectedRiskLevel) {
      riskLevelErrors++;
    } else {
      consistentMatches++;
    }
  });
  
  console.log(`\n📊 Consistency Results:`);
  console.log(`- Consistent matches: ${consistentMatches}/${data.analyses.length} (${(consistentMatches/data.analyses.length*100).toFixed(1)}%)`);
  console.log(`- Probability sum errors: ${totalProbErrors}`);
  console.log(`- Risk level errors: ${riskLevelErrors}`);
  
  if (totalProbErrors === 0 && riskLevelErrors === 0) {
    console.log('\n✅ All matches pass validation!');
  } else {
    console.log('\n⚠️  Some validation issues found');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
} 