const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Set function timeout and disable callback wait
  context.callbackWaitsForEmptyEventLoop = false;
  
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

    // Simplified prompt for faster response
    const prompt = `Analyze this football match: ${match.homeTeam} vs ${match.awayTeam} in ${match.league}. Provide predictions in JSON format:
{
  "homeWinProbability": [number],
  "drawProbability": [number],
  "awayWinProbability": [number],
  "likelyScore": "[home]-[away]",
  "halftimeResult": "[home]-[away]",
  "overUnder": "Over/Under [number] goals",
  "corners": "Over/Under [number]",
  "winner": "[team name]",
  "reason": "[brief analysis]",
  "halftimeHomeWin": [number],
  "halftimeDraw": [number],
  "halftimeAwayWin": [number],
  "totalCorners": [number],
  "homeCorners": [number],
  "awayCorners": [number],
  "yellowCards": [number],
  "redCards": [number],
  "homeYellowCards": [number],
  "awayYellowCards": [number],
  "homeRedCards": [number],
  "awayRedCards": [number],
  "homeSubs": [number],
  "awaySubs": [number],
  "subTiming": "[description]",
  "keyFactors": ["factor1", "factor2"],
  "analysis": "[detailed analysis]",
  "bettingRecommendation": "[recommendation]",
  "riskLevel": "Low/Medium/High"
}`;

    console.log('Making Grok API request...');
    
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

    console.log('Grok API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Grok API Error:', response.status, errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Grok API error: ${response.status}` })
      };
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('Parsing AI response...');
    
    try {
      const prediction = JSON.parse(content);
      console.log('Successfully parsed prediction');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(prediction)
      };
    } catch (error) {
      console.error('Error parsing AI response:', error.message);
      console.error('Raw content:', content);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to parse AI response' })
      };
    }

  } catch (error) {
    console.error('Function error:', error);
    
    // Handle timeout errors specifically
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        statusCode: 408,
        headers,
        body: JSON.stringify({ error: 'Request timeout - please try again' })
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
