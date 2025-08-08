const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Parse the request body
    const { match } = JSON.parse(event.body);

    if (!match) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Match data is required' })
      };
    }

    const GROK_API_KEY = process.env.GROK_API_KEY;
    
    if (!GROK_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'GROK_API_KEY not configured' })
      };
    }

    const prompt = `You are an expert football analyst with deep knowledge of football tactics, team dynamics, and match prediction.

Here is the match data for analysis:

Match: ${match.homeTeam} vs ${match.awayTeam}  
Date: ${match.matchTime}  
League: ${match.league}  
Country: ${match.country}  
Venue: ${match.venue?.name || 'Unknown Stadium'}  
City: ${match.venue?.city || 'Unknown City'}  

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
      throw new Error(`Grok API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const prediction = JSON.parse(content);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(prediction)
      };
    } catch (error) {
      console.error('Error parsing AI response:', error.message);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to parse AI response' })
      };
    }

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
