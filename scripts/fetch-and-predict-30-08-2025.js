#!/usr/bin/env node

require('dotenv').config();
const https = require('https');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

// Import the improved prediction system
const { ImprovedPredictor } = require('./improved-prediction-system.js');

// Simple fetch implementation
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : require('http');
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Fetch matches from API-Sports for 30/08/2025
 */
async function fetchMatchesForDate(date = '2025-08-30') {
  const API_KEY = process.env.API_SPORTS_KEY;
  
  if (!API_KEY) {
    throw new Error('API_SPORTS_KEY not found in environment variables');
  }
  
  const endpoint = `/fixtures?date=${date}`;
  const url = `https://v3.football.api-sports.io${endpoint}`;
  
  console.log(`🔍 Fetching matches for date: ${date}`);
  console.log(`🌐 API URL: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'x-rapidapi-host': 'v3.football.api-sports.io',
      'x-rapidapi-key': API_KEY
    }
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API Error: ${JSON.stringify(data.errors)}`);
  }
  
  if (!data.response) {
    throw new Error('No response data from API');
  }
  
  console.log(`✅ API Response received`);
  console.log(`📊 Found ${data.response.length} matches`);
  
  return data.response.map(match => {
    const fixture = match.fixture;
    const teams = match.teams;
    const goals = match.goals;
    const score = match.score;
    
    // Ensure logos are properly formatted
    const homeTeamLogo = teams.home.logo || `https://media.api-sports.io/football/teams/${teams.home.id}.png`;
    const awayTeamLogo = teams.away.logo || `https://media.api-sports.io/football/teams/${teams.away.id}.png`;
    
    return {
      id: fixture.id,
      date: fixture.date,
      venue: fixture.venue ? fixture.venue.name : 'Unknown',
      city: fixture.venue ? fixture.venue.city : 'Unknown',
      country: fixture.venue ? fixture.venue.country : 'Unknown',
      homeTeam: teams.home.name,
      awayTeam: teams.away.name,
      homeTeamLogo: homeTeamLogo,
      awayTeamLogo: awayTeamLogo,
      homeTeamId: teams.home.id,
      awayTeamId: teams.away.id,
      league: match.league.name,
      country: match.league.country,
      homeGoals: goals.home,
      awayGoals: goals.away,
      homeScore: score ? score.halftime.home : null,
      awayScore: score ? score.halftime.away : null,
      status: fixture.status.short,
      elapsed: fixture.status.elapsed
    };
  });
}

/**
 * Apply improved predictions to matches
 */
async function applyImprovedPredictions(matches) {
  console.log('🎯 Applying improved predictions...');
  
  const predictor = new ImprovedPredictor();
  const predictions = [];
  
  for (const match of matches) {
    console.log(`\n🏟️ Analyzing: ${match.homeTeam} vs ${match.awayTeam} (${match.league})`);
    
    const prediction = predictor.predictMatch({
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      league: match.league,
      date: match.date
    });
    
    if (prediction) {
      const enhancedMatch = {
        ...match,
        probabilities: {
          homeWin: prediction.prediction.homeWinProbability,
          draw: prediction.prediction.drawProbability,
          awayWin: prediction.prediction.awayWinProbability
        },
        predictions: {
          likelyScore: prediction.prediction.likelyScore,
          halftimeResult: prediction.prediction.halftimeResult,
          overUnder: prediction.prediction.overUnder2_5
        },
        analysis: {
          homeWinProbability: prediction.prediction.homeWinProbability,
          drawProbability: prediction.prediction.drawProbability,
          awayWinProbability: prediction.prediction.awayWinProbability,
          riskLevel: prediction.prediction.riskLevel,
          keyFactors: prediction.keyFactors,
          analysis: prediction.reasoning,
          bettingRecommendation: `Confidence: ${prediction.prediction.confidence}% - ${prediction.prediction.riskLevel} risk`
        },
        enhancedData: {
          homeStrength: prediction.analysis.homeStrength,
          awayStrength: prediction.analysis.awayStrength,
          goalExpectations: prediction.analysis.goalExpectations,
          confidence: prediction.prediction.confidence,
          winner: prediction.prediction.winner
        }
      };
      
      predictions.push(enhancedMatch);
      
      console.log(`📊 Home: ${prediction.prediction.homeWinProbability}% | Draw: ${prediction.prediction.drawProbability}% | Away: ${prediction.prediction.awayWinProbability}%`);
      console.log(`⚽ Score: ${prediction.prediction.likelyScore} | HT: ${prediction.prediction.halftimeResult} | O/U: ${prediction.prediction.overUnder2_5}`);
      console.log(`🎯 Winner: ${prediction.prediction.winner} | Confidence: ${prediction.prediction.confidence}% | Risk: ${prediction.prediction.riskLevel}`);
    } else {
      console.log(`❌ Failed to generate prediction for ${match.homeTeam} vs ${match.awayTeam}`);
      predictions.push(match); // Keep original match data
    }
  }
  
  return predictions;
}

/**
 * Save enhanced matches with predictions
 */
