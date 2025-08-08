#!/usr/bin/env node

require('dotenv').config();

/**
 * Simple prediction function that works with existing data
 * This avoids rate limits by using local prediction logic
 */
function predictMatch(match) {
  // Simple prediction logic based on team names and league
  const homeTeam = match.homeTeam.toLowerCase();
  const awayTeam = match.awayTeam.toLowerCase();
  const league = match.league.toLowerCase();
  
  // Simple scoring based on team strength (mock data)
  let homeStrength = 50;
  let awayStrength = 50;
  
  // Adjust based on team names (simple logic)
  if (homeTeam.includes('barcelona') || homeTeam.includes('real') || homeTeam.includes('madrid')) {
    homeStrength = 75;
  }
  if (awayTeam.includes('barcelona') || awayTeam.includes('real') || awayTeam.includes('madrid')) {
    awayStrength = 75;
  }
  
  // Adjust based on league
  if (league.includes('premier') || league.includes('la liga') || league.includes('bundesliga')) {
    homeStrength += 10;
    awayStrength += 10;
  }
  
  // Calculate probabilities
  const totalStrength = homeStrength + awayStrength;
  const homeWinProbability = Math.round((homeStrength / totalStrength) * 100);
  const awayWinProbability = Math.round((awayStrength / totalStrength) * 100);
  const drawProbability = 100 - homeWinProbability - awayWinProbability;
  
  // Generate score prediction
  const homeGoals = Math.floor(Math.random() * 3) + 1;
  const awayGoals = Math.floor(Math.random() * 3);
  const likelyScore = `${homeGoals}-${awayGoals}`;
  const halftimeResult = `${Math.floor(homeGoals / 2)}-${Math.floor(awayGoals / 2)}`;
  
  // Determine winner
  const winner = homeGoals > awayGoals ? match.homeTeam : awayGoals > homeGoals ? match.awayTeam : 'Draw';
  
  // Generate reason
  const reasons = [
    `${match.homeTeam} has better form and home advantage`,
    `${match.awayTeam} has been performing well recently`,
    `Both teams are evenly matched`,
    `${match.homeTeam} has key players available`,
    `${match.awayTeam} has tactical advantage`
  ];
  const reason = reasons[Math.floor(Math.random() * reasons.length)];
  
  // Calculate risk level
  const maxProbability = Math.max(homeWinProbability, awayWinProbability, drawProbability);
  const riskLevel = maxProbability > 60 ? 'LOW' : maxProbability > 40 ? 'MEDIUM' : 'HIGH';
  
  // Generate corners
  const totalCorners = Math.floor(Math.random() * 10) + 8;
  const homeCorners = Math.floor(totalCorners / 2) + Math.floor(Math.random() * 3);
  const awayCorners = totalCorners - homeCorners;
  
  return {
    likelyScore: likelyScore,
    halftimeResult: halftimeResult,
    overUnder: (homeGoals + awayGoals) > 2.5 ? 'Over 2.5' : 'Under 2.5',
    corners: `${homeCorners}-${awayCorners}`,
    winner: winner,
    reason: reason,
    homeWinProbability: homeWinProbability,
    drawProbability: drawProbability,
    awayWinProbability: awayWinProbability,
    riskLevel: riskLevel,
    totalCorners: totalCorners,
    homeCorners: homeCorners,
    awayCorners: awayCorners
  };
}

/**
 * Simple script to predict a specific match
 */
async function predictSpecificMatch() {
  try {
    // Example match data
    const matchData = {
      homeTeam: "Barcelona",
      awayTeam: "Real Madrid",
      date: "2025-08-08T20:00:00Z",
      league: "La Liga",
      venue: "Camp Nou"
    };
    
    console.log('🤖 Starting match prediction...');
    console.log(`📊 Match: ${matchData.homeTeam} vs ${matchData.awayTeam}`);
    
    // Get prediction
    const prediction = predictMatch(matchData);
    
    console.log('\n✅ PREDICTION RESULTS:');
    console.log('='.repeat(50));
    console.log(`🏆 Winner: ${prediction.winner}`);
    console.log(`📊 Likely Score: ${prediction.likelyScore}`);
    console.log(`⏰ Halftime: ${prediction.halftimeResult}`);
    console.log(`🎯 Over/Under: ${prediction.overUnder}`);
    console.log(`⚽ Corners: ${prediction.corners}`);
    console.log(`💡 Reason: ${prediction.reason}`);
    console.log(`⚠️  Risk Level: ${prediction.riskLevel}`);
    console.log(`📈 Probabilities:`);
    console.log(`   Home Win: ${prediction.homeWinProbability}%`);
    console.log(`   Draw: ${prediction.drawProbability}%`);
    console.log(`   Away Win: ${prediction.awayWinProbability}%`);
    console.log(`📊 Corner Details:`);
    console.log(`   Total: ${prediction.totalCorners}`);
    console.log(`   Home: ${prediction.homeCorners}`);
    console.log(`   Away: ${prediction.awayCorners}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the prediction
if (require.main === module) {
  predictSpecificMatch();
}

module.exports = { predictSpecificMatch, predictMatch };
