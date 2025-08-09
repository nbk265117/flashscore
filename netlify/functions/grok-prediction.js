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

    // Enhanced comprehensive prompt with match-day accuracy focus
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
      
      // Try to fix truncated JSON by finding the last complete object
      let lastBraceIndex = jsonContent.lastIndexOf('}');
      if (lastBraceIndex > 0) {
        jsonContent = jsonContent.substring(0, lastBraceIndex + 1);
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
      
      // Try to extract what we can from the partial response
      console.log('Attempting to extract partial data...');
      
      // Look for key-value pairs in the truncated content
      const partialData = {};
      
      // Try different regex patterns to extract data
      const patterns = [
        /"([^"]+)":\s*([^,}\n]+)/g,
        /"([^"]+)":\s*"([^"]*)"/g,
        /"([^"]+)":\s*(\d+)/g
      ];
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const key = match[1];
          let value = match[2].trim();
          
          // Skip if we already have this key
          if (partialData[key] !== undefined) continue;
          
          // Try to parse the value
          try {
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            } else if (value === 'true' || value === 'false') {
              value = value === 'true';
            } else if (!isNaN(value)) {
              value = Number(value);
            }
            partialData[key] = value;
          } catch (e) {
            // Skip this value if we can't parse it
          }
        }
      });
      
      if (Object.keys(partialData).length > 0) {
        console.log('Extracted partial data:', partialData);
        
        // Fill in missing fields with reasonable defaults
        const completeData = {
          homeWinProbability: partialData.homeWinProbability || 35,
          drawProbability: partialData.drawProbability || 30,
          awayWinProbability: partialData.awayWinProbability || 35,
          likelyScore: partialData.likelyScore || "1-1",
          halftimeResult: partialData.halftimeResult || "0-0",
          overUnder: partialData.overUnder || "Over 2.5 goals"
        };
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(completeData)
        };
      }
      
      // Return detailed error information for debugging
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          error: 'Failed to parse AI response',
          details: error.message,
          rawContent: content,
          apiKeyLength: GROK_API_KEY.length,
          apiKeyPrefix: GROK_API_KEY.substring(0, 10),
          timestamp: new Date().toISOString(),
          fallback: true
        })
      };
    }

  } catch (error) {
    console.error('Function error:', error);
    
    // Handle timeout errors specifically
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          error: 'Request timeout - please try again',
          details: error.message,
          timestamp: new Date().toISOString()
        })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        error: 'Function error',
        details: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    };
  }
};
