const MatchService = require('../services/MatchService');
const Logger = require('../utils/Logger');

// ChatGPT API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-api-key-here';

// Simple fetch implementation
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const http = require('http');
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
      Logger.error('Error parsing AI response:', error.message);
      return null;
    }
  } catch (error) {
    Logger.error('Error making AI request:', error.message);
    return null;
  }
}

/**
 * Match Controller
 * Handles match-related operations and business logic
 */
class MatchController {
  constructor() {
    this.matchService = new MatchService();
  }

  /**
   * Process and display all matches
   */
  async processAndDisplayAllMatches() {
    try {
      Logger.info('Processing matches...');
      
      // Get matches from service
      const matches = await this.matchService.getAllMatches();
      
      if (matches.length === 0) {
        Logger.warn('No matches found');
        return;
      }
      
      Logger.success(`Found ${matches.length} matches`);
      
      // Display matches
      this.displayMatches(matches);
      
      // Example: Predict a specific match
      if (matches.length > 0) {
        await this.predictMatch(matches[0]);
      }
      
    } catch (error) {
      Logger.error(`Failed to process matches: ${error.message}`);
      throw error;
    }
  }

  /**
   * Display matches in console
   */
  displayMatches(matches) {
    Logger.info('\n📋 MATCHES SUMMARY:');
    Logger.info('='.repeat(50));
    
    matches.forEach((match, index) => {
      Logger.info(`${index + 1}. ${match.homeTeam} vs ${match.awayTeam}`);
      Logger.info(`   League: ${match.league} (${match.country})`);
      Logger.info(`   Venue: ${match.venue}, ${match.city}`);
      Logger.info(`   Time: ${new Date(match.date).toLocaleString()}`);
      Logger.info(`   Status: ${match.status}`);
      if (match.homeGoals !== null && match.awayGoals !== null) {
        Logger.info(`   Score: ${match.homeGoals}-${match.awayGoals}`);
      }
      Logger.info('');
    });
  }

  /**
   * Predict a specific match using ChatGPT
   */
  async predictMatch(match) {
    try {
      Logger.info(`🤖 Analyzing match: ${match.homeTeam} vs ${match.awayTeam}`);
      
      const prediction = await askChatGPTForPrediction(match);
      
      if (!prediction) {
        Logger.error('Failed to get prediction from ChatGPT');
        return;
      }
      
      // Calculate risk level based on probability
      const riskLevel = prediction.homeWinProbability > 55 ? 'LOW' : 
                       prediction.homeWinProbability > 35 ? 'MEDIUM' : 'HIGH';
      
      Logger.success(`✅ Prediction completed for ${match.homeTeam} vs ${match.awayTeam}`);
      Logger.info(`   Likely Score: ${prediction.likelyScore}`);
      Logger.info(`   Halftime Result: ${prediction.halftimeResult}`);
      Logger.info(`   Over/Under: ${prediction.overUnder}`);
      Logger.info(`   Corners: ${prediction.corners}`);
      Logger.info(`   Winner: ${prediction.winner}`);
      Logger.info(`   Reason: ${prediction.reason}`);
      Logger.info(`   Risk Level: ${riskLevel}`);
      Logger.info(`   Home Win: ${prediction.homeWinProbability}%`);
      Logger.info(`   Draw: ${prediction.drawProbability}%`);
      Logger.info(`   Away Win: ${prediction.awayWinProbability}%`);
      
    } catch (error) {
      Logger.error(`Failed to predict match: ${error.message}`);
    }
  }

  /**
   * Get prediction for a specific match (for API use)
   */
  async getMatchPrediction(matchData) {
    try {
      const prediction = await askChatGPTForPrediction(matchData);
      
      if (!prediction) {
        return { success: false, error: 'Failed to get prediction from ChatGPT' };
      }
      
      // Calculate risk level based on probability
      const riskLevel = prediction.homeWinProbability > 55 ? 'LOW' : 
                       prediction.homeWinProbability > 35 ? 'MEDIUM' : 'HIGH';
      
      return {
        success: true,
        prediction: {
          likelyScore: prediction.likelyScore,
          halftimeResult: prediction.halftimeResult,
          overUnder: prediction.overUnder,
          corners: prediction.corners,
          winner: prediction.winner,
          reason: prediction.reason,
          homeWinProbability: prediction.homeWinProbability,
          drawProbability: prediction.drawProbability,
          awayWinProbability: prediction.awayWinProbability,
          riskLevel: riskLevel
        }
      };
      
    } catch (error) {
      Logger.error(`Error in prediction: ${error.message}`);
      return { success: false, error: 'Internal server error' };
    }
  }
}

module.exports = MatchController; 