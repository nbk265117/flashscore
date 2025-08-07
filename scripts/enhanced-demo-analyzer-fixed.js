#!/usr/bin/env node

require('dotenv').config();

/**
 * Enhanced Demo Analyzer (Fixed Version)
 * 
 * This script generates enhanced analysis for football matches using simulated data
 * but with proper date handling from processed matches.
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Generate enhanced team data based on team name
 */
function generateEnhancedTeamData(teamName, isHome = false) {
  const teamHash = teamName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const formResults = [];
  const formOptions = ['W', 'D', 'L'];

  for (let i = 0; i < 5; i++) {
    const random = (teamHash + i) % 100;
    if (random < 40) formResults.push('W');
    else if (random < 70) formResults.push('D');
    else formResults.push('L');
  }

  const injuryTypes = ['Knee', 'Hamstring', 'Ankle', 'Groin', 'Calf', 'Shoulder'];
  const injuries = [];
  const injuryCount = Math.floor(Math.random() * 3);

  for (let i = 0; i < injuryCount; i++) {
    const playerName = `Player ${String.fromCharCode(65 + i)}`;
    const injuryType = injuryTypes[Math.floor(Math.random() * injuryTypes.length)];
    injuries.push(`${playerName} (${injuryType})`);
  }

  const positions = ['Striker', 'Midfielder', 'Defender', 'Goalkeeper'];
  const keyPlayers = [];
  const playerCount = 3 + Math.floor(Math.random() * 2);

  for (let i = 0; i < playerCount; i++) {
    const position = positions[Math.floor(Math.random() * positions.length)];
    const playerName = `${position} ${String.fromCharCode(88 + i)}`;
    keyPlayers.push(playerName);
  }

  const recentGoals = Math.floor(Math.random() * 8) + 3;
  const recentConceded = Math.floor(Math.random() * 6) + 2;
  const homeAdvantage = isHome && Math.random() > 0.3;

  return {
    last5: formResults,
    injuries: injuries,
    keyPlayers: keyPlayers,
    homeAdvantage: homeAdvantage,
    recentGoals: recentGoals,
    recentConceded: recentConceded,
    form: formResults.filter(r => r === 'W').length / 5
  };
}

/**
 * Analyze a single match
 */
