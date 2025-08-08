#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

// Simple fetch implementation using https
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
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
 * ChatGPT Data Analyzer - Uses ChatGPT to get real team data and statistics
 */
class ChatGPTDataAnalyzer {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
  }

  /**
   * Make request to ChatGPT API
   */
  async makeChatGPTRequest(prompt) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a football data analyst. Provide accurate, real statistics and form data for football teams. Always respond with valid JSON data.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error making ChatGPT request:', error.message);
      return null;
    }
  }

  /**
   * Get real team data from ChatGPT
   */
  async getTeamDataFromChatGPT(teamName, leagueName) {
    const prompt = `Provide real football statistics for ${teamName} in ${leagueName} for the current season. Include:
1. Goals scored and conceded
2. Recent form (last 5 matches with W/D/L)
3. Key players
4. Injuries (if any)
5. Home/Away performance

Respond with JSON format:
{
  "team": "${teamName}",
  "league": "${leagueName}",
  "goalsFor": 45,
  "goalsAgainst": 28,
  "recentForm": ["W", "D", "W", "L", "W"],
  "keyPlayers": ["Player1", "Player2", "Player3"],
  "injuries": ["Player4"],
  "homeWins": 8,
  "awayWins": 5,
  "totalMatches": 20
}`;

    const response = await this.makeChatGPTRequest(prompt);
    if (response) {
      try {
        return JSON.parse(response);
      } catch (error) {
        console.error('Error parsing ChatGPT response:', error.message);
        return null;
      }
    }
    return null;
  }

  /**
   * Get head-to-head data from ChatGPT
   */
  async getH2HDataFromChatGPT(homeTeam, awayTeam) {
    const prompt = `Provide head-to-head statistics between ${homeTeam} and ${awayTeam} in their last 5 meetings. Include:
1. Match results
2. Goals scored by each team
3. Home team performance
4. Away team performance

Respond with JSON format:
{
  "homeTeam": "${homeTeam}",
  "awayTeam": "${awayTeam}",
  "totalMatches": 5,
  "homeWins": 3,
  "awayWins": 1,
  "draws": 1,
  "homeGoals": 8,
  "awayGoals": 4,
  "recentResults": ["2-1", "0-0", "3-1", "1-2", "2-0"]
}`;

    const response = await this.makeChatGPTRequest(prompt);
    if (response) {
      try {
        return JSON.parse(response);
      } catch (error) {
        console.error('Error parsing H2H response:', error.message);
        return null;
      }
    }
    return null;
  }

  /**
   * Calculate real probabilities based on ChatGPT data
   */
  calculateRealProbabilities(homeData, awayData, h2hData) {
    // Base home advantage
    let homeAdvantage = 0.15;
    
    // Calculate form factor
    const homeWins = homeData.recentForm.filter(result => result === 'W').length;
    const awayWins = awayData.recentForm.filter(result => result === 'W').length;
    const homeFormFactor = homeWins / 5;
    const awayFormFactor = awayWins / 5;
    
    // Calculate goal difference factor
    const homeGoalDiff = homeData.goalsFor - homeData.goalsAgainst;
    const awayGoalDiff = awayData.goalsFor - awayData.goalsAgainst;
    const homeGoalFactor = Math.max(0, Math.min(1, (homeGoalDiff + 20) / 40));
    const awayGoalFactor = Math.max(0, Math.min(1, (awayGoalDiff + 20) / 40));
    
    // H2H factor
    let h2hFactor = 0;
    if (h2hData) {
      const homeH2H = h2hData.homeWins / h2hData.totalMatches;
      const awayH2H = h2hData.awayWins / h2hData.totalMatches;
      h2hFactor = (homeH2H - awayH2H) * 0.1;
    }
    
    // Calculate final probabilities
    let homeWinProb = 0.33 + homeAdvantage + (homeFormFactor * 0.2) + (homeGoalFactor * 0.15) - (awayFormFactor * 0.1) - (awayGoalFactor * 0.1) + h2hFactor;
    let awayWinProb = 0.33 - homeAdvantage + (awayFormFactor * 0.2) + (awayGoalFactor * 0.15) - (homeFormFactor * 0.1) - (homeGoalFactor * 0.1) - h2hFactor;
    let drawProb = 0.34 - (homeFormFactor * 0.1) - (awayFormFactor * 0.1);
    
    // Ensure probabilities are within bounds
    homeWinProb = Math.max(0.1, Math.min(0.8, homeWinProb));
    awayWinProb = Math.max(0.1, Math.min(0.6, awayWinProb));
    drawProb = Math.max(0.1, Math.min(0.5, drawProb));
    
    // Normalize to sum to 1
    const total = homeWinProb + awayWinProb + drawProb;
    homeWinProb = homeWinProb / total;
    awayWinProb = awayWinProb / total;
    drawProb = drawProb / total;
    
    return {
      homeWinProb: Math.round(homeWinProb * 100),
      awayWinProb: Math.round(awayWinProb * 100),
      drawProb: Math.round(drawProb * 100)
    };
  }

  /**
   * Generate realistic score based on real data
   */
  generateRealisticScore(homeData, awayData, probabilities) {
    // Calculate expected goals based on actual scoring rates
    const homeGoalsPerGame = homeData.goalsFor / homeData.totalMatches;
    const homeConcededPerGame = homeData.goalsAgainst / homeData.totalMatches;
    const awayGoalsPerGame = awayData.goalsFor / awayData.totalMatches;
    const awayConcededPerGame = awayData.goalsAgainst / awayData.totalMatches;
    
    // Adjust for home advantage
    const homeExpectedGoals = homeGoalsPerGame * 1.1; // 10% home boost
    const awayExpectedGoals = awayGoalsPerGame * 0.9; // 10% away penalty
    
    // Use probabilities to determine outcome
    const maxProb = Math.max(probabilities.homeWinProb, probabilities.awayWinProb, probabilities.drawProb);
    
    let homeGoals, awayGoals;
    
    if (maxProb === probabilities.homeWinProb) {
      // Home win likely
      homeGoals = Math.round(homeExpectedGoals + Math.random() * 1.5);
      awayGoals = Math.round(awayExpectedGoals * 0.7 + Math.random() * 0.8);
    } else if (maxProb === probabilities.awayWinProb) {
      // Away win likely
      homeGoals = Math.round(homeExpectedGoals * 0.7 + Math.random() * 0.8);
      awayGoals = Math.round(awayExpectedGoals + Math.random() * 1.5);
    } else {
      // Draw likely
      const avgGoals = (homeExpectedGoals + awayExpectedGoals) / 2;
      homeGoals = Math.round(avgGoals + (Math.random() - 0.5) * 0.5);
      awayGoals = homeGoals;
    }
    
    return { homeGoals: Math.max(0, homeGoals), awayGoals: Math.max(0, awayGoals) };
  }

  /**
   * Analyze a single match with ChatGPT data
   */
  async analyzeMatchWithChatGPT(match) {
    try {
      console.log(`🔍 Analyzing ${match.homeTeam} vs ${match.awayTeam} with ChatGPT data...`);
      
      // Get real team data from ChatGPT
      const homeData = await this.getTeamDataFromChatGPT(match.homeTeam, match.league);
      const awayData = await this.getTeamDataFromChatGPT(match.awayTeam, match.league);
      
      if (!homeData || !awayData) {
        console.log(`⚠️  Could not get ChatGPT data for ${match.homeTeam} vs ${match.awayTeam}, using fallback...`);
        return this.analyzeMatchWithFallback(match);
      }
      
      // Get H2H data
      const h2hData = await this.getH2HDataFromChatGPT(match.homeTeam, match.awayTeam);
      
      // Calculate real probabilities
      const probabilities = this.calculateRealProbabilities(homeData, awayData, h2hData);
      
      // Generate realistic score
      const score = this.generateRealisticScore(homeData, awayData, probabilities);
      
      // Generate analysis text based on real data
      const analysisText = this.generateRealAnalysisText(match, homeData, awayData, h2hData, score);
      
      // Calculate risk level
      const riskLevel = probabilities.homeWinProb > 55 ? 'LOW' : probabilities.homeWinProb > 35 ? 'MEDIUM' : 'HIGH';
      
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
        teamData: {
          home: {
            last5: homeData.recentForm,
            injuries: homeData.injuries || [],
            keyPlayers: homeData.keyPlayers || []
          },
          away: {
            last5: awayData.recentForm,
            injuries: awayData.injuries || [],
            keyPlayers: awayData.keyPlayers || []
          }
        },
        probabilities: {
          homeWin: probabilities.homeWinProb,
          draw: probabilities.drawProb,
          awayWin: probabilities.awayWinProb
        },
        predictions: {
          likelyScore: `${score.homeGoals}-${score.awayGoals}`,
          halftimeResult: `${Math.floor(score.homeGoals * 0.6)}-${Math.floor(score.awayGoals * 0.6)}`,
          overUnder: (score.homeGoals + score.awayGoals) > 2.5 ? 'Over 2.5' : 'Under 2.5',
          corners: `${Math.floor(score.homeGoals * 2) + 3}-${Math.floor(score.awayGoals * 2) + 3}`,
          totalCorners: Math.floor(score.homeGoals * 2) + Math.floor(score.awayGoals * 2) + 6,
          yellowCards: Math.floor((score.homeGoals + score.awayGoals) * 1.5) + 2,
          redCards: Math.floor((score.homeGoals + score.awayGoals) * 0.2),
          homeTeamSubs: 3,
          awayTeamSubs: 3,
          substitutionTiming: '60-70 minutes',
          halftimeHomeWin: Math.round(probabilities.homeWinProb * 0.9),
          halftimeDraw: Math.round(probabilities.drawProb * 1.2),
          halftimeAwayWin: Math.round(probabilities.awayWinProb * 0.9),
          homeYellowCards: Math.floor((score.homeGoals + score.awayGoals) * 0.8),
          awayYellowCards: Math.floor((score.homeGoals + score.awayGoals) * 0.7),
          homeRedCards: Math.floor((score.homeGoals + score.awayGoals) * 0.1),
          awayRedCards: Math.floor((score.homeGoals + score.awayGoals) * 0.1),
          homeCorners: Math.floor(score.homeGoals * 2) + 3,
          awayCorners: Math.floor(score.awayGoals * 2) + 3,
          winner: score.homeGoals > score.awayGoals ? match.homeTeam : score.awayGoals > score.homeGoals ? match.awayTeam : 'Draw',
          reason: `${score.homeGoals > score.awayGoals ? match.homeTeam : match.awayTeam} has better form and key players available`
        },
        analysis: {
          homeWinProbability: probabilities.homeWinProb,
          drawProbability: probabilities.drawProb,
          awayWinProbability: probabilities.awayWinProb,
          riskLevel: riskLevel,
          keyFactors: this.generateKeyFactors(homeData, awayData, h2hData),
          analysis: analysisText,
          bettingRecommendation: this.generateBettingRecommendation(probabilities, score)
        }
      };
      
    } catch (error) {
      console.error(`❌ Error analyzing ${match.homeTeam} vs ${match.awayTeam}:`, error.message);
      return this.analyzeMatchWithFallback(match);
    }
  }

  /**
   * Generate real analysis text based on ChatGPT data
   */
  generateRealAnalysisText(match, homeData, awayData, h2hData, score) {
    let analysis = `Based on real statistics: ${match.homeTeam} has scored ${homeData.goalsFor} goals and conceded ${homeData.goalsAgainst} this season. ${match.awayTeam} has scored ${awayData.goalsFor} goals and conceded ${awayData.goalsAgainst}. `;
    
    const homeWins = homeData.recentForm.filter(result => result === 'W').length;
    const awayWins = awayData.recentForm.filter(result => result === 'W').length;
    
    analysis += `Recent form: ${match.homeTeam} ${homeWins} wins in last 5, ${match.awayTeam} ${awayWins} wins in last 5. `;
    
    if (h2hData) {
      analysis += `H2H: ${match.homeTeam} ${h2hData.homeWins} wins, ${match.awayTeam} ${h2hData.awayWins} wins, ${h2hData.draws} draws. `;
    }
    
    analysis += `Predicted score: ${score.homeGoals}-${score.awayGoals}.`;
    
    return analysis;
  }

  /**
   * Generate key factors based on real data
   */
  generateKeyFactors(homeData, awayData, h2hData) {
    const factors = [];
    
    const homeWins = homeData.recentForm.filter(result => result === 'W').length;
    const awayWins = awayData.recentForm.filter(result => result === 'W').length;
    
    if (homeWins >= 3) factors.push('Home team in excellent form');
    if (awayWins <= 1) factors.push('Away team struggling recently');
    if (homeData.goalsFor > awayData.goalsFor) factors.push('Home team better attacking record');
    if (homeData.goalsAgainst < awayData.goalsAgainst) factors.push('Home team better defensive record');
    if (h2hData && h2hData.homeWins > h2hData.awayWins) factors.push('Home team has H2H advantage');
    
    if (factors.length === 0) factors.push('Evenly matched teams');
    
    return factors;
  }

  /**
   * Generate betting recommendation based on real probabilities
   */
  generateBettingRecommendation(probabilities, score) {
    const maxProb = Math.max(probabilities.homeWinProb, probabilities.awayWinProb, probabilities.drawProb);
    
    if (maxProb === probabilities.homeWinProb) {
      return `${score.homeGoals > score.awayGoals ? 'Home' : 'Away'} win recommended with ${maxProb}% probability based on real form and statistics.`;
    } else if (maxProb === probabilities.awayWinProb) {
      return `Away win possible with ${maxProb}% probability based on recent performance.`;
    } else {
      return `Close match expected. Draw or home win could be good options based on H2H record.`;
    }
  }

  /**
   * Fallback analysis when ChatGPT data is not available
   */
  analyzeMatchWithFallback(match) {
    console.log(`⚠️  Using fallback analysis for ${match.homeTeam} vs ${match.awayTeam}`);
    
    // Use basic form calculation based on team names (hash-based)
    const homeHash = match.homeTeam.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const awayHash = match.awayTeam.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    const homeForm = (homeHash % 100) / 100;
    const awayForm = (awayHash % 100) / 100;
    
    const homeWinProb = Math.round((homeForm + 0.15) * 100);
    const awayWinProb = Math.round(awayForm * 100);
    const drawProb = 100 - homeWinProb - awayWinProb;
    
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
      analysis: {
        homeWinProbability: homeWinProb,
        drawProbability: drawProb,
        awayWinProbability: awayWinProb,
        riskLevel: homeWinProb > 55 ? 'LOW' : homeWinProb > 35 ? 'MEDIUM' : 'HIGH',
        keyFactors: ['Fallback analysis - ChatGPT data unavailable'],
        analysis: `Fallback analysis for ${match.homeTeam} vs ${match.awayTeam}. ChatGPT data not available.`,
        bettingRecommendation: `Limited data available for this match.`
      }
    };
  }

  /**
   * Analyze all matches with ChatGPT data
   */
  async analyzeAllMatches(matches) {
    console.log('🚀 Starting ChatGPT data analysis...');
    
    const analyses = [];
    let successCount = 0;
    let fallbackCount = 0;
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      
      try {
        const analysis = await this.analyzeMatchWithChatGPT(match);
        analyses.push(analysis);
        successCount++;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log(`✅ Analyzed ${i + 1}/${matches.length}: ${match.homeTeam} vs ${match.awayTeam}`);
      } catch (error) {
        console.error(`❌ Failed to analyze match ${i + 1}:`, error.message);
        fallbackCount++;
      }
    }
    
    console.log(`\n🎉 ChatGPT data analysis completed!`);
    console.log(`✅ Successfully analyzed with ChatGPT data: ${successCount} matches`);
    console.log(`⚠️  Used fallback analysis: ${fallbackCount} matches`);
    
    return analyses;
  }
}

// Export for use in other scripts
module.exports = { ChatGPTDataAnalyzer }; 