const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const GROK_API_KEY = process.env.GROK_API_KEY;
    
    if (!GROK_API_KEY) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          error: 'GROK_API_KEY not configured',
          timestamp: new Date().toISOString()
        })
      };
    }

    console.log('Testing Grok API with key length:', GROK_API_KEY.length);
    
    // Simple test request
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
            role: 'user',
            content: 'Say "Hello, this is a test"'
          }
        ],
        temperature: 0.1,
        max_tokens: 50,
        stream: false
      })
    });

    console.log('Test API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          error: `Grok API test failed: ${response.status}`,
          details: errorText,
          apiKeyLength: GROK_API_KEY.length,
          apiKeyPrefix: GROK_API_KEY.substring(0, 10),
          timestamp: new Date().toISOString()
        })
      };
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Grok API test successful',
        response: content,
        apiKeyLength: GROK_API_KEY.length,
        apiKeyPrefix: GROK_API_KEY.substring(0, 10),
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Test function error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        error: 'Test function failed',
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