function analyzeMatch(match) {
  const homeTeam = match.homeTeam || 'Home Team';
  const awayTeam = match.awayTeam || 'Away Team';
  const league = (match.league && match.league.name) || 'Unknown League';
  const country = (match.league && match.league.country) || 'Unknown Country';
  const matchTime = (match.date) ? new Date(match.date).toISOString() : new Date().toISOString();
  const venue = match.venue || {};
  const venueName = venue.name || 'Unknown Venue';
  const venueCity = venue.city || 'Unknown City';

  // Generate enhanced team data
  const homeTeamData = generateEnhancedTeamData(homeTeam, true);
  const awayTeamData = generateEnhancedTeamData(awayTeam, false);

  // Calculate win probabilities based on form and home advantage
  const homeForm = homeTeamData.form;
  const awayForm = awayTeamData.form;
  const homeAdvantage = homeTeamData.homeAdvantage ? 0.12 : 0;
  
  // Base probabilities (more realistic)
  let homeBase = homeForm * 0.4; // Max 40% from form
  let awayBase = awayForm * 0.35; // Max 35% from form
  let drawBase = 0.25; // Base 25% for draw
  
  // Add home advantage
  homeBase += homeAdvantage;
  
  // Normalize to ensure realistic ranges
  const total = homeBase + awayBase + drawBase;
  
  let homeWinProbability = Math.round((homeBase / total) * 100);
  let awayWinProbability = Math.round((awayBase / total) * 100);
  let drawProbability = Math.round((drawBase / total) * 100);
  
  // Ensure minimum realistic values
  homeWinProbability = Math.max(15, Math.min(65, homeWinProbability));
  awayWinProbability = Math.max(10, Math.min(55, awayWinProbability));
  drawProbability = Math.max(20, Math.min(40, drawProbability));
  
  // Normalize to 100%
  const totalProb = homeWinProbability + awayWinProbability + drawProbability;
  homeWinProbability = Math.round((homeWinProbability / totalProb) * 100);
  awayWinProbability = Math.round((awayWinProbability / totalProb) * 100);
  drawProbability = 100 - homeWinProbability - awayWinProbability;
  
  // Generate score predictions based on win probabilities
  let homeGoals, awayGoals;
  
  if (homeWinProbability > awayWinProbability) {
    // Home team is more likely to win
    homeGoals = Math.floor(Math.random() * 3) + 2; // 2-4 goals
    awayGoals = Math.floor(Math.random() * 2); // 0-1 goals
  } else if (awayWinProbability > homeWinProbability) {
    // Away team is more likely to win
    homeGoals = Math.floor(Math.random() * 2); // 0-1 goals
    awayGoals = Math.floor(Math.random() * 3) + 1; // 1-3 goals
  } else {
    // Close match or draw
    homeGoals = Math.floor(Math.random() * 2) + 1; // 1-2 goals
    awayGoals = Math.floor(Math.random() * 2) + 1; // 1-2 goals
  }
  
  const halftimeHomeGoals = Math.floor(homeGoals * 0.6);
  const halftimeAwayGoals = Math.floor(awayGoals * 0.6);
  
  // Generate corner predictions
  const totalCorners = Math.floor(Math.random() * 8) + 6;
  const homeCorners = Math.floor(totalCorners * 0.6);
  const awayCorners = totalCorners - homeCorners;
  
  // Generate card predictions
  const yellowCards = Math.floor(Math.random() * 4) + 3;
  const redCards = Math.random() > 0.8 ? 1 : 0;
  
  // Generate substitution predictions
  const homeSubs = Math.floor(Math.random() * 2) + 2;
  const awaySubs = Math.floor(Math.random() * 2) + 2;
  
  // Generate key factors
  const keyFactors = [];
  if (homeTeamData.injuries.length > 0) {
    keyFactors.push(`Home team missing ${homeTeamData.injuries.length} key players`);
  }
  if (awayTeamData.injuries.length > 0) {
    keyFactors.push(`Away team missing ${awayTeamData.injuries.length} key players`);
  }
  if (homeTeamData.form > 0.6) {
    keyFactors.push('Home team in excellent form');
  }
  if (awayTeamData.form < 0.3) {
    keyFactors.push('Away team struggling recently');
  }
  if (homeTeamData.homeAdvantage) {
    keyFactors.push('Strong home advantage');
  }
  if (keyFactors.length === 0) {
    keyFactors.push('Balanced match expected');
  }
  
  // Generate analysis text
  const analysis = `Based on recent form, ${homeTeam} (${homeTeamData.form * 100}% win rate) faces ${awayTeam} (${awayTeamData.form * 100}% win rate). ${homeTeam} has scored ${homeTeamData.recentGoals} goals in their last 5 matches while conceding ${homeTeamData.recentConceded}. ${awayTeam} has scored ${awayTeamData.recentGoals} goals and conceded ${awayTeamData.recentConceded}. ${homeTeamData.homeAdvantage ? 'Home advantage could be crucial.' : 'No significant home advantage.'}`;
  
  // Generate betting recommendation
  let bettingRecommendation = '';
  let riskLevel = 'medium';
  
  if (homeWinProbability > 60) {
    bettingRecommendation = `Home win recommended with ${homeWinProbability}% probability. Consider home win with moderate confidence.`;
    riskLevel = 'low';
  } else if (awayWinProbability > 50) {
    bettingRecommendation = `Away win possible with ${awayWinProbability}% probability. Consider away win with caution.`;
    riskLevel = 'medium';
  } else {
    bettingRecommendation = `Close match expected. Draw or home win could be good options.`;
    riskLevel = 'high';
  }

  return {
    homeTeam,
    awayTeam,
    homeTeamLogo: (match.teams && match.teams.home && match.teams.home.logo) || '',
    awayTeamLogo: (match.teams && match.teams.away && match.teams.away.logo) || '',
    league,
    country,
    matchTime,
    venue: {
      name: venueName,
      city: venueCity,
      country: venue.country || 'Unknown Country'
    },
    analysis: {
      homeWinProbability,
      awayWinProbability,
      drawProbability,
      halftime: {
        homeWinProbability: Math.round(homeWinProbability * 0.9),
        awayWinProbability: Math.round(awayWinProbability * 0.9),
        drawProbability: Math.round(drawProbability * 1.2),
        prediction: halftimeHomeGoals > halftimeAwayGoals ? "Home team likely to lead at halftime" : 
                   halftimeAwayGoals > halftimeHomeGoals ? "Away team likely to lead at halftime" : 
                   "Close first half expected",
        scorePrediction: `${halftimeHomeGoals}-${halftimeAwayGoals}`
      },
      finalScore: {
        homeScore: homeGoals.toString(),
        awayScore: awayGoals.toString(),
        prediction: `${homeGoals}-${awayGoals}`
      },
      corners: {
        total: `${totalCorners}-${totalCorners + 2}`,
        homeTeam: `${homeCorners}-${homeCorners + 1}`,
        awayTeam: `${awayCorners}-${awayCorners + 1}`,
        prediction: "Standard corner count expected"
      },
      cards: {
        yellowCards: `${yellowCards}-${yellowCards + 2}`,
        redCards: `${redCards}-${redCards + 1}`,
        homeTeamCards: `${Math.floor(yellowCards * 0.4)}-${Math.floor(yellowCards * 0.6)}`,
        awayTeamCards: `${Math.floor(yellowCards * 0.6)}-${Math.floor(yellowCards * 0.8)}`,
        prediction: "Moderate card count expected"
      },
      substitutions: {
        homeTeam: `${homeSubs}-${homeSubs + 1}`,
        awayTeam: `${awaySubs}-${awaySubs + 1}`,
        timing: "Most substitutions between 60-75 minutes",
        prediction: "Standard substitution pattern expected"
      },
      keyFactors,
      analysis,
      bettingRecommendation,
      riskLevel
    }
  };
}

