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
          content: 'You are an expert football analyst with deep knowledge of team statistics, player performance, and match predictions. Analyze matches based on provided data and give detailed predictions. Always respond in valid JSON format.'
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
 * Generate enhanced team data (simulated for demo)
 * @param {string} teamName - Team name
 * @returns {Object} - Enhanced team data
 */
function generateEnhancedTeamData(teamName) {
  // Simulated data - in real implementation, this would come from API
  const formResults = ['W', 'D', 'L', 'W', 'W'];
  const injuries = ['Player A (Knee)', 'Player B (Hamstring)'];
  const keyPlayers = ['Striker X', 'Midfielder Y', 'Defender Z'];
  
  return {
    last5: formResults,
    injuries: injuries,
    keyPlayers: keyPlayers,
    homeAdvantage: Math.random() > 0.5,
    recentGoals: Math.floor(Math.random() * 10) + 5,
    recentConceded: Math.floor(Math.random() * 8) + 3
  };
}

/**
 * Analyze a single match using enhanced data
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

    // Generate enhanced team data
    const homeTeamData = generateEnhancedTeamData(homeTeam);
    const awayTeamData = generateEnhancedTeamData(awayTeam);

    const prompt = `
You are an expert football analyst.

Here is the data for the upcoming match:

Match: ${homeTeam} vs ${awayTeam}
Date: ${matchTime}
League: ${league}
Location: ${venueName}, ${venueCity}

Team A - ${homeTeam}
- Last 5 matches: ${homeTeamData.last5.join(', ')}
- Current injuries: ${homeTeamData.injuries.join(', ')}
- Key players: ${homeTeamData.keyPlayers.join(', ')}
- Home advantage: ${homeTeamData.homeAdvantage ? 'Yes' : 'No'}
- Recent goals scored: ${homeTeamData.recentGoals}
- Recent goals conceded: ${homeTeamData.recentConceded}

Team B - ${awayTeam}
- Last 5 matches: ${awayTeamData.last5.join(', ')}
- Current injuries: ${awayTeamData.injuries.join(', ')}
- Key players: ${awayTeamData.keyPlayers.join(', ')}
- Home advantage: No (away team)
- Recent goals scored: ${awayTeamData.recentGoals}
- Recent goals conceded: ${awayTeamData.recentConceded}

Please analyze both teams and predict:
1. Likely score (final result)
2. Half-time result
3. Over/under 2.5 goals
4. Number of corners (range)
5. Who is more likely to win and why?
6. Key factors that will influence the match
7. Betting recommendations
8. Risk assessment

Only base your answer on the facts provided above.

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
}`;

    console.log(`🤖 Analyzing: ${homeTeam} vs ${awayTeam}`);
    
    const response = await makeOpenAIRequest(prompt);
    
    if (response.choices && response.choices[0] && response.choices[0].message) {
      const content = response.choices[0].message.content;
      
      try {
        const analysis = JSON.parse(content);
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
           analysis
         };
      } catch (parseError) {
        console.error(`❌ Failed to parse analysis for ${homeTeam} vs ${awayTeam}:`, parseError);
        throw new Error(`Invalid JSON response for ${homeTeam} vs ${awayTeam}`);
      }
    } else {
      throw new Error(`No valid response for ${homeTeam} vs ${awayTeam}`);
    }
  } catch (error) {
         console.error(`❌ Error analyzing ${(match.teams && match.teams.home && match.teams.home.name) || 'Home'} vs ${(match.teams && match.teams.away && match.teams.away.name) || 'Away'}:`, error.message);
    throw error;
  }
}

/**
 * Generate enhanced analysis for all matches
 */
async function generateEnhancedAnalysis() {
  try {
    console.log('🤖 Starting enhanced analysis generation...');
    
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
      console.log(`Risk Level: ${(sample.analysis.riskLevel && sample.analysis.riskLevel.toUpperCase()) || 'UNKNOWN'}`);
      console.log(`Win Probabilities: Home ${sample.analysis.homeWinProbability}%, Draw ${sample.analysis.drawProbability}%, Away ${sample.analysis.awayWinProbability}%`);
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
  analyzeMatch,
  generateEnhancedAnalysis
}; 