# Deployment Guide

## Environment Variables

### Required Environment Variables

Set these in your Netlify dashboard at: https://app.netlify.com/projects/flashinio/configuration/env#environment-variables

- `GROK_API_KEY` - Your Grok API key for AI predictions (set in Netlify dashboard)
- `OPENAI_API_KEY` - Your OpenAI API key (if using OpenAI for predictions, set in Netlify dashboard)

### Netlify Functions

The application uses Netlify Functions to securely handle API calls server-side. This prevents API keys from being exposed in client-side code.

#### Functions Structure
```
netlify/
  functions/
    grok-prediction.js  # Handles Grok API calls
```

#### Function Endpoints
- `/.netlify/functions/grok-prediction` - POST endpoint for match predictions

### Deployment Steps

1. **Set Environment Variables** in Netlify dashboard
2. **Deploy** using your preferred method:
   - Git push to connected repository
   - Netlify CLI: `netlify deploy --prod`
   - Manual upload

### Local Development

1. Install dependencies: `npm install`
2. Set up environment variables in `.env` file
3. Run locally: `npm run dev`

### Troubleshooting

- **"process is not defined" error**: This was fixed by moving API calls to Netlify Functions
- **Function errors**: Check Netlify function logs in the dashboard
- **CORS issues**: Functions include proper CORS headers

## Security Notes

- API keys are now handled server-side via Netlify Functions
- No sensitive data is exposed in client-side code
- All API calls go through secure serverless functions
