#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

/**
 * Simple Local Analyzer - Uses local data for quick analysis
 */
class SimpleLocalAnalyzer {
  constructor() {
    // Simple team strength database
    this.teamStrengths = {
      // Major teams (higher strength)
      "Manchester City": 95,
      "Real Madrid": 92,
      "Bayern Munich": 90,
      "Paris Saint-Germain": 88,
      "Liverpool": 87,
      "Arsenal": 85,
      "Barcelona": 84,
      "Inter Milan": 86,
      "AC Milan": 82,
      "Juventus": 80,
      "Atletico Madrid": 83,
      "Borussia Dortmund": 81,
      "RB Leipzig": 79,
      "Bayer Leverkusen": 88,
      "Porto": 78,
      "Benfica": 80,
      "Sporting CP": 77,
      "Ajax": 76,
      "PSV Eindhoven": 75,
      "Feyenoord": 74,
      "Flamengo": 82,
      "Palmeiras": 80,
      "Sao Paulo": 78,
      "Corinthians": 75,
      "Santos": 73,
      "Cruzeiro": 72,
      "CRB": 70,
      // Default for unknown teams
      "default": 70
    };
  }

  /**
   * Get team strength
   */
  getTeamStrength(teamName) {
    // Try exact match first
    if (this.teamStrengths[teamName]) {
      return this.teamStrengths[teamName];
    }
    
    // Try partial match
    for (const [key, value] of Object.entries(this.teamStrengths)) {
      if (key.toLowerCase().includes(teamName.toLowerCase()) || 
          teamName.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    
    // Use default if no match found
    return this.teamStrengths.default;
  }

  /**
   * Calculate simple probabilities
   */
  calculateProbabilities(homeTeam, awayTeam) {
    const homeStrength = this.getTeamStrength(homeTeam);
    const awayStrength = this.getTeamStrength(awayTeam);
    
    // Add home advantage
    const homeWithAdvantage = homeStrength + 5;
    
    // Calculate total strength
    const totalStrength = homeWithAdvantage + awayStrength;
    
    // Calculate probabilities with more variation
    const homeWinProb = Math.round((homeWithAdvantage / totalStrength) * 100);
    const awayWinProb = Math.round((awayStrength / totalStrength) * 100);
    const drawProb = 100 - homeWinProb - awayWinProb;
    
    // Add some randomness to create more variation
    const randomFactor = (Math.random() - 0.5) * 20; // ±10 variation
    
    return {
      homeWinProb: Math.max(25, Math.min(75, homeWinProb + randomFactor)),
      awayWinProb: Math.max(15, Math.min(65, awayWinProb - randomFactor * 0.5)),
      drawProb: Math.max(10, Math.min(30, drawProb - randomFactor * 0.5))
    };
  }

  /**
   * Generate simple score prediction
   */
  generateScore(probabilities) {
    const maxProb = Math.max(probabilities.homeWinProb, probabilities.awayWinProb, probabilities.drawProb);
    
    let homeGoals, awayGoals;
    
    if (maxProb === probabilities.homeWinProb) {
      // Home win likely
      homeGoals = Math.floor(Math.random() * 2) + 2; // 2-3 goals
      awayGoals = Math.floor(Math.random() * 2); // 0-1 goals
    } else if (maxProb === probabilities.awayWinProb) {
      // Away win likely
      homeGoals = Math.floor(Math.random() * 2); // 0-1 goals
      awayGoals = Math.floor(Math.random() * 2) + 2; // 2-3 goals
    } else {
      // Draw likely
      homeGoals = Math.floor(Math.random() * 2) + 1; // 1-2 goals
      awayGoals = homeGoals; // Same score for draw
    }
    
    return { homeGoals, awayGoals };
  }

  /**
   * Generate simple analysis text
   */
  generateAnalysisText(match, probabilities, score) {
    const homeStrength = this.getTeamStrength(match.homeTeam);
    const awayStrength = this.getTeamStrength(match.awayTeam);
    
    let analysis = `Simple analysis: ${match.homeTeam} (strength: ${homeStrength}) vs ${match.awayTeam} (strength: ${awayStrength}). `;
    
    if (probabilities.homeWinProb > probabilities.awayWinProb) {
      analysis += `${match.homeTeam} has the advantage and is likely to win. `;
    } else if (probabilities.awayWinProb > probabilities.homeWinProb) {
      analysis += `${match.awayTeam} has the advantage and is likely to win. `;
    } else {
      analysis += `Both teams are evenly matched. `;
    }
    
    analysis += `Predicted score: ${score.homeGoals}-${score.awayGoals}.`;
    
    return analysis;
  }

  /**
   * Analyze a single match
   */
  analyzeMatch(match) {
    console.log(`🔍 Analyzing ${match.homeTeam} vs ${match.awayTeam}...`);
    
    // Calculate probabilities
    const probabilities = this.calculateProbabilities(match.homeTeam, match.awayTeam);
    
    // Generate score
    const score = this.generateScore(probabilities);
    
    // Calculate risk level with more variation
    const riskLevel = probabilities.homeWinProb > 60 ? 'LOW' : 
                     probabilities.homeWinProb > 40 ? 'MEDIUM' : 'HIGH';
    
    // Generate analysis text
    const analysisText = this.generateAnalysisText(match, probabilities, score);
    
    // Determine winner
    const winner = score.homeGoals > score.awayGoals ? match.homeTeam : 
                   score.awayGoals > score.homeGoals ? match.awayTeam : 'Draw';
    
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
        homeWin: probabilities.homeWinProb,
        draw: probabilities.drawProb,
        awayWin: probabilities.awayWinProb
      },
      predictions: {
        likelyScore: `${score.homeGoals}-${score.awayGoals}`,
        halftimeResult: `${Math.floor(score.homeGoals * 0.6)}-${Math.floor(score.awayGoals * 0.6)}`,
        overUnder: (score.homeGoals + score.awayGoals) > 2.5 ? 'Over 2.5' : 'Under 2.5',
        corners: `${Math.floor(score.homeGoals * 2) + 3}-${Math.floor(score.awayGoals * 2) + 3}`,
        totalCorners: Math.floor(score.homeGoals * 2) + Math.floor(score.awayGoals * 2) + 6,
        yellowCards: Math.floor((score.homeGoals + score.awayGoals) * 1.5) + 2,
        redCards: Math.floor((score.homeGoals + score.awayGoals) * 0.2),
        homeTeamSubs: 3,
        awayTeamSubs: 3,
        substitutionTiming: '60-70 minutes',
        halftimeHomeWin: Math.round(probabilities.homeWinProb * 0.9),
        halftimeDraw: Math.round(probabilities.drawProb * 1.2),
        halftimeAwayWin: Math.round(probabilities.awayWinProb * 0.9),
        homeYellowCards: Math.floor((score.homeGoals + score.awayGoals) * 0.8),
        awayYellowCards: Math.floor((score.homeGoals + score.awayGoals) * 0.7),
        homeRedCards: Math.floor((score.homeGoals + score.awayGoals) * 0.1),
        awayRedCards: Math.floor((score.homeGoals + score.awayGoals) * 0.1),
        homeCorners: Math.floor(score.homeGoals * 2) + 3,
        awayCorners: Math.floor(score.awayGoals * 2) + 3,
        winner: winner,
        reason: `${winner} has better team strength and form`
      },
      analysis: {
        homeWinProbability: probabilities.homeWinProb,
        drawProbability: probabilities.drawProb,
        awayWinProbability: probabilities.awayWinProb,
        riskLevel: riskLevel,
        keyFactors: [`${match.homeTeam} strength: ${this.getTeamStrength(match.homeTeam)}`, `${match.awayTeam} strength: ${this.getTeamStrength(match.awayTeam)}`],
        analysis: analysisText,
        bettingRecommendation: `${winner} win recommended with ${probabilities.homeWinProb}% probability based on team strength.`
      }
    };
  }

