#!/usr/bin/env node

require('dotenv').config();
const https = require('https');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

// ChatGPT API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

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
 * Ask ChatGPT for match prediction
 */
async function askChatGPTForPrediction(match) {
  const prompt = `You are an expert football analyst.

Here is the data for the upcoming match:

Match: ${match.homeTeam} vs ${match.awayTeam}  
Date: ${match.date}  
League: ${match.league}  
Location: ${match.venue}  

Team A - ${match.homeTeam}  
- Last 5 matches or Current injuries or key players

Team B - ${match.awayTeam}  
- Last 5 matches or Current injuries or key players

Please analyze both teams and predict:  
1. Likely score  
2. Half-time result  
3. Over/under 2.5 goals  
4. Number of corners (range)  
5. Who is more likely to win and why?  

Respond with JSON format:
{
  "likelyScore": "2-1",
  "halftimeResult": "1-0",
  "overUnder": "Over 2.5",
  "corners": "8-10",
  "winner": "Team A",
  "reason": "Simple reason why this team will win",
  "homeWinProbability": 60,
  "drawProbability": 25,
  "awayWinProbability": 15
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a football analyst. Provide simple, clear predictions. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Error parsing AI response:', error.message);
      return null;
    }
  } catch (error) {
    console.error('Error making AI request:', error.message);
    return null;
  }
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
    
    return {
      id: fixture.id,
      date: fixture.date,
      venue: fixture.venue ? fixture.venue.name : 'Unknown',
      city: fixture.venue ? fixture.venue.city : 'Unknown',
      country: fixture.venue ? fixture.venue.country : 'Unknown',
      homeTeam: teams.home.name,
      awayTeam: teams.away.name,
      homeTeamLogo: teams.home.logo,
      awayTeamLogo: teams.away.logo,
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
 * Create simple analysis structure with no predictions
 */
function createSimpleAnalysis(match) {
  return {
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
  };
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
    description: 'Raw match data from API-Sports (no analysis)'
  };
  
  await fsPromises.writeFile(filepath, JSON.stringify(matchData, null, 2));
  console.log(`💾 Saved matches to: ${filename}`);
  
  return filepath;
}

/**
 * Save analysis data for web display
 */
async function saveAnalysisData(matches, date) {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    await fsPromises.mkdir(dataDir, { recursive: true });
  }
  
  // Create simple analysis structure
  const analyses = matches.map(match => createSimpleAnalysis(match));
  
  const analysisData = {
    date: date,
    totalMatches: matches.length,
    analyses: analyses,
    analysisType: 'RAW_DATA_ONLY',
    description: 'Raw match data without predictions or analysis'
  };
  
  // Save to public interface
  const publicAnalysisPath = path.join(__dirname, '..', 'data', 'analysis.json');
  await fsPromises.writeFile(publicAnalysisPath, JSON.stringify(analysisData, null, 2));
  console.log('🌐 Saved analysis data to public interface: analysis.json');
  
  return publicAnalysisPath;
}

/**
 * Display matches summary
 */
function displayMatchesSummary(matches) {
  console.log('\n📋 MATCHES SUMMARY:');
  console.log('='.repeat(50));
  
  matches.forEach((match, index) => {
    console.log(`${index + 1}. ${match.homeTeam} vs ${match.awayTeam}`);
    console.log(`   League: ${match.league} (${match.country})`);
    console.log(`   Venue: ${match.venue}, ${match.city}`);
    console.log(`   Time: ${new Date(match.date).toLocaleString()}`);
    console.log(`   Status: ${match.status}`);
    if (match.homeGoals !== null && match.awayGoals !== null) {
      console.log(`   Score: ${match.homeGoals}-${match.awayGoals}`);
    }
    console.log('');
  });
}

/**
 * Main function - Fetch only
 */
async function main() {
  try {
    const date = process.argv[2];
    
    if (!date) {
      console.error('❌ Please provide a date (YYYY-MM-DD)');
      console.log('Usage: node fetch-only.js 2025-08-09');
      process.exit(1);
    }
    
    console.log('🚀 Starting FETCH ONLY...');
    console.log(`📅 Date: ${date}`);
    console.log('📊 This will fetch match data without any analysis or predictions');
    
    // Fetch matches
    const matches = await fetchMatchesByDate(date);
    
    if (matches.length === 0) {
      console.log('⚠️  No matches found for this date');
      return;
    }
    
    // Save raw matches
    const savedPath = await saveMatches(matches, date);
    
    // Save analysis data for web display
    await saveAnalysisData(matches, date);
    
    // Display summary
    displayMatchesSummary(matches);
    
    console.log('✅ Fetch completed successfully!');
    console.log(`📁 Raw data saved to: ${savedPath}`);
    console.log(`📊 Total matches: ${matches.length}`);
    console.log('⚠️  All predictions set to 0% or undefined');
    console.log('🤖 ChatGPT prediction buttons added to each match card');
    
    // Show next steps
    console.log('\n🔄 Next steps:');
    console.log(`   • View in browser: open public/analysis.html`);
    console.log(`   • Raw data file: ${savedPath}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fetchMatchesByDate, saveMatches, createSimpleAnalysis, askChatGPTForPrediction };