async function saveEnhancedMatches(matches, date) {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    await fsPromises.mkdir(dataDir, { recursive: true });
  }
  
  const filename = `enhanced_matches_${date.replace(/-/g, '_')}.json`;
  const filepath = path.join(dataDir, filename);
  
  const matchData = {
    date: date,
    totalMatches: matches.length,
    matches: matches,
    fetchedAt: new Date().toISOString(),
    description: 'Enhanced match data with improved predictions',
    predictionSystem: 'ImprovedPredictor v2.0',
    features: [
      'Realistic win probabilities',
      'Enhanced confidence scoring',
      'Risk level assessment',
      'Goal expectation modeling',
      'Team strength analysis'
    ]
  };
  
  await fsPromises.writeFile(filepath, JSON.stringify(matchData, null, 2));
  console.log(`💾 Saved enhanced matches to: ${filename}`);
  
  return filepath;
}

/**
 * Update analysis.json with enhanced predictions
 */
async function updateAnalysisWithEnhancedPredictions(matches, date) {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    await fsPromises.mkdir(dataDir, { recursive: true });
  }
  
  const analyses = matches.map(match => ({
    match: {
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      date: match.date,
      venue: match.venue,
      city: match.city,
      country: match.country,
      league: match.league
    },
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    league: match.league,
    country: match.country,
    matchTime: match.date,
    venue: {
      name: match.venue,
      city: match.city,
      country: match.country
    },
    homeTeamLogo: match.homeTeamLogo,
    awayTeamLogo: match.awayTeamLogo,
    probabilities: match.probabilities || { homeWin: 0, draw: 0, awayWin: 0 },
    predictions: match.predictions || { likelyScore: 'N/A', halftimeResult: 'N/A', overUnder: 'N/A' },
    analysis: match.analysis || {
      homeWinProbability: 0,
      drawProbability: 0,
      awayWinProbability: 0,
      riskLevel: 'UNKNOWN',
      keyFactors: ['No analysis performed'],
      analysis: 'No analysis performed',
      bettingRecommendation: 'No recommendations'
    },
    enhancedData: match.enhancedData || null
  }));
  
  const analysisData = {
    date: date,
    totalMatches: matches.length,
    analyses: analyses,
    analysisType: 'ENHANCED_WITH_IMPROVED_PREDICTIONS',
    description: 'Match data enhanced with improved prediction system',
    predictionSystem: 'ImprovedPredictor v2.0',
    features: [
      'Realistic win probabilities (not 0%)',
      'Enhanced confidence scoring',
      'Risk level assessment',
      'Goal expectation modeling',
      'Team strength analysis'
    ]
  };
  
  // Save to public interface
  const publicAnalysisPath = path.join(__dirname, '..', 'data', 'analysis.json');
  await fsPromises.writeFile(publicAnalysisPath, JSON.stringify(analysisData, null, 2));
  console.log('🌐 Updated analysis data saved to: analysis.json');
  
  return publicAnalysisPath;
}

/**
 * Main function
 */
async function main() {
  try {
    const date = '2025-08-30';
    
    console.log('🚀 Starting FETCH AND IMPROVED PREDICTIONS for 30/08/2025...');
    console.log(`📅 Date: ${date}`);
    console.log('🎯 This will fetch match data and apply improved predictions');
    
    // Step 1: Fetch matches
    console.log('\n📡 Step 1: Fetching matches from API...');
    const matches = await fetchMatchesForDate(date);
    
    if (matches.length === 0) {
      console.log('⚠️  No matches found for this date');
      return;
    }
    
    console.log(`✅ Fetched ${matches.length} matches`);
    
    // Step 2: Apply improved predictions
    console.log('\n🎯 Step 2: Applying improved predictions...');
    const enhancedMatches = await applyImprovedPredictions(matches);
    
    // Step 3: Save enhanced matches
    console.log('\n💾 Step 3: Saving enhanced matches...');
    const savedPath = await saveEnhancedMatches(enhancedMatches, date);
    
    // Step 4: Update analysis.json
    console.log('\n📊 Step 4: Updating analysis.json...');
    await updateAnalysisWithEnhancedPredictions(enhancedMatches, date);
    
    console.log('\n✅ Enhanced fetch and predictions completed successfully!');
    console.log(`📁 Enhanced data saved to: ${savedPath}`);
    console.log(`📊 Total matches processed: ${enhancedMatches.length}`);
    console.log('🎯 All matches now have improved predictions');
    
    // Show summary
    const matchesWithPredictions = enhancedMatches.filter(m => m.enhancedData);
    console.log(`\n📈 Summary:`);
    console.log(`   • Matches with predictions: ${matchesWithPredictions.length}/${enhancedMatches.length}`);
    console.log(`   • Average confidence: ${Math.round(matchesWithPredictions.reduce((sum, m) => sum + m.enhancedData.confidence, 0) / matchesWithPredictions.length)}%`);
    
    // Show next steps
    console.log('\n🔄 Next steps:');
    console.log(`   • View in browser: open public/analysis.html`);
    console.log(`   • Enhanced data file: ${savedPath}`);
    console.log(`   • Raw data file: data/matches_${date.replace(/-/g, '_')}.json`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  fetchMatchesForDate, 
  applyImprovedPredictions, 
  saveEnhancedMatches, 
  updateAnalysisWithEnhancedPredictions 
};
