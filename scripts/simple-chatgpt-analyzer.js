#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

// Simple fetch implementation
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Ask ChatGPT for simple match analysis
 */
async function askChatGPT(match) {
  const prompt = `You are an expert football analyst.

Here is the data for the upcoming match:

Match: ${match.homeTeam} vs ${match.awayTeam}  
Date: ${match.date}  
League: ${match.league}  
Location: ${match.venue}  

Team A - ${match.homeTeam}  

Team B - ${match.awayTeam}  

Please analyze both teams and predict:  
1. Likely score  
2. Half-time result  
3. Over/under 2.5 goals  
4. Number of corners (range)  
5. Who is more likely to win and why?  

do not use Last 5 matches or Current injuries or key players do not complicated keep it easy and simple

Respond with JSON format:
{
  "likelyScore": "2-1",
  "halftimeResult": "1-0",
  "overUnder": "Over 2.5",
  "corners": "8-10",
  "winner": "Team A",
  "reason": "Simple reason why this team will win",
  "homeWinProbability": 60,
  "drawProbability": 25,
  "awayWinProbability": 15
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Error parsing ChatGPT response:', error.message);
      return null;
    }
  } catch (error) {
    console.error('Error making ChatGPT request:', error.message);
    return null;
  }
}

/**
 * Analyze a single match
 */
async function analyzeMatch(match) {
  console.log(`🔍 Analyzing ${match.homeTeam} vs ${match.awayTeam}...`);
  
  const chatGPTResult = await askChatGPT(match);
  
  if (!chatGPTResult) {
    console.log(`⚠️  Could not get ChatGPT analysis for ${match.homeTeam} vs ${match.awayTeam}, using fallback...`);
    return createFallbackAnalysis(match);
  }
  
  // Calculate risk level based on probability
  const riskLevel = chatGPTResult.homeWinProbability > 55 ? 'LOW' : 
                   chatGPTResult.homeWinProbability > 35 ? 'MEDIUM' : 'HIGH';
  
  return {
    match: {
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      date: match.date,
      venue: match.venue,
      city: match.city,
      country: match.country,
      league: match.league
    },
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    league: match.league,
    country: match.country,
    matchTime: match.date,
    venue: {
      name: match.venue,
      city: match.city,
      country: match.country
    },
    probabilities: {
      homeWin: chatGPTResult.homeWinProbability,
      draw: chatGPTResult.drawProbability,
      awayWin: chatGPTResult.awayWinProbability
    },
    predictions: {
      likelyScore: chatGPTResult.likelyScore,
      halftimeResult: chatGPTResult.halftimeResult,
      overUnder: chatGPTResult.overUnder,
      corners: chatGPTResult.corners,
      totalCorners: parseInt(chatGPTResult.corners.split('-')[1]) || 10,
      yellowCards: 5,
      redCards: 1,
      homeTeamSubs: 3,
      awayTeamSubs: 3,
      substitutionTiming: '60-70 minutes',
      halftimeHomeWin: Math.round(chatGPTResult.homeWinProbability * 0.9),
      halftimeDraw: Math.round(chatGPTResult.drawProbability * 1.2),
      halftimeAwayWin: Math.round(chatGPTResult.awayWinProbability * 0.9),
      homeYellowCards: 2,
      awayYellowCards: 3,
      homeRedCards: 0,
      awayRedCards: 1,
      homeCorners: parseInt(chatGPTResult.corners.split('-')[0]) || 5,
      awayCorners: parseInt(chatGPTResult.corners.split('-')[1]) || 5,
      winner: chatGPTResult.winner,
      reason: chatGPTResult.reason
    },
    analysis: {
      homeWinProbability: chatGPTResult.homeWinProbability,
      drawProbability: chatGPTResult.drawProbability,
      awayWinProbability: chatGPTResult.awayWinProbability,
      riskLevel: riskLevel,
      keyFactors: [chatGPTResult.reason],
      analysis: `ChatGPT Analysis: ${chatGPTResult.winner} is likely to win. ${chatGPTResult.reason}`,
      bettingRecommendation: `${chatGPTResult.winner} win recommended with ${chatGPTResult.homeWinProbability}% probability.`
    }
  };
}

/**
 * Create fallback analysis when ChatGPT fails
 */
function createFallbackAnalysis(match) {
  const homeHash = match.homeTeam.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const awayHash = match.awayTeam.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  
  const homeForm = (homeHash % 100) / 100;
  const awayForm = (awayHash % 100) / 100;
  
  const homeWinProb = Math.round((homeForm + 0.15) * 100);
  const awayWinProb = Math.round(awayForm * 100);
  const drawProb = 100 - homeWinProb - awayWinProb;
  
  return {
    match: {
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      date: match.date,
      venue: match.venue,
      city: match.city,
      country: match.country,
      league: match.league
    },
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    league: match.league,
    country: match.country,
    matchTime: match.date,
    venue: {
      name: match.venue,
      city: match.city,
      country: match.country
    },
    analysis: {
      homeWinProbability: homeWinProb,
      drawProbability: drawProb,
      awayWinProbability: awayWinProb,
      riskLevel: homeWinProb > 55 ? 'LOW' : homeWinProb > 35 ? 'MEDIUM' : 'HIGH',
      keyFactors: ['Fallback analysis - ChatGPT unavailable'],
      analysis: `Fallback analysis for ${match.homeTeam} vs ${match.awayTeam}. ChatGPT data not available.`,
      bettingRecommendation: `Limited data available for this match.`
    }
  };
}

/**
 * Analyze all matches
 */
async function analyzeAllMatches(matches) {
  console.log('🚀 Starting simple ChatGPT analysis...');
  
  const analyses = [];
  let successCount = 0;
  let fallbackCount = 0;
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    
    try {
      const analysis = await analyzeMatch(match);
      analyses.push(analysis);
      successCount++;
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log(`✅ Analyzed ${i + 1}/${matches.length}: ${match.homeTeam} vs ${match.awayTeam}`);
    } catch (error) {
      console.error(`❌ Failed to analyze match ${i + 1}:`, error.message);
      fallbackCount++;
    }
  }
  
  console.log(`\n🎉 Simple ChatGPT analysis completed!`);
  console.log(`✅ Successfully analyzed with ChatGPT: ${successCount} matches`);
  console.log(`⚠️  Used fallback analysis: ${fallbackCount} matches`);
  
  return analyses;
}

/**
 * Main function
 */
async function main() {
  try {
    const inputFile = process.argv[2];
    
    if (!inputFile) {
      console.error('❌ Please provide an input file path');
      console.log('Usage: node simple-chatgpt-analyzer.js <input-file>');
      process.exit(1);
    }
    
    const inputPath = path.resolve(inputFile);
    
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Input file not found: ${inputPath}`);
      process.exit(1);
    }
    
    console.log('🚀 Starting SIMPLE ChatGPT analysis...');
    console.log('📊 This will ask ChatGPT for simple match predictions');
    
    const matchesData = JSON.parse(await fsPromises.readFile(inputPath, 'utf8'));
    console.log(`📊 Processing ${matchesData.length} matches from ${matchesData[0] ? matchesData[0].date : 'unknown date'}`);
    
    // Analyze all matches
    const analyses = await analyzeAllMatches(matchesData);
    
    const analysisData = {
      date: matchesData[0] ? matchesData[0].date : new Date().toISOString().split('T')[0],
      totalMatches: matchesData.length,
      analyses: analyses,
      analysisType: 'SIMPLE_CHATGPT',
      description: 'Simple analysis using ChatGPT for each match'
    };
    
    // Save to data directory
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      await fsPromises.mkdir(dataDir, { recursive: true });
    }
    
    const outputFilename = `simple_analysis_${analysisData.date.replace(/-/g, '_')}.json`;
    const outputPath = path.join(dataDir, outputFilename);
    
    await fsPromises.writeFile(outputPath, JSON.stringify(analysisData, null, 2));
    console.log(`💾 Saved simple analysis to ${outputFilename}`);
    
    // Also save to public interface
    const publicAnalysisPath = path.join(__dirname, '..', 'data', 'analysis.json');
    await fsPromises.writeFile(publicAnalysisPath, JSON.stringify(analysisData, null, 2));
    console.log('🌐 Saved simple analysis to public interface: analysis.json');
    
    console.log('✅ Simple ChatGPT analysis completed successfully!');
    console.log(`📁 Analysis saved to: ${outputPath}`);
    console.log(`📊 Total matches analyzed: ${analyses.length}`);
    
    // Show sample analysis
    if (analyses.length > 0) {
      const sample = analyses[0];
      console.log(`\n📋 Sample SIMPLE analysis:`);
      console.log(`Match: ${sample.homeTeam} vs ${sample.awayTeam}`);
      console.log(`League: ${sample.league} (${sample.country})`);
      console.log(`Risk Level: ${sample.analysis.riskLevel.toUpperCase()}`);
      console.log(`Win Probabilities: Home ${sample.analysis.homeWinProbability}%, Draw ${sample.analysis.drawProbability}%, Away ${sample.analysis.awayWinProbability}%`);
      console.log(`Predicted Score: ${(sample.predictions && sample.predictions.likelyScore) || 'N/A'}`);
      console.log(`Analysis: ${sample.analysis.analysis}`);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeMatch, analyzeAllMatches }; 