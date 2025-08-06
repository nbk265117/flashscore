# ChatGPT Analysis Integration

This document explains how to use the ChatGPT analysis feature with GPT-4o for football match predictions.

## Overview

The ChatGPT analysis feature uses OpenAI's GPT-4o model to provide detailed match analysis including:
- Win probabilities for home, away, and draw
- Halftime predictions
- Corner predictions
- Card predictions (yellow/red cards)
- Substitution predictions
- Key factors analysis
- Betting recommendations
- Risk assessment

## Setup

### 1. Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Go to API Keys section
4. Create a new API key
5. Copy the API key

### 2. Set Environment Variable

Set your OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY="your-api-key-here"
```

Or add it to your `.env` file:

```
OPENAI_API_KEY=your-api-key-here
```

## Usage

### Running Analysis

#### Method 1: Direct Script Execution

```bash
node scripts/chatgpt-analyzer.js
```

#### Method 2: Through Web Interface

1. Start the server: `npm run server`
2. Visit: `http://localhost:3000/analysis.html`
3. Click "🔄 Refresh Analysis" button

#### Method 3: API Endpoint

```bash
curl -X POST http://localhost:3000/api/analyze
```

### Analysis Process

1. **Data Loading**: Reads match data from `data/response.json`
2. **Match Processing**: Analyzes each match individually
3. **GPT-4o Integration**: Sends detailed prompts to GPT-4o
4. **Response Parsing**: Extracts structured JSON responses
5. **Data Saving**: Saves results to `data/analysis.json`

## Features

### Detailed Predictions

Each match analysis includes:

#### Win Probabilities
- Home team win probability
- Away team win probability  
- Draw probability

#### Halftime Predictions
- Halftime win probabilities
- Halftime prediction summary

#### Corner Predictions
- Total corner count range
- Home team corners
- Away team corners
- Corner prediction summary

#### Card Predictions
- Yellow cards range
- Red cards range
- Home team cards
- Away team cards
- Card prediction summary

#### Substitution Predictions
- Home team substitutions
- Away team substitutions
- Substitution timing
- Substitution prediction summary

#### Analysis Components
- Key factors affecting the match
- Detailed match analysis
- Betting recommendations
- Risk level assessment

## Configuration

### Rate Limiting

The script includes built-in rate limiting:
- 1 second delay between API calls
- Limits to first 10 matches by default
- Error handling for API failures

### Model Settings

- **Model**: `gpt-4o`
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 2000
- **System Prompt**: Football match analyst role

## Cost Estimation

### GPT-4o Pricing (as of 2024)
- Input: $5.00 per 1M tokens
- Output: $15.00 per 1M tokens

### Estimated Costs
- **Per match analysis**: ~$0.01-0.02
- **10 matches**: ~$0.10-0.20
- **100 matches**: ~$1.00-2.00

## Error Handling

The script handles various error scenarios:
- Missing API key
- Invalid API responses
- Network failures
- Rate limit exceeded
- JSON parsing errors

## Sample Output

```json
{
  "homeTeam": "Manchester United",
  "awayTeam": "Liverpool",
  "league": "Premier League",
  "country": "England",
  "matchTime": "2025-08-06T21:00:00Z",
  "analysis": {
    "homeWinProbability": 35,
    "awayWinProbability": 45,
    "drawProbability": 20,
    "halftime": {
      "homeWinProbability": 30,
      "awayWinProbability": 50,
      "drawProbability": 20,
      "prediction": "Liverpool likely to lead at halftime"
    },
    "corners": {
      "total": "10-12",
      "homeTeam": "4-5",
      "awayTeam": "6-7",
      "prediction": "High corner count expected due to attacking styles"
    },
    "cards": {
      "yellowCards": "4-6",
      "redCards": "0-1",
      "homeTeamCards": "2-3",
      "awayTeamCards": "2-3",
      "prediction": "Moderate card count in intense rivalry match"
    },
    "substitutions": {
      "homeTeam": "3-4",
      "awayTeam": "2-3",
      "timing": "Most substitutions between 60-75 minutes",
      "prediction": "Home team will need fresh legs to counter away pressure"
    },
    "keyFactors": [
      "Liverpool's superior recent form",
      "Manchester United's home advantage",
      "Historical rivalry intensity",
      "Both teams missing key players"
    ],
    "analysis": "Liverpool enters this match in excellent form...",
    "bettingRecommendation": "Consider Liverpool win with moderate confidence...",
    "riskLevel": "medium"
  }
}
```

## Troubleshooting

### Common Issues

1. **"OpenAI API key not set"**
   - Solution: Set the OPENAI_API_KEY environment variable

2. **"You exceeded your current quota"**
   - Solution: Check your OpenAI billing and usage limits

3. **"The model gpt-4o does not exist"**
   - Solution: Ensure you have access to GPT-4o in your OpenAI account

4. **"Failed to parse GPT response as JSON"**
   - Solution: The AI response wasn't in valid JSON format (rare)

### Debug Mode

To see detailed API interactions, add logging:

```javascript
// In scripts/chatgpt-analyzer.js
console.log('API Request:', data);
console.log('API Response:', responseData);
```

## Security Notes

- Never commit your API key to version control
- Use environment variables for sensitive data
- Monitor your API usage and costs
- Consider implementing usage limits

## Future Enhancements

- Support for other AI models
- Batch processing optimization
- Caching of analysis results
- Real-time analysis updates
- Integration with live match data 