/**
 * Generate enhanced analysis for all matches
 */
async function generateEnhancedAnalysis() {
  try {
    console.log('🤖 Starting enhanced demo analysis generation...');
    
    // Load matches data
    const matchesData = await fs.readFile('data/processed_matches.json', 'utf8');
    const matches = JSON.parse(matchesData);
    
    console.log(`📊 Found ${matches.length} matches to analyze`);
    
    const analyses = [];
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const analysis = analyzeMatch(match);
      analyses.push(analysis);
      
      console.log(`✅ Analyzed ${i + 1}/${matches.length}: ${analysis.homeTeam} vs ${analysis.awayTeam}`);
    }
    
    // Save enhanced analysis
    const outputPath = 'data/enhanced_analysis.json';
    await fs.writeFile(outputPath, JSON.stringify(analyses, null, 2));
    
    console.log(`\n🎉 Enhanced analysis completed!`);
    console.log(`✅ Successfully analyzed: ${analyses.length} matches`);
    console.log(`📁 Enhanced analysis saved to: ${path.resolve(outputPath)}`);
    
    // Display sample analysis
    if (analyses.length > 0) {
      const sample = analyses[0];
      console.log(`\n📋 Sample enhanced analysis:`);
      console.log(`Match: ${sample.homeTeam} vs ${sample.awayTeam}`);
      console.log(`League: ${sample.league} (${sample.country})`);
      console.log(`Risk Level: ${sample.analysis.riskLevel.toUpperCase()}`);
      console.log(`Win Probabilities: Home ${sample.analysis.homeWinProbability}%, Draw ${sample.analysis.drawProbability}%, Away ${sample.analysis.awayWinProbability}%`);
      console.log(`Key Factors: ${sample.analysis.keyFactors.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error generating enhanced analysis:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateEnhancedAnalysis();
}

module.exports = {
  generateEnhancedAnalysis,
  analyzeMatch
}; 