#!/usr/bin/env node

require('dotenv').config();
const https = require('https');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

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
 * Fetch matches from API-Sports
 */
async function fetchMatchesByDate(date) {
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
 * Load existing analysis data
 */
async function loadExistingAnalysis() {
  try {
    const analysisPath = path.join(__dirname, '..', 'data', 'analysis.json');
    if (fs.existsSync(analysisPath)) {
      const data = await fsPromises.readFile(analysisPath, 'utf8');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error loading existing analysis:', error.message);
    return null;
  }
}

/**
 * Update analysis data with new matches while preserving predictions
 */
async function updateAnalysisWithMatches(matches, date) {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    await fsPromises.mkdir(dataDir, { recursive: true });
  }
  
  // Load existing analysis data
  const existingAnalysis = await loadExistingAnalysis();
  
  // Create new analysis entries for the matches
  const newAnalyses = matches.map(match => ({
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
    probabilities: {
      homeWin: 0,
      draw: 0,
      awayWin: 0
    },
    predictions: {
      likelyScore: 'N/A',
      halftimeResult: 'N/A',
      overUnder: 'N/A'
    },
    analysis: {
      homeWinProbability: 0,
      drawProbability: 0,
      awayWinProbability: 0,
      riskLevel: 'UNKNOWN',
      keyFactors: ['No analysis performed'],
      analysis: 'No analysis performed - raw data only',
      bettingRecommendation: 'No recommendations - raw data only'
    }
  }));
  
  // If we have existing analysis with predictions, merge them
  if (existingAnalysis && existingAnalysis.analyses) {
    console.log('🔄 Merging with existing analysis data...');
    
    // Create a map of existing analyses by match ID
    const existingMap = new Map();
    existingAnalysis.analyses.forEach(analysis => {
      const matchId = analysis.match.id;
      existingMap.set(matchId, analysis);
    });
    
    // Update new analyses with existing predictions
    newAnalyses.forEach(analysis => {
      const matchId = analysis.match.id;
      const existing = existingMap.get(matchId);
      if (existing) {
        // Preserve predictions from existing analysis
        analysis.winner = existing.winner;
        analysis.likelyScore = existing.likelyScore;
        analysis.halftimeResult = existing.halftimeResult;
        analysis.overUnder = existing.overUnder;
        analysis.homeWinProbability = existing.homeWinProbability;
        analysis.drawProbability = existing.drawProbability;
        analysis.awayWinProbability = existing.awayWinProbability;
        analysis.confidence = existing.confidence;
        analysis.riskLevel = existing.riskLevel;
        analysis.analysis = existing.analysis;
        analysis.predictions = existing.predictions;
        analysis.probabilities = existing.probabilities;
      }
    });
  }
  
  const analysisData = {
    date: date,
    totalMatches: matches.length,
    analyses: newAnalyses,
    analysisType: existingAnalysis ? 'MERGED_WITH_PREDICTIONS' : 'RAW_DATA_ONLY',
    description: existingAnalysis ? 'Match data merged with existing predictions' : 'Raw match data without predictions or analysis'
  };
  
  // Save to public interface
  const publicAnalysisPath = path.join(__dirname, '..', 'data', 'analysis.json');
  await fsPromises.writeFile(publicAnalysisPath, JSON.stringify(analysisData, null, 2));
  console.log('🌐 Updated analysis data saved to: analysis.json');
  
  return publicAnalysisPath;
}

/**
 * Save matches to file
 */
async function saveMatches(matches, date) {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    await fsPromises.mkdir(dataDir, { recursive: true });
  }
  
  const filename = `matches_${date.replace(/-/g, '_')}.json`;
  const filepath = path.join(dataDir, filename);
  
  const matchData = {
    date: date,
    totalMatches: matches.length,
    matches: matches,
    fetchedAt: new Date().toISOString(),
    description: 'Raw match data from API-Sports'
  };
  
  await fsPromises.writeFile(filepath, JSON.stringify(matchData, null, 2));
  console.log(`💾 Saved matches to: ${filename}`);
  
  return filepath;
}

/**
 * Main function
 */
async function main() {
  try {
    const date = process.argv[2];
    
    if (!date) {
      console.error('❌ Please provide a date (YYYY-MM-DD)');
      console.log('Usage: node fetch-and-preserve-predictions.js 2025-08-14');
      process.exit(1);
    }
    
    console.log('🚀 Starting FETCH AND PRESERVE PREDICTIONS...');
    console.log(`📅 Date: ${date}`);
    console.log('📊 This will fetch match data and preserve existing predictions');
    
    // Fetch matches
    const matches = await fetchMatchesByDate(date);
    
    if (matches.length === 0) {
      console.log('⚠️  No matches found for this date');
      return;
    }
    
    // Save raw matches
    const savedPath = await saveMatches(matches, date);
    
    // Update analysis data while preserving predictions
    await updateAnalysisWithMatches(matches, date);
    
    console.log('✅ Fetch and preserve completed successfully!');
    console.log(`📁 Raw data saved to: ${savedPath}`);
    console.log(`📊 Total matches: ${matches.length}`);
    console.log('🔄 Existing predictions preserved in analysis data');
    
    // Show next steps
    console.log('\n🔄 Next steps:');
    console.log(`   • View in browser: open public/analysis.html`);
    console.log(`   • Raw data file: ${savedPath}`);
    console.log(`   • Run Bayesian predictions: node scripts/integrate-bayesian-predictions.js`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fetchMatchesByDate, saveMatches, updateAnalysisWithMatches };
