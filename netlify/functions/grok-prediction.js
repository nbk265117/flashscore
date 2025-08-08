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
  
  // Handle GET requests for testing
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Grok prediction function is working',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        grokKeyExists: !!process.env.GROK_API_KEY,
        grokKeyLength: process.env.GROK_API_KEY ? process.env.GROK_API_KEY.length : 0
      })
    };
  }

  try {
    console.log('Function called with method:', event.httpMethod);
    console.log('Request body length:', event.body ? event.body.length : 0);
    console.log('Request body preview:', event.body ? event.body.substring(0, 200) + '...' : 'No body');
    
    // Check if body exists
    if (!event.body) {
      console.error('No request body provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No request body provided' })
      };
    }
    
    // Parse the request body
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Raw body:', event.body);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message,
          bodyPreview: event.body.substring(0, 200)
        })
      };
    }
    
    const { match } = parsedBody;

    if (!match) {
      console.error('No match data in request');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Match data is required' })
      };
    }

    const GROK_API_KEY = process.env.GROK_API_KEY;
    
    console.log('Checking GROK_API_KEY...');
    if (!GROK_API_KEY) {
      console.error('GROK_API_KEY not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'GROK_API_KEY not configured' })
      };
    }
    console.log('GROK_API_KEY found, length:', GROK_API_KEY.length);

    // Comprehensive prompt for detailed analysis
    const prompt = `You are an expert football analyst with deep knowledge of football tactics, team dynamics, and match prediction.

Here is the match data for analysis:
Match: ${match.homeTeam} vs ${match.awayTeam}
Date: ${match.matchTime || match.date}
League: ${match.league}
Country: ${match.country}
Venue: ${match.venue?.name || match.venue}
City: ${match.venue?.city || match.city}

Please provide a comprehensive analysis and prediction for this match. Consider:
* Team form and recent performance
* Head-to-head history
* Home/away advantage
* League context and importance
* Weather conditions (if relevant)
* Key players and injuries
* Tactical matchups
* Historical data patterns

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

    console.log('Making Grok API request...');
    console.log('API Key starts with:', GROK_API_KEY.substring(0, 10) + '...');
    console.log('Request payload:', JSON.stringify({
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
    }, null, 2));
    
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
      console.error('Full error response:', errorText);
      
      // Return detailed error for debugging
      return {
        statusCode: 200, // Return 200 to avoid client errors
        headers,
        body: JSON.stringify({ 
          error: `Grok API error: ${response.status}`,
          details: errorText,
          apiKeyLength: GROK_API_KEY.length,
          apiKeyPrefix: GROK_API_KEY.substring(0, 10),
          fallback: true
        })
      };
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('Parsing AI response...');
    
    try {
      // Try to extract JSON from the response (in case it's wrapped in markdown)
      let jsonContent = content;
      
      // If the response contains markdown code blocks, extract the JSON
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }
      
      // If the response contains just code blocks, extract the content
      const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
      if (codeMatch && !jsonMatch) {
        jsonContent = codeMatch[1];
      }
      
      const prediction = JSON.parse(jsonContent);
      console.log('Successfully parsed prediction');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(prediction)
      };
    } catch (error) {
      console.error('Error parsing AI response:', error.message);
      console.error('Raw content:', content);
      
      // Return a fallback response instead of an error
      const fallbackPrediction = {
        homeWinProbability: 35,
        drawProbability: 30,
        awayWinProbability: 35,
        likelyScore: "1-1",
        halftimeResult: "0-0",
        overUnder: "Over 2.5 goals",
        corners: "Over 10.5",
        winner: "Draw",
        reason: "Analysis temporarily unavailable",
        halftimeHomeWin: 30,
        halftimeDraw: 45,
        halftimeAwayWin: 25,
        totalCorners: 11,
        homeCorners: 5,
        awayCorners: 6,
        yellowCards: 5,
        redCards: 0,
        homeYellowCards: 3,
        awayYellowCards: 2,
        homeRedCards: 0,
        awayRedCards: 0,
        homeSubs: 3,
        awaySubs: 3,
        subTiming: "Around 60-75 minutes",
        keyFactors: ["Home advantage", "Recent form"],
        analysis: "Analysis temporarily unavailable",
        bettingRecommendation: "Wait for better data",
        riskLevel: "Medium"
      };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(fallbackPrediction)
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
