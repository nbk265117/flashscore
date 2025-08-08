# 🚀 Flashinio - Football Match Analysis & Predictions

AI-powered football match analysis and prediction system using Grok API.

## 🏃‍♂️ Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```bash
   # .env file
   GROK_API_KEY=your-actual-grok-api-key-here
   OPENAI_API_KEY=your-actual-openai-api-key-here
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Access the application:**
   - Main app: http://localhost:3000
   - Analysis page: http://localhost:3000/analysis.html

### Production Deployment

The app is deployed on Netlify at: https://flashinio.netlify.app

Environment variables are configured in the Netlify dashboard.

## 🔧 Features

- ✅ AI-powered match predictions using Grok API
- ✅ Real-time match analysis
- ✅ Risk level assessment
- ✅ Comprehensive betting recommendations
- ✅ Modern, responsive UI
- ✅ Secure API handling via Netlify Functions

## 🛠️ Architecture

- **Frontend**: HTML/CSS/JavaScript
- **Backend**: Node.js with Express
- **AI**: Grok API for predictions
- **Deployment**: Netlify with serverless functions
- **Security**: API keys handled server-side only

## 📁 Project Structure

```
├── public/                 # Static files
│   ├── analysis.html      # Main analysis interface
│   ├── css/              # Stylesheets
│   └── js/               # Client-side JavaScript
├── netlify/
│   └── functions/        # Netlify serverless functions
├── data/                 # Match data and analysis
├── server.js            # Express server for local development
└── package.json         # Dependencies and scripts
```

## 🔒 Security

- API keys are stored securely in environment variables
- All API calls go through server-side functions
- No sensitive data exposed in client-side code

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 📝 License

MIT License 