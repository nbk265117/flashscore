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

// API route for analysis data
app.get('/api/analysis', (req, res) => {
    res.sendFile(path.join(__dirname, 'data', 'analysis.json'));
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

        const prompt = `You are an expert football analyst with deep knowledge of football tactics, team dynamics, and match prediction.

Here is the match data for analysis:

Match: ${match.homeTeam} vs ${match.awayTeam}  
Date: ${match.matchTime}  
League: ${match.league}  
Country: ${match.country}  
Venue: ${match.venue && match.venue.name ? match.venue.name : 'Unknown Stadium'}  
City: ${match.venue && match.venue.city ? match.venue.city : 'Unknown City'}  

Please provide a comprehensive analysis and prediction for this match. Consider:
- Team form and recent performance
- Head-to-head history
- Home/away advantage
- League context and importance
- Weather conditions (if relevant)
- Key players and injuries
- Tactical matchups
- Historical data patterns

Provide detailed predictions in JSON format with your own analysis (do not use example values, provide real predictions based on the match data):
{
  "homeWinProbability": [your prediction],
  "drawProbability": [your prediction],
  "awayWinProbability": [your prediction],
  "likelyScore": [your prediction],
  "halftimeResult": [your prediction],
  "overUnder": [your prediction],
  "corners": [your prediction],
  "winner": [your prediction],
  "reason": [your detailed analysis],
  "halftimeHomeWin": [your prediction],
  "halftimeDraw": [your prediction],
  "halftimeAwayWin": [your prediction],
  "totalCorners": [your prediction],
  "homeCorners": [your prediction],
  "awayCorners": [your prediction],
  "yellowCards": [your prediction],
  "redCards": [your prediction],
  "homeYellowCards": [your prediction],
  "awayYellowCards": [your prediction],
  "homeRedCards": [your prediction],
  "awayRedCards": [your prediction],
  "homeSubs": [your prediction],
  "awaySubs": [your prediction],
  "subTiming": [your prediction],
  "keyFactors": [your analysis factors],
  "analysis": [your detailed match analysis],
  "bettingRecommendation": [your recommendation],
  "riskLevel": [your assessment]
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
                        content: 'You are a football analyst. Provide simple, clear predictions. Always respond with valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
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
