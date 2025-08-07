#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// OpenAI API Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';
const OPENAI_HOST = 'api.openai.com';
const OPENAI_PATH = '/v1/chat/completions';

/**
 * Make request to OpenAI API
 * @param {string} prompt - The prompt to send to GPT-4o
 * @returns {Promise<Object>} - The API response
 */
function makeOpenAIRequest(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a football match analyst. Analyze matches and provide detailed insights including win probabilities, halftime predictions, corner predictions, card predictions, substitution predictions, key factors, analysis, and betting recommendations. Always respond in valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const options = {
      hostname: OPENAI_HOST,
      port: 443,
      path: OPENAI_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': data.length
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
          if (response.error) {
            reject(new Error(`OpenAI API Error: ${response.error.message}`));
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(new Error(`Failed to parse OpenAI response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.write(data);
    req.end();
  });
}

/**
 * Analyze a single match using GPT-4o
 * @param {Object} match - The match data
 * @returns {Promise<Object>} - The analysis result
 */
async function analyzeMatch(match) {
  try {
    const homeTeam = (match.teams && match.teams.home && match.teams.home.name) || 'Home Team';
    const awayTeam = (match.teams && match.teams.away && match.teams.away.name) || 'Away Team';
    const league = (match.league && match.league.name) || 'Unknown League';
    const country = (match.league && match.league.country) || 'Unknown Country';
    const matchTime = (match.fixture && match.fixture.date) || new Date().toISOString();
    const venue = (match.fixture && match.fixture.venue) || {};
    const venueName = venue.name || 'Unknown Venue';
    const venueCity = venue.city || 'Unknown City';
    const venueCountry = venue.country || 'Unknown Country';
    const referee = (match.fixture && match.fixture.referee) || 'Unknown Referee';

    const prompt = `
Analyze this football match and provide detailed insights:

Match Details:
- Home Team: ${homeTeam}
- Away Team: ${awayTeam}
- League: ${league} (${country})
- Match Time: ${matchTime}
- Venue: ${venueName}
- City: ${venueCity}
- Country: ${venueCountry}
- Referee: ${referee}

Please provide:
1. Win probability for each team (percentage)
2. Draw probability (percentage)
3. Predicted halftime score (e.g., "1-0", "0-1", "1-1")
4. Predicted final score (e.g., "2-1", "1-2", "2-2")
5. Key factors that could influence the result
6. Historical context and team form analysis
7. Betting recommendations (if applicable)
8. Risk assessment

Format your response as JSON with this structure:
{
  "homeWinProbability": 45,
  "awayWinProbability": 35,
  "drawProbability": 20,
  "halftime": {
    "homeWinProbability": 50,
    "awayWinProbability": 30,
    "drawProbability": 20,
    "prediction": "Home team likely to lead at halftime",
    "scorePrediction": "1-0"
  },
  "finalScore": {
    "homeScore": "2",
    "awayScore": "1",
    "prediction": "2-1"
  },
  "corners": {
    "total": "9-11",
    "homeTeam": "5-6",
    "awayTeam": "4-5",
    "prediction": "Above average corner count expected"
  },
  "cards": {
    "yellowCards": "4-6",
    "redCards": "0-1",
    "homeTeamCards": "2-3",
    "awayTeamCards": "2-3",
    "prediction": "Moderate card count, away team slightly more aggressive"
  },
  "substitutions": {
    "homeTeam": "2-3",
    "awayTeam": "2-3",
    "timing": "Most substitutions between 60-75 minutes",
    "prediction": "Standard substitution pattern expected"
  },
  "keyFactors": ["factor1", "factor2"],
  "analysis": "Detailed analysis text",
  "bettingRecommendation": "Recommendation text",
  "riskLevel": "low/medium/high"
}
`;

    console.log(`🤖 Analyzing: ${homeTeam} vs ${awayTeam} (${league})`);
    
    const response = await makeOpenAIRequest(prompt);
    const content = response.choices[0].message.content;
    
    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse GPT response as JSON: ${error.message}`);
    }

    return {
      homeTeam,
      awayTeam,
      homeTeamLogo: (match.teams && match.teams.home && match.teams.home.logo) || null,
      awayTeamLogo: (match.teams && match.teams.away && match.teams.away.logo) || null,
      league,
      country,
      matchTime,
      venue: {
        name: venueName,
        city: venueCity,
        country: venueCountry
      },
      analysis
    };

  } catch (error) {
    console.error(`❌ Error analyzing ${(match.teams && match.teams.home && match.teams.home.name) || 'match'}: ${error.message}`);
    throw error;
  }
}

/**
 * Generate analysis for all matches
 */
async function generateAnalysis() {
  try {
    console.log('🚀 Starting ChatGPT analysis with GPT-4o...');
    
    // Check if OpenAI API key is set
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
      throw new Error('OpenAI API key not set. Please set OPENAI_API_KEY environment variable.');
    }

    // Read the response.json file
    const responsePath = path.join(__dirname, '../data/response.json');
    const responseData = await fs.readFile(responsePath, 'utf8');
    const data = JSON.parse(responseData);
    
    if (!data.response || !Array.isArray(data.response)) {
      throw new Error('Invalid response.json structure');
    }
    
    console.log(`📊 Found ${data.response.length} matches to analyze`);
    
    // Analyze matches (limit to first 10 for demo purposes to avoid rate limits)
    const matchesToAnalyze = data.response.slice(0, 10);
    const analyses = [];
    
    for (let i = 0; i < matchesToAnalyze.length; i++) {
      const match = matchesToAnalyze[i];
      try {
        const analysis = await analyzeMatch(match);
        analyses.push(analysis);
        
        // Add delay between requests to respect rate limits
        if (i < matchesToAnalyze.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Failed to analyze match ${i + 1}: ${error.message}`);
        // Continue with other matches even if one fails
      }
    }
    
    // Save to analysis.json
    const analysisPath = path.join(__dirname, '../data/analysis.json');
    await fs.writeFile(analysisPath, JSON.stringify(analyses, null, 2));
    
    console.log(`✅ Generated analysis for ${analyses.length} matches`);
    console.log(`📁 Analysis saved to: ${analysisPath}`);
    
    // Show sample analysis
    if (analyses.length > 0) {
      console.log('\n📋 Sample analysis:');
      const sample = analyses[0];
      console.log(`Match: ${sample.homeTeam} vs ${sample.awayTeam}`);
      console.log(`League: ${sample.league} (${sample.country})`);
      console.log(`Risk Level: ${sample.analysis.riskLevel.toUpperCase()}`);
      console.log(`Win Probabilities: Home ${sample.analysis.homeWinProbability}%, Draw ${sample.analysis.drawProbability}%, Away ${sample.analysis.awayWinProbability}%`);
    }
    
  } catch (error) {
    console.error('❌ Error generating analysis:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  generateAnalysis();
}

module.exports = { generateAnalysis, analyzeMatch }; 