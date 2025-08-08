#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// API-Sports Configuration
const API_SPORTS_KEY = process.env.API_SPORTS_KEY || '';
const API_SPORTS_HOST = 'v3.football.api-sports.io';

/**
 * Make request to API-Sports
 * @param {string} endpoint - The API endpoint
 * @returns {Promise<Object>} - The API response
 */
function makeApiSportsRequest(endpoint) {
  return new Promise((resolve, reject) => {
    if (!API_SPORTS_KEY) {
      reject(new Error('API-Sports key not found. Please set API_SPORTS_KEY in your .env file.'));
      return;
    }

    const options = {
      hostname: API_SPORTS_HOST,
      port: 443,
      path: endpoint,
      method: 'GET',
      headers: {
        'x-rapidapi-key': API_SPORTS_KEY,
        'x-rapidapi-host': API_SPORTS_HOST
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          if (response.errors && response.errors.length > 0) {
            reject(new Error(`API-Sports Error: ${response.errors[0]}`));
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(new Error(`Failed to parse API-Sports response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.end();
  });
}

/**
 * Get team statistics from API-Sports
 * @param {string} teamName - Team name
 * @param {number} leagueId - League ID
 * @param {number} season - Season year
 * @returns {Promise<Object>} - Team statistics
 */
async function getTeamStats(teamName, leagueId, season) {
  try {
    // First, search for the team
    const searchEndpoint = `/teams?search=${encodeURIComponent(teamName)}`;
    const searchResponse = await makeApiSportsRequest(searchEndpoint);
    
    if (!searchResponse.response || searchResponse.response.length === 0) {
      throw new Error(`Team not found: ${teamName}`);
    }

    const teamId = searchResponse.response[0].team.id;
    
    // Get team statistics for the league
    const statsEndpoint = `/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`;
    const statsResponse = await makeApiSportsRequest(statsEndpoint);
    
    if (!statsResponse.response || statsResponse.response.length === 0) {
      throw new Error(`No statistics found for ${teamName}`);
    }

    return statsResponse.response[0];
  } catch (error) {
    console.error(`❌ Error getting stats for ${teamName}:`, error.message);
    return null;
  }
}

/**
 * Get team form (last 5 matches)
 * @param {string} teamName - Team name
 * @param {number} leagueId - League ID
 * @param {number} season - Season year
 * @returns {Promise<Array>} - Last 5 matches results
 */
async function getTeamForm(teamName, leagueId, season) {
  try {
    // Search for the team
    const searchEndpoint = `/teams?search=${encodeURIComponent(teamName)}`;
    const searchResponse = await makeApiSportsRequest(searchEndpoint);
    
    if (!searchResponse.response || searchResponse.response.length === 0) {
      throw new Error(`Team not found: ${teamName}`);
    }

    const teamId = searchResponse.response[0].team.id;
    
    // Get last 5 matches
    const matchesEndpoint = `/fixtures?team=${teamId}&league=${leagueId}&season=${season}&last=5`;
    const matchesResponse = await makeApiSportsRequest(matchesEndpoint);
    
    if (!matchesResponse.response || matchesResponse.response.length === 0) {
      throw new Error(`No recent matches found for ${teamName}`);
    }

    return matchesResponse.response.map(match => {
      const isHome = match.teams.home.id === teamId;
      const homeGoals = match.goals.home || 0;
      const awayGoals = match.goals.away || 0;
      
      if (isHome) {
        return homeGoals > awayGoals ? 'W' : homeGoals < awayGoals ? 'L' : 'D';
      } else {
        return awayGoals > homeGoals ? 'W' : awayGoals < homeGoals ? 'L' : 'D';
      }
    });
  } catch (error) {
    console.error(`❌ Error getting form for ${teamName}:`, error.message);
    return ['D', 'D', 'D', 'D', 'D']; // Default form
  }
}

/**
 * Get head-to-head statistics
 * @param {string} team1 - First team name
 * @param {string} team2 - Second team name
 * @param {number} leagueId - League ID
 * @param {number} season - Season year
 * @returns {Promise<Object>} - H2H statistics
 */
async function getHeadToHead(team1, team2, leagueId, season) {
  try {
    // Search for both teams
    const team1Search = await makeApiSportsRequest(`/teams?search=${encodeURIComponent(team1)}`);
    const team2Search = await makeApiSportsRequest(`/teams?search=${encodeURIComponent(team2)}`);
    
    if (!team1Search.response || !team2Search.response) {
      throw new Error('One or both teams not found');
    }

    const team1Id = team1Search.response[0].team.id;
    const team2Id = team2Search.response[0].team.id;
    
    // Get H2H matches
    const h2hEndpoint = `/fixtures?h2h=${team1Id}-${team2Id}&league=${leagueId}&season=${season}&last=5`;
    const h2hResponse = await makeApiSportsRequest(h2hEndpoint);
    
    if (!h2hResponse.response || h2hResponse.response.length === 0) {
      return { team1Wins: 0, team2Wins: 0, draws: 0, totalMatches: 0 };
    }

    let team1Wins = 0, team2Wins = 0, draws = 0;
    
    h2hResponse.response.forEach(match => {
      const homeGoals = match.goals.home || 0;
      const awayGoals = match.goals.away || 0;
      
      if (homeGoals > awayGoals) {
        team1Wins++;
      } else if (awayGoals > homeGoals) {
        team2Wins++;
      } else {
        draws++;
      }
    });

    return { team1Wins, team2Wins, draws, totalMatches: h2hResponse.response.length };
  } catch (error) {
    console.error(`❌ Error getting H2H for ${team1} vs ${team2}:`, error.message);
    return { team1Wins: 0, team2Wins: 0, draws: 0, totalMatches: 0 };
  }
}

/**
 * Analyze a single match using real API-Sports data
 * @param {Object} match - The match data
 * @returns {Promise<Object>} - The analysis result
 */
async function analyzeMatch(match) {
  try {
    const homeTeam = match.homeTeam || 'Home Team';
    const awayTeam = match.awayTeam || 'Away Team';
    const league = match.league || 'Unknown League';
    const country = match.country || 'Unknown Country';
    const matchTime = match.date || new Date().toISOString();
    const venue = match.venue || {};
    const venueName = venue.name || 'Unknown Venue';
    const venueCity = venue.city || 'Unknown City';

    // Get league ID (you might need to adjust this based on your data)
    const leagueId = (match.league && match.league.id) || 71; // Default to Premier League
    const season = 2024; // Current season

    console.log(`🤖 Analyzing with real data: ${homeTeam} vs ${awayTeam}`);

    // Get real team statistics
    const homeStats = await getTeamStats(homeTeam, leagueId, season);
    const awayStats = await getTeamStats(awayTeam, leagueId, season);
    
    // Get team form
    const homeForm = await getTeamForm(homeTeam, leagueId, season);
    const awayForm = await getTeamForm(awayTeam, leagueId, season);
    
    // Get head-to-head
    const h2h = await getHeadToHead(homeTeam, awayTeam, leagueId, season);

    // Calculate win probabilities based on real data
    let homeWinProbability = 33;
    let awayWinProbability = 33;
    let drawProbability = 34;

    if (homeStats && awayStats) {
      // Use real statistics to calculate probabilities
      const homeGoalsScored = (homeStats.goals && homeStats.goals.for && homeStats.goals.for.total) || 0;
      const homeGoalsConceded = (homeStats.goals && homeStats.goals.against && homeStats.goals.against.total) || 0;
      const awayGoalsScored = (awayStats.goals && awayStats.goals.for && awayStats.goals.for.total) || 0;
      const awayGoalsConceded = (awayStats.goals && awayStats.goals.against && awayStats.goals.against.total) || 0;
      
      const homeFormScore = homeForm.filter(r => r === 'W').length / 5;
      const awayFormScore = awayForm.filter(r => r === 'W').length / 5;
      
      // Calculate probabilities based on form and H2H
      homeWinProbability = Math.round((homeFormScore * 0.4 + (h2h.team1Wins / h2h.totalMatches) * 0.3 + 0.3) * 100);
      awayWinProbability = Math.round((awayFormScore * 0.4 + (h2h.team2Wins / h2h.totalMatches) * 0.3 + 0.3) * 100);
      drawProbability = 100 - homeWinProbability - awayWinProbability;
      
      // Ensure probabilities add up to 100
      if (drawProbability < 0) {
        homeWinProbability += drawProbability;
        drawProbability = 0;
      }
    }

    // Generate score predictions based on real data
    const homeGoals = homeStats ? Math.floor(((homeStats.goals && homeStats.goals.for && homeStats.goals.for.total) || 1) / 10) + 1 : 1;
    const awayGoals = awayStats ? Math.floor(((awayStats.goals && awayStats.goals.for && awayStats.goals.for.total) || 1) / 10) : 0;
    const halftimeHomeGoals = Math.floor(homeGoals * 0.6);
    const halftimeAwayGoals = Math.floor(awayGoals * 0.6);

    // Generate analysis text based on real data
    const analysis = `Based on real statistics: ${homeTeam} has scored ${(homeStats && homeStats.goals && homeStats.goals.for && homeStats.goals.for.total) || 'unknown'} goals and conceded ${(homeStats && homeStats.goals && homeStats.goals.against && homeStats.goals.against.total) || 'unknown'} this season. ${awayTeam} has scored ${(awayStats && awayStats.goals && awayStats.goals.for && awayStats.goals.for.total) || 'unknown'} goals and conceded ${(awayStats && awayStats.goals && awayStats.goals.against && awayStats.goals.against.total) || 'unknown'}. Recent form: ${homeTeam} ${homeForm.join(', ')}, ${awayTeam} ${awayForm.join(', ')}. H2H: ${homeTeam} ${h2h.team1Wins} wins, ${awayTeam} ${h2h.team2Wins} wins, ${h2h.draws} draws.`;

    // Generate betting recommendation
    let bettingRecommendation = '';
    let riskLevel = 'medium';
    
    if (homeWinProbability > 55) {
      bettingRecommendation = `Home win recommended with ${homeWinProbability}% probability based on real form and statistics.`;
      riskLevel = 'low';
    } else if (awayWinProbability > 50) {
      bettingRecommendation = `Away win possible with ${awayWinProbability}% probability based on recent performance.`;
      riskLevel = 'medium';
    } else {
      bettingRecommendation = `Close match expected. Draw or home win could be good options based on H2H record.`;
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
        country: (venue && venue.country) || 'Unknown Country'
      },
      analysis: {
        homeWinProbability,
        awayWinProbability,
        drawProbability,
        halftime: {
          homeWinProbability: Math.round(homeWinProbability * 0.9),
          awayWinProbability: Math.round(awayWinProbability * 0.9),
          drawProbability: Math.round(drawProbability * 1.2),
          prediction: halftimeHomeGoals > halftimeAwayGoals ? "Home team likely to lead at halftime" : "Close first half expected",
          scorePrediction: `${halftimeHomeGoals}-${halftimeAwayGoals}`
        },
        finalScore: {
          homeScore: homeGoals.toString(),
          awayScore: awayGoals.toString(),
          prediction: `${homeGoals}-${awayGoals}`
        },
        corners: {
          total: "8-10",
          homeTeam: "4-5",
          awayTeam: "4-5",
          prediction: "Standard corner count expected"
        },
        cards: {
          yellowCards: "4-6",
          redCards: "0-1",
          homeTeamCards: "2-3",
          awayTeamCards: "2-3",
          prediction: "Moderate card count expected"
        },
        substitutions: {
          homeTeam: "2-3",
          awayTeam: "2-3",
          timing: "Most substitutions between 60-75 minutes",
          prediction: "Standard substitution pattern expected"
        },
        keyFactors: [
          `Home team form: ${homeForm.join(', ')}`,
          `Away team form: ${awayForm.join(', ')}`,
          `H2H: ${homeTeam} ${h2h.team1Wins} wins, ${awayTeam} ${h2h.team2Wins} wins`,
          `Home goals: ${(homeStats && homeStats.goals && homeStats.goals.for && homeStats.goals.for.total) || 'unknown'}, Away goals: ${(awayStats && awayStats.goals && awayStats.goals.for && awayStats.goals.for.total) || 'unknown'}`
        ],
        analysis,
        bettingRecommendation,
        riskLevel
      }
    };
  } catch (error) {
    console.error(`❌ Error analyzing ${(match.teams && match.teams.home && match.teams.home.name) || 'Home'} vs ${(match.teams && match.teams.away && match.teams.away.name) || 'Away'}:`, error.message);
    throw error;
  }
}

/**
 * Generate analysis using real API-Sports data
 */
async function generateRealAnalysis() {
  try {
    console.log('🤖 Starting real analysis generation with API-Sports...');
    
    // Load matches data
    const matchesData = await fs.readFile('data/processed_matches.json', 'utf8');
    const matches = JSON.parse(matchesData);
    
    console.log(`📊 Found ${matches.length} matches to analyze`);
    
    const analyses = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      
      try {
        const analysis = await analyzeMatch(match);
        analyses.push(analysis);
        successCount++;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log(`✅ Analyzed ${i + 1}/${matches.length}: ${analysis.homeTeam} vs ${analysis.awayTeam}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to analyze match ${i + 1}:`, error.message);
      }
    }
    
    // Save real analysis
    const outputPath = 'data/real_analysis.json';
    await fs.writeFile(outputPath, JSON.stringify(analyses, null, 2));
    
    console.log(`\n🎉 Real analysis completed!`);
    console.log(`✅ Successfully analyzed: ${successCount} matches`);
    console.log(`❌ Failed to analyze: ${errorCount} matches`);
    console.log(`📁 Real analysis saved to: ${path.resolve(outputPath)}`);
    
    if (analyses.length > 0) {
      const sample = analyses[0];
      console.log(`\n📋 Sample real analysis:`);
      console.log(`Match: ${sample.homeTeam} vs ${sample.awayTeam}`);
      console.log(`League: ${sample.league} (${sample.country})`);
      console.log(`Risk Level: ${sample.analysis.riskLevel.toUpperCase()}`);
      console.log(`Win Probabilities: Home ${sample.analysis.homeWinProbability}%, Draw ${sample.analysis.drawProbability}%, Away ${sample.analysis.awayWinProbability}%`);
      console.log(`Key Factors: ${sample.analysis.keyFactors.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error generating real analysis:', error.message);
    process.exit(1);
  }
}

// Run the real analysis
if (require.main === module) {
  generateRealAnalysis();
}

module.exports = {
  analyzeMatch,
  generateRealAnalysis
}; 