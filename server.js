require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Serve data files
app.use('/data', express.static('data'));

// Serve images
app.use('/images', express.static('public/images'));

// Main route - serve analysis.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'analysis.html'));
});

// Comparison route
app.get('/comparison.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'comparison.html'));
});

// API route for analysis data
app.get('/api/analysis', (req, res) => {
    res.sendFile(path.join(__dirname, 'data', 'analysis.json'));
});

// API route for processed matches data
app.get('/api/processed-matches', (req, res) => {
    res.sendFile(path.join(__dirname, 'data', 'processed_matches.json'));
});

// Local development endpoint for Grok predictions
app.post('/.netlify/functions/grok-prediction', async (req, res) => {
    try {
        const { match } = req.body;
        
        if (!match) {
            return res.status(400).json({ error: 'Match data is required' });
        }

        const GROK_API_KEY = process.env.GROK_API_KEY;
        
        console.log('Using GROK_API_KEY:', GROK_API_KEY ? GROK_API_KEY.substring(0, 10) + '...' : 'NOT SET');
        
        if (!GROK_API_KEY) {
            return res.status(500).json({ error: 'GROK_API_KEY not configured' });
        }

        const prompt = `You are an expert football betting analyst with a focus on real match-day accuracy.

ANALYZE THIS MATCH: ${match.homeTeam} vs ${match.awayTeam} in ${match.league} (${match.country}) — Match date: ${new Date(match.matchTime).toLocaleDateString()}.

USE THE FOLLOWING APPROACH:

1. **BASE ANALYSIS**: 
   - Compare current season form, last 5 matches performance
   - Head-to-head history (last 3 years only)
   - League table position and recent momentum
   - Home/away form patterns for both teams

2. **MATCH-DAY CONTEXT**:
   - Official confirmed line-ups if available
   - Key injuries/suspensions and their impact
   - Rest days between matches
   - Travel distance and fatigue factors
   - Weather conditions (if relevant)
   - Motivation factors (title race, relegation battle, cup preparation)

3. **ODDS & MARKET TRENDS**:
   - Consider betting odds movement if available
   - Market signals and public sentiment
   - Bookmaker confidence levels

4. **STATISTICAL INDICATORS**:
   - Goals scored/conceded averages (home/away)
   - Both Teams To Score (BTTS) percentage
   - Over/Under 2.5 goals percentage
   - First-half goal frequency for both teams
   - Clean sheet records and defensive strength
   - Set-piece efficiency and conversion rates

5. **PREDICTION OUTPUT**: Provide two predictions:
   - **SAFE PICK**: Most likely outcome based on stats & current form (lower risk)
   - **VALUE PICK**: Riskier but with potential high return (higher risk)

ANALYSIS GUIDELINES:
- Base predictions on statistical evidence and match-day context, not gut feeling
- Consider current form more heavily than historical data
- Factor in home advantage and team motivation
- Account for official line-ups and key absences
- Be conservative with high-scoring predictions unless strong evidence suggests otherwise
- Consider defensive records and playing styles
- Distinguish between "safe" and "value" betting opportunities

Provide predictions in JSON format ONLY:
{
  "safePrediction": {
    "homeWinProbability": [number 1-100],
    "drawProbability": [number 1-100],
    "awayWinProbability": [number 1-100],
    "likelyScore": "[home]-[away]",
    "halfTimeResult": "[home]-[away]",
    "overUnder2_5": "Over/Under 2.5 goals",
    "winner": "[team name or draw]",
    "confidence": "[HIGH/MEDIUM/LOW]"
  },
  "valuePrediction": {
    "homeWinProbability": [number 1-100],
    "drawProbability": [number 1-100],
    "awayWinProbability": [number 1-100],
    "likelyScore": "[home]-[away]",
    "halfTimeResult": "[home]-[away]",
    "overUnder2_5": "Over/Under 2.5 goals",
    "winner": "[team name or draw]",
    "confidence": "[HIGH/MEDIUM/LOW]"
  },
  "matchDayFactors": {
    "keyAbsences": ["player1", "player2"],
    "motivation": "title race/relegation battle/cup prep/etc",
    "weatherImpact": "none/minor/major",
    "restDays": [homeTeamDays, awayTeamDays],
    "travelDistance": "[home]/[away] team travel impact"
  },
  "keyFactors": ["factor1", "factor2", "factor3"],
  "reasoning": "Concise reasoning mixing form, line-ups, stats, and market trends",
  "riskLevel": "[LOW/MEDIUM/HIGH]"
}`;

        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'grok-4-latest',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a football analyst. Provide predictions in valid JSON format only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 800,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Grok API Error Details:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`Grok API request failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        try {
            const prediction = JSON.parse(content);
            res.json(prediction);
        } catch (error) {
            console.error('Error parsing AI response:', error.message);
            res.status(500).json({ error: 'Failed to parse AI response' });
        }

    } catch (error) {
        console.error('Function error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API route for fetching data by date
app.post('/api/fetch-data', async (req, res) => {
    try {
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({ error: 'Date parameter is required' });
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }

        console.log(`🔄 Fetching data for date: ${date}`);

        // Execute the fetch script for the specified date
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);

        try {
            // Run the fetch script with the specified date
            const { stdout, stderr } = await execAsync(`node scripts/fetch-only.js ${date}`);
            
            if (stderr) {
                console.error('Fetch script stderr:', stderr);
            }

            console.log('Fetch script output:', stdout);

            // Check for API restrictions first
            if (stdout.includes('Free plans do not have access to this date')) {
                return res.status(400).json({
                    error: 'API restriction: Free plans do not have access to this date. Available dates: 2025-08-11 to 2025-08-13'
                });
            }

            // Check if the fetch was successful by looking for success indicators
            if (stdout.includes('✅ Fetch completed successfully') || stdout.includes('Total matches:')) {
                // Extract match count from output
                const matchCountMatch = stdout.match(/Total matches: (\d+)/);
                const matchCount = matchCountMatch ? parseInt(matchCountMatch[1]) : 0;

                // Run the analysis script to process the new data
                try {
                    console.log('🔄 Running analysis script...');
                    const { stdout: analysisStdout, stderr: analysisStderr } = await execAsync('node scripts/enhanced-bayesian-prediction.js');
                    
                    if (analysisStderr) {
                        console.error('Analysis script stderr:', analysisStderr);
                    }

                    console.log('Analysis script output:', analysisStdout);

                    // Run the integration script
                    console.log('🔄 Running integration script...');
                    const { stdout: integrationStdout, stderr: integrationStderr } = await execAsync('node scripts/integrate-bayesian-predictions.js');
                    
                    if (integrationStderr) {
                        console.error('Integration script stderr:', integrationStderr);
                    }

                    console.log('Integration script output:', integrationStdout);

                    res.json({
                        success: true,
                        message: `Successfully fetched and analyzed data for ${date}`,
                        matchCount: matchCount,
                        date: date
                    });

                } catch (analysisError) {
                    console.error('Analysis script error:', analysisError);
                    res.json({
                        success: true,
                        message: `Data fetched for ${date}, but analysis failed`,
                        matchCount: matchCount,
                        date: date,
                        warning: 'Analysis step failed'
                    });
                }

            } else {
                throw new Error('Fetch script did not complete successfully');
            }

        } catch (execError) {
            console.error('Exec error:', execError);
            
            // Check if the error is due to API restrictions
            if (execError.message.includes('Free plans do not have access to this date')) {
                return res.status(400).json({
                    error: 'API restriction: Free plans do not have access to this date. Available dates: 2025-08-11 to 2025-08-13'
                });
            }
            
            throw new Error(`Failed to execute fetch script: ${execError.message}`);
        }

    } catch (error) {
        console.error('Fetch data error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Analysis page: http://localhost:${PORT}/analysis.html`);
    console.log(`📁 Static files: http://localhost:${PORT}/public/`);
    console.log(`💾 Data files: http://localhost:${PORT}/data/`);
});

module.exports = app;