  /**
   * Analyze all matches
   */
  async analyzeAllMatches(matches) {
    console.log('🚀 Starting simple local analysis...');
    
    const analyses = [];
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      
      try {
        const analysis = this.analyzeMatch(match);
        analyses.push(analysis);
        
        console.log(`✅ Analyzed ${i + 1}/${matches.length}: ${match.homeTeam} vs ${match.awayTeam}`);
      } catch (error) {
        console.error(`❌ Failed to analyze match ${i + 1}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Simple local analysis completed!`);
    console.log(`✅ Successfully analyzed: ${analyses.length} matches`);
    
    return analyses;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const inputFile = process.argv[2];
    
    if (!inputFile) {
      console.error('❌ Please provide an input file path');
      console.log('Usage: node simple-local-analyzer.js <input-file>');
      process.exit(1);
    }
    
    const inputPath = path.resolve(inputFile);
    
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Input file not found: ${inputPath}`);
      process.exit(1);
    }
    
    console.log('🚀 Starting SIMPLE LOCAL analysis...');
    console.log('📊 This uses local team strength data for quick analysis');
    
    const matchesData = JSON.parse(await fsPromises.readFile(inputPath, 'utf8'));
    console.log(`📊 Processing ${matchesData.length} matches from ${matchesData[0] ? matchesData[0].date : 'unknown date'}`);
    
    // Initialize analyzer
    const analyzer = new SimpleLocalAnalyzer();
    
    // Analyze all matches
    const analyses = await analyzer.analyzeAllMatches(matchesData);
    
    const analysisData = {
      date: matchesData[0] ? matchesData[0].date : new Date().toISOString().split('T')[0],
      totalMatches: matchesData.length,
      analyses: analyses,
      analysisType: 'SIMPLE_LOCAL',
      description: 'Simple analysis using local team strength data'
    };
    
    // Save to data directory
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      await fsPromises.mkdir(dataDir, { recursive: true });
    }
    
    const outputFilename = `simple_local_analysis_${analysisData.date.replace(/-/g, '_')}.json`;
    const outputPath = path.join(dataDir, outputFilename);
    
    await fsPromises.writeFile(outputPath, JSON.stringify(analysisData, null, 2));
    console.log(`💾 Saved simple local analysis to ${outputFilename}`);
    
    // Also save to public interface
    const publicAnalysisPath = path.join(__dirname, '..', 'data', 'analysis.json');
    await fsPromises.writeFile(publicAnalysisPath, JSON.stringify(analysisData, null, 2));
    console.log('🌐 Saved simple local analysis to public interface: analysis.json');
    
    console.log('✅ Simple local analysis completed successfully!');
    console.log(`📁 Analysis saved to: ${outputPath}`);
    console.log(`📊 Total matches analyzed: ${analyses.length}`);
    
    // Show sample analysis
    if (analyses.length > 0) {
      const sample = analyses[0];
      console.log(`\n📋 Sample SIMPLE LOCAL analysis:`);
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

module.exports = { SimpleLocalAnalyzer }; 