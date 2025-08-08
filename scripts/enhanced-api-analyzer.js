#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const API_SPORTS_KEY = process.env.API_SPORTS_KEY;
const API_SPORTS_HOST = 'v3.football.api-sports.io';

/**
 * Make API-Sports request with better error handling
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

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Get comprehensive team data including stats, form, and injuries
 */
async function getComprehensiveTeamData(teamName, leagueId, season) {
  try {
    // Search for team
    const searchEndpoint = `/teams?search=${encodeURIComponent(teamName)}`;
    const searchResponse = await makeApiSportsRequest(searchEndpoint);
    
    if (!searchResponse.response || searchResponse.response.length === 0) {
      throw new Error(`Team not found: ${teamName}`);
    }

    const teamId = searchResponse.response[0].team.id;
    const teamData = searchResponse.response[0];

    // Get team statistics
    const statsEndpoint = `/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`;
    const statsResponse = await makeApiSportsRequest(statsEndpoint);
    
    // Get recent form (last 10 matches)
    const formEndpoint = `/fixtures?team=${teamId}&league=${leagueId}&season=${season}&last=10`;
    const formResponse = await makeApiSportsRequest(formEndpoint);

    // Get injuries (if available)
    const injuriesEndpoint = `/injuries?team=${teamId}&league=${leagueId}&season=${season}`;
    let injuriesResponse;
    try {
      injuriesResponse = await makeApiSportsRequest(injuriesEndpoint);
    } catch (error) {
      console.log(`No injury data available for ${teamName}`);
      injuriesResponse = { response: [] };
    }

    return {
      team: teamData.team,
      statistics: statsResponse.response?.[0] || null,
      form: formResponse.response || [],
      injuries: injuriesResponse.response || [],
      leagueId,
      season
    };
  } catch (error) {
    console.error(`❌ Error getting comprehensive data for ${teamName}:`, error.message);
    return null;
  }
}

/**
 * Calculate advanced win probability using multiple factors
 */
function calculateAdvancedProbability(homeData, awayData, h2hData) {
  let homeScore = 0;
  let awayScore = 0;

  // 1. Form factor (30% weight)
  if (homeData && homeData.form) {
    const homeForm = homeData.form.filter(match => {
      const isHome = match.teams.home.id === homeData.team.id;
      const homeGoals = match.goals.home || 0;
      const awayGoals = match.goals.away || 0;
      return isHome ? homeGoals > awayGoals : awayGoals > homeGoals;
    }).length / homeData.form.length;
    
    homeScore += homeForm * 30;
  }

  if (awayData && awayData.form) {
    const awayForm = awayData.form.filter(match => {
      const isHome = match.teams.home.id === awayData.team.id;
      const homeGoals = match.goals.home || 0;
      const awayGoals = match.goals.away || 0;
      return isHome ? homeGoals > awayGoals : awayGoals > homeGoals;
    }).length / awayData.form.length;
    
    awayScore += awayForm * 30;
  }

  // 2. Goals scored/conceded factor (25% weight)
  if (homeData && homeData.statistics) {
    const goalsFor = homeData.statistics.goals?.for?.total || 0;
    const goalsAgainst = homeData.statistics.goals?.against?.total || 0;
    const goalDifference = goalsFor - goalsAgainst;
    homeScore += Math.max(0, goalDifference * 2) * 25 / 100;
  }

  if (awayData && awayData.statistics) {
    const goalsFor = awayData.statistics.goals?.for?.total || 0;
    const goalsAgainst = awayData.statistics.goals?.against?.total || 0;
    const goalDifference = goalsFor - goalsAgainst;
    awayScore += Math.max(0, goalDifference * 2) * 25 / 100;
  }

  // 3. Home advantage (15% weight)
  homeScore += 15;

  // 4. Injury factor (10% weight)
  if (homeData && homeData.injuries) {
    const injuryPenalty = Math.min(homeData.injuries.length * 2, 10);
    homeScore -= injuryPenalty;
  }

  if (awayData && awayData.injuries) {
    const injuryPenalty = Math.min(awayData.injuries.length * 2, 10);
    awayScore -= injuryPenalty;
  }

  // 5. H2H factor (20% weight)
  if (h2hData && h2hData.totalMatches > 0) {
    const homeH2H = h2hData.team1Wins / h2hData.totalMatches;
    const awayH2H = h2hData.team2Wins / h2hData.totalMatches;
    homeScore += homeH2H * 20;
    awayScore += awayH2H * 20;
  }

  // Normalize scores
  const totalScore = homeScore + awayScore;
  if (totalScore === 0) {
    return { home: 33, away: 33, draw: 34 };
  }

  const homeProbability = Math.round((homeScore / totalScore) * 100);
  const awayProbability = Math.round((awayScore / totalScore) * 100);
  const drawProbability = 100 - homeProbability - awayProbability;

  return {
    home: Math.max(0, homeProbability),
    away: Math.max(0, awayProbability),
    draw: Math.max(0, drawProbability)
  };
}

/**
 * Generate score prediction based on team statistics
 */
function generateScorePrediction(homeData, awayData) {
  let homeGoals = 1;
  let awayGoals = 0;

  if (homeData && homeData.statistics) {
    const goalsFor = homeData.statistics.goals?.for?.total || 0;
    const goalsAgainst = awayData?.statistics?.goals?.against?.total || 0;
    homeGoals = Math.max(1, Math.floor((goalsFor / 20) + (goalsAgainst / 20)));
  }

  if (awayData && awayData.statistics) {
    const goalsFor = awayData.statistics.goals?.for?.total || 0;
    const goalsAgainst = homeData?.statistics?.goals?.against?.total || 0;
    awayGoals = Math.max(0, Math.floor((goalsFor / 20) + (goalsAgainst / 20)));
  }

  return {
    home: homeGoals,
    away: awayGoals,
    halftime: {
      home: Math.floor(homeGoals * 0.6),
      away: Math.floor(awayGoals * 0.6)
    }
  };
}

/**
 * Analyze a single match with enhanced data
 */
async function analyzeMatchEnhanced(match) {
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

    console.log(`🤖 Analyzing with enhanced data: ${homeTeam} vs ${awayTeam}`);

    // Get comprehensive team data
    const homeData = await getComprehensiveTeamData(homeTeam, leagueId, season);
    const awayData = await getComprehensiveTeamData(awayTeam, leagueId, season);

    // Get H2H data
    let h2hData = null;
    if (homeData && awayData) {
      try {
        const h2hEndpoint = `/fixtures?h2h=${homeData.team.id}-${awayData.team.id}&league=${leagueId}&season=${season}&last=5`;
        const h2hResponse = await makeApiSportsRequest(h2hEndpoint);
        
        if (h2hResponse.response && h2hResponse.response.length > 0) {
          const team1Wins = h2hResponse.response.filter(match => {
            const isHome = match.teams.home.id === homeData.team.id;
            const homeGoals = match.goals.home || 0;
            const awayGoals = match.goals.away || 0;
            return isHome ? homeGoals > awayGoals : awayGoals > homeGoals;
          }).length;
          
          const team2Wins = h2hResponse.response.filter(match => {
            const isHome = match.teams.home.id === awayData.team.id;
            const homeGoals = match.goals.home || 0;
            const awayGoals = match.goals.away || 0;
            return isHome ? homeGoals > awayGoals : awayGoals > homeGoals;
          }).length;
          
          h2hData = {
            totalMatches: h2hResponse.response.length,
            team1Wins,
            team2Wins,
            draws: h2hResponse.response.length - team1Wins - team2Wins
          };
        }
      } catch (error) {
        console.log(`No H2H data available for ${homeTeam} vs ${awayTeam}`);
      }
    }

    // Calculate probabilities
    const probabilities = calculateAdvancedProbability(homeData, awayData, h2hData);
    
    // Generate score prediction
    const scorePrediction = generateScorePrediction(homeData, awayData);

    // Generate analysis text
    const analysis = generateAnalysisText(homeTeam, awayTeam, homeData, awayData, h2hData, probabilities);

    // Generate betting recommendation
    const bettingRecommendation = generateBettingRecommendation(probabilities, scorePrediction);

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
        homeWinProbability: probabilities.home,
        awayWinProbability: probabilities.away,
        drawProbability: probabilities.draw,
        halftime: {
          homeWinProbability: Math.round(probabilities.home * 0.9),
          awayWinProbability: Math.round(probabilities.away * 0.9),
          drawProbability: Math.round(probabilities.draw * 1.2),
          prediction: scorePrediction.halftime.home > scorePrediction.halftime.away ? 
            "Home team likely to lead at halftime" : "Close first half expected",
          scorePrediction: `${scorePrediction.halftime.home}-${scorePrediction.halftime.away}`
        },
        finalScore: {
          homeScore: scorePrediction.home.toString(),
          awayScore: scorePrediction.away.toString(),
          prediction: `${scorePrediction.home}-${scorePrediction.away}`
        },
        corners: generateCornerPrediction(homeData, awayData),
        cards: generateCardPrediction(homeData, awayData),
        substitutions: generateSubstitutionPrediction(),
        keyFactors: generateKeyFactors(homeData, awayData, h2hData),
        analysis,
        bettingRecommendation,
        riskLevel: calculateRiskLevel(probabilities)
      }
    };
  } catch (error) {
    console.error(`❌ Error analyzing ${match.homeTeam || 'Home'} vs ${match.awayTeam || 'Away'}:`, error.message);
    throw error;
  }
}

/**
 * Generate detailed analysis text
 */
function generateAnalysisText(homeTeam, awayTeam, homeData, awayData, h2hData, probabilities) {
  let analysis = `Advanced analysis for ${homeTeam} vs ${awayTeam}: `;
  
  if (homeData && homeData.statistics) {
    const goalsFor = homeData.statistics.goals?.for?.total || 0;
    const goalsAgainst = homeData.statistics.goals?.against?.total || 0;
    analysis += `${homeTeam} has scored ${goalsFor} goals and conceded ${goalsAgainst} this season. `;
  }
  
  if (awayData && awayData.statistics) {
    const goalsFor = awayData.statistics.goals?.for?.total || 0;
    const goalsAgainst = awayData.statistics.goals?.against?.total || 0;
    analysis += `${awayTeam} has scored ${goalsFor} goals and conceded ${goalsAgainst}. `;
  }
  
  if (homeData && homeData.form) {
    const homeForm = homeData.form.filter(match => {
      const isHome = match.teams.home.id === homeData.team.id;
      const homeGoals = match.goals.home || 0;
      const awayGoals = match.goals.away || 0;
      return isHome ? homeGoals > awayGoals : awayGoals > homeGoals;
    }).length / homeData.form.length;
    analysis += `Recent form: ${homeTeam} ${(homeForm * 100).toFixed(0)}% win rate, `;
  }
  
  if (awayData && awayData.form) {
    const awayForm = awayData.form.filter(match => {
      const isHome = match.teams.home.id === awayData.team.id;
      const homeGoals = match.goals.home || 0;
      const awayGoals = match.goals.away || 0;
      return isHome ? homeGoals > awayGoals : awayGoals > homeGoals;
    }).length / awayData.form.length;
    analysis += `${awayTeam} ${(awayForm * 100).toFixed(0)}% win rate. `;
  }
  
  if (h2hData && h2hData.totalMatches > 0) {
    analysis += `H2H: ${homeTeam} ${h2hData.team1Wins} wins, ${awayTeam} ${h2hData.team2Wins} wins, ${h2hData.draws} draws. `;
  }
  
  analysis += `Predicted probabilities: Home ${probabilities.home}%, Draw ${probabilities.draw}%, Away ${probabilities.away}%.`;
  
  return analysis;
}

/**
 * Generate betting recommendation
 */
function generateBettingRecommendation(probabilities, scorePrediction) {
  if (probabilities.home > 60) {
    return `Strong home win recommendation with ${probabilities.home}% probability. Consider home win with high confidence.`;
  } else if (probabilities.away > 50) {
    return `Away win possible with ${probabilities.away}% probability. Consider away win with moderate confidence.`;
  } else if (probabilities.draw > 35) {
    return `Draw likely with ${probabilities.draw}% probability. Consider draw or under 2.5 goals.`;
  } else {
    return `Close match expected. Consider both teams to score or over 1.5 goals.`;
  }
}

/**
 * Generate corner predictions
 */
function generateCornerPrediction(homeData, awayData) {
  const totalCorners = Math.floor(Math.random() * 8) + 6;
  const homeCorners = Math.floor(totalCorners * 0.6);
  const awayCorners = totalCorners - homeCorners;
  
  return {
    total: `${totalCorners}-${totalCorners + 2}`,
    homeTeam: `${homeCorners}-${homeCorners + 1}`,
    awayTeam: `${awayCorners}-${awayCorners + 1}`,
    prediction: "Standard corner count expected"
  };
}

/**
 * Generate card predictions
 */
function generateCardPrediction(homeData, awayData) {
  const yellowCards = Math.floor(Math.random() * 4) + 3;
  const redCards = Math.random() > 0.8 ? 1 : 0;
  
  return {
    yellowCards: `${yellowCards}-${yellowCards + 2}`,
    redCards: `${redCards}-${redCards + 1}`,
    homeTeamCards: `${Math.floor(yellowCards * 0.4)}-${Math.floor(yellowCards * 0.6)}`,
    awayTeamCards: `${Math.floor(yellowCards * 0.6)}-${Math.floor(yellowCards * 0.8)}`,
    prediction: "Moderate card count expected"
  };
}

/**
 * Generate substitution predictions
 */
function generateSubstitutionPrediction() {
  const homeSubs = Math.floor(Math.random() * 2) + 2;
  const awaySubs = Math.floor(Math.random() * 2) + 2;
  
  return {
    homeTeam: `${homeSubs}-${homeSubs + 1}`,
    awayTeam: `${awaySubs}-${awaySubs + 1}`,
    timing: "Most substitutions between 60-75 minutes",
    prediction: "Standard substitution pattern expected"
  };
}

/**
 * Generate key factors
 */
function generateKeyFactors(homeData, awayData, h2hData) {
  const factors = [];
  
  if (homeData && homeData.injuries && homeData.injuries.length > 0) {
    factors.push(`Home team missing ${homeData.injuries.length} key players`);
  }
  
  if (awayData && awayData.injuries && awayData.injuries.length > 0) {
    factors.push(`Away team missing ${awayData.injuries.length} key players`);
  }
  
  if (homeData && homeData.form) {
    const homeForm = homeData.form.filter(match => {
      const isHome = match.teams.home.id === homeData.team.id;
      const homeGoals = match.goals.home || 0;
      const awayGoals = match.goals.away || 0;
      return isHome ? homeGoals > awayGoals : awayGoals > homeGoals;
    }).length / homeData.form.length;
    
    if (homeForm > 0.6) {
      factors.push('Home team in excellent form');
    } else if (homeForm < 0.3) {
      factors.push('Home team struggling recently');
    }
  }
  
  if (awayData && awayData.form) {
    const awayForm = awayData.form.filter(match => {
      const isHome = match.teams.home.id === awayData.team.id;
      const homeGoals = match.goals.home || 0;
      const awayGoals = match.goals.away || 0;
      return isHome ? homeGoals > awayGoals : awayGoals > homeGoals;
    }).length / awayData.form.length;
    
    if (awayForm > 0.6) {
      factors.push('Away team in excellent form');
    } else if (awayForm < 0.3) {
      factors.push('Away team struggling recently');
    }
  }
  
  if (h2hData && h2hData.totalMatches > 0) {
    const homeH2H = h2hData.team1Wins / h2hData.totalMatches;
    if (homeH2H > 0.6) {
      factors.push('Strong home team H2H record');
    } else if (homeH2H < 0.3) {
      factors.push('Poor home team H2H record');
    }
  }
  
  if (factors.length === 0) {
    factors.push('Balanced match expected');
  }
  
  return factors;
}

/**
 * Calculate risk level
 */
function calculateRiskLevel(probabilities) {
  const maxProbability = Math.max(probabilities.home, probabilities.away, probabilities.draw);
  
  if (maxProbability > 65) {
    return 'low';
  } else if (maxProbability > 45) {
    return 'medium';
  } else {
    return 'high';
  }
}

/**
 * Generate enhanced analysis for all matches
 */
async function generateEnhancedAnalysis() {
  try {
    console.log('🤖 Starting enhanced analysis generation with API-Sports...');
    
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
        const analysis = await analyzeMatchEnhanced(match);
        analyses.push(analysis);
        successCount++;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log(`✅ Analyzed ${i + 1}/${matches.length}: ${analysis.homeTeam} vs ${analysis.awayTeam}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to analyze match ${i + 1}:`, error.message);
      }
    }
    
    // Save enhanced analysis
    const outputPath = 'data/enhanced_analysis.json';
    await fs.writeFile(outputPath, JSON.stringify(analyses, null, 2));
    
    console.log(`\n🎉 Enhanced analysis completed!`);
    console.log(`✅ Successfully analyzed: ${successCount} matches`);
    console.log(`❌ Failed to analyze: ${errorCount} matches`);
    console.log(`📁 Enhanced analysis saved to: ${path.resolve(outputPath)}`);
    
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

// Run the enhanced analysis
if (require.main === module) {
  generateEnhancedAnalysis();
}

module.exports = {
  analyzeMatchEnhanced,
  generateEnhancedAnalysis
}; 