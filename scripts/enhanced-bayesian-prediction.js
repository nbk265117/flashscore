#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

/**
 * Bayesian Prediction System for Football Matches
 * Based on the Medium article: "Predicting Premier League Match Wins Using Bayesian Modelling"
 */

class BayesianPredictor {
  constructor() {
    this.priors = {
      homeAdvantage: 0.15, // 15% home advantage
      drawProbability: 0.25, // 25% base draw probability
      goalExpectation: 2.5, // Average goals per match
      formWeight: 0.6, // Weight for recent form vs historical data
      headToHeadWeight: 0.3, // Weight for head-to-head history
      leagueStrengthWeight: 0.1 // Weight for league strength
    };
  }

  /**
   * Calculate team strength based on recent form
   */
  calculateTeamStrength(teamData) {
    if (!teamData || !teamData.last5) {
      return 0.5; // Default neutral strength
    }

    const form = teamData.last5;
    const wins = form.filter(result => result === 'W').length;
    const draws = form.filter(result => result === 'D').length;
    const losses = form.filter(result => result === 'L').length;

    // Bayesian strength calculation
    const totalMatches = form.length;
    const winRate = wins / totalMatches;
    const drawRate = draws / totalMatches;
    const lossRate = losses / totalMatches;

    // Weighted strength calculation
    const strength = (winRate * 1.0) + (drawRate * 0.5) + (lossRate * 0.0);
    
    // Apply Bayesian smoothing (add pseudo-counts)
    const alpha = 2; // Prior strength
    const beta = 2; // Prior weakness
    const smoothedStrength = (wins + alpha) / (totalMatches + alpha + beta);

    return Math.max(0.1, Math.min(0.9, smoothedStrength));
  }

  /**
   * Calculate head-to-head advantage
   */
  calculateHeadToHeadAdvantage(homeTeam, awayTeam, historicalData = []) {
    if (!historicalData || historicalData.length === 0) {
      return 0; // No historical data available
    }

    const homeWins = historicalData.filter(match => 
      match.homeTeam === homeTeam && match.awayTeam === awayTeam && 
      match.homeGoals > match.awayGoals
    ).length;

    const awayWins = historicalData.filter(match => 
      match.homeTeam === homeTeam && match.awayTeam === awayTeam && 
      match.awayGoals > match.homeGoals
    ).length;

    const draws = historicalData.filter(match => 
      match.homeTeam === homeTeam && match.awayTeam === awayTeam && 
      match.homeGoals === match.awayGoals
    ).length;

    const totalMatches = homeWins + awayWins + draws;
    
    if (totalMatches === 0) return 0;

    // Bayesian head-to-head advantage
    const homeAdvantage = (homeWins + 1) / (totalMatches + 3); // Add pseudo-counts
    const awayAdvantage = (awayWins + 1) / (totalMatches + 3);
    
    return homeAdvantage - awayAdvantage;
  }

  /**
   * Calculate league strength adjustment
   */
  calculateLeagueStrength(league) {
    const leagueStrengths = {
      'Premier League': 1.2,
      'La Liga': 1.15,
      'Bundesliga': 1.1,
      'Serie A': 1.05,
      'Ligue 1': 1.0,
      'Champions League': 1.3,
      'Europa League': 1.2,
      'Major League Soccer': 0.8,
      'Serie A (Brazil)': 0.9,
      'Liga Profesional Argentina': 0.85
    };

    return leagueStrengths[league] || 1.0;
  }

  /**
   * Calculate goal expectations using Poisson distribution
   */
  calculateGoalExpectations(homeStrength, awayStrength, leagueStrength) {
    // Base goal expectation
    const baseGoals = this.priors.goalExpectation;
    
    // Adjust based on team strengths
    const homeGoals = baseGoals * homeStrength * leagueStrength;
    const awayGoals = baseGoals * awayStrength * leagueStrength;
    
    // Apply home advantage
    const adjustedHomeGoals = homeGoals * (1 + this.priors.homeAdvantage);
    
    return {
      homeGoals: Math.max(0.5, adjustedHomeGoals),
      awayGoals: Math.max(0.3, awayGoals)
    };
  }

  /**
   * Calculate win probabilities using Bayesian inference
   */
  calculateWinProbabilities(homeStrength, awayStrength, headToHeadAdvantage, leagueStrength) {
    // Base probabilities
    let homeWinProb = homeStrength * (1 + this.priors.homeAdvantage);
    let awayWinProb = awayStrength;
    let drawProb = this.priors.drawProbability;

    // Adjust for head-to-head history
    homeWinProb += headToHeadAdvantage * this.priors.headToHeadWeight;
    awayWinProb -= headToHeadAdvantage * this.priors.headToHeadWeight;

    // Adjust for league strength
    const leagueAdjustment = (leagueStrength - 1.0) * this.priors.leagueStrengthWeight;
    homeWinProb += leagueAdjustment;
    awayWinProb += leagueAdjustment;

    // Normalize probabilities
    const total = homeWinProb + awayWinProb + drawProb;
    homeWinProb = homeWinProb / total;
    awayWinProb = awayWinProb / total;
    drawProb = drawProb / total;

    return {
      homeWinProbability: Math.round(homeWinProb * 100),
      drawProbability: Math.round(drawProb * 100),
      awayWinProbability: Math.round(awayWinProb * 100)
    };
  }

  /**
   * Generate score prediction using Poisson distribution
   */
  generateScorePrediction(homeGoals, awayGoals, probabilities) {
    // Use Poisson distribution for realistic score generation
    const generatePoissonGoals = (lambda) => {
      const L = Math.exp(-lambda);
      let p = 1.0;
      let k = 0;
      
      do {
        k++;
        p *= Math.random();
      } while (p > L);
      
      return k - 1;
    };

    // Generate multiple scores and pick the most likely one based on probabilities
    let bestScore = { homeScore: 0, awayScore: 0 };
    let bestProbability = 0;
    
    // Generate several score combinations and pick the one that best matches our probabilities
    for (let i = 0; i < 10; i++) {
      const homeScore = generatePoissonGoals(homeGoals);
      const awayScore = generatePoissonGoals(awayGoals);
      
      // Calculate how well this score matches our win probabilities
      let scoreProbability = 0;
      if (homeScore > awayScore) {
        scoreProbability = probabilities.homeWinProbability;
      } else if (awayScore > homeScore) {
        scoreProbability = probabilities.awayWinProbability;
      } else {
        scoreProbability = probabilities.drawProbability;
      }
      
      if (scoreProbability > bestProbability) {
        bestProbability = scoreProbability;
        bestScore = { homeScore: Math.max(0, homeScore), awayScore: Math.max(0, awayScore) };
      }
    }

    return bestScore;
  }

  /**
   * Calculate confidence level based on data quality and probability distribution
   */
  calculateConfidence(probabilities, dataQuality) {
    const maxProb = Math.max(probabilities.homeWinProbability, 
                            probabilities.drawProbability, 
                            probabilities.awayWinProbability);
    
    const minProb = Math.min(probabilities.homeWinProbability, 
                            probabilities.drawProbability, 
                            probabilities.awayWinProbability);
    
    const probabilitySpread = maxProb - minProb;
    
    // Confidence based on probability spread and data quality
    if (probabilitySpread > 30 && dataQuality > 0.8) {
      return 'HIGH';
    } else if (probabilitySpread > 15 && dataQuality > 0.6) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Assess data quality for the prediction
   */
  assessDataQuality(match, homeData, awayData) {
    let quality = 0.5; // Base quality
    
    // Check for recent form data
    if (homeData && homeData.last5 && homeData.last5.length >= 3) {
      quality += 0.2;
    }
    if (awayData && awayData.last5 && awayData.last5.length >= 3) {
      quality += 0.2;
    }
    
    // Check for historical data
    if (match.historicalData && match.historicalData.length > 0) {
      quality += 0.1;
    }
    
    // Check for league information
    if (match.league && match.league !== 'Unknown') {
      quality += 0.1;
    }
    
    return Math.min(1.0, quality);
  }

  /**
   * Main prediction function
   */
  predictMatch(match) {
    try {
      // Generate mock team data (in real implementation, this would come from database)
      const homeData = this.generateMockTeamData(match.homeTeam);
      const awayData = this.generateMockTeamData(match.awayTeam);
      
      // Calculate team strengths
      const homeStrength = this.calculateTeamStrength(homeData);
      const awayStrength = this.calculateTeamStrength(awayData);
      
      // Calculate head-to-head advantage
      const headToHeadAdvantage = this.calculateHeadToHeadAdvantage(
        match.homeTeam, 
        match.awayTeam, 
        match.historicalData || []
      );
      
      // Calculate league strength
      const leagueStrength = this.calculateLeagueStrength(match.league);
      
      // Calculate goal expectations
      const goalExpectations = this.calculateGoalExpectations(
        homeStrength, 
        awayStrength, 
        leagueStrength
      );
      
      // Calculate win probabilities
      const probabilities = this.calculateWinProbabilities(
        homeStrength, 
        awayStrength, 
        headToHeadAdvantage, 
        leagueStrength
      );
      
      // Generate score prediction
      const score = this.generateScorePrediction(
        goalExpectations.homeGoals, 
        goalExpectations.awayGoals,
        probabilities
      );
      
      // Assess data quality
      const dataQuality = this.assessDataQuality(match, homeData, awayData);
      
      // Calculate confidence
      const confidence = this.calculateConfidence(probabilities, dataQuality);
      
      // Determine winner based on probabilities (more accurate than score)
      const winner = probabilities.homeWinProbability > probabilities.awayWinProbability && probabilities.homeWinProbability > probabilities.drawProbability ? match.homeTeam :
                    probabilities.awayWinProbability > probabilities.homeWinProbability && probabilities.awayWinProbability > probabilities.drawProbability ? match.awayTeam : 'Draw';
      
      // Calculate halftime score (simplified)
      const halftimeHome = Math.floor(score.homeScore * 0.6);
      const halftimeAway = Math.floor(score.awayScore * 0.6);
      
      // Determine over/under
      const totalGoals = score.homeScore + score.awayScore;
      const overUnder = totalGoals > 2.5 ? 'Over 2.5' : 'Under 2.5';
      
      // Calculate risk level
      const riskLevel = probabilities.homeWinProbability > 55 ? 'LOW' :
                       probabilities.homeWinProbability > 35 ? 'MEDIUM' : 'HIGH';
      
      return {
        match: {
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          league: match.league,
          date: match.date
        },
        prediction: {
          homeWinProbability: probabilities.homeWinProbability,
          drawProbability: probabilities.drawProbability,
          awayWinProbability: probabilities.awayWinProbability,
          likelyScore: `${score.homeScore}-${score.awayScore}`,
          halftimeResult: `${halftimeHome}-${halftimeAway}`,
          overUnder2_5: overUnder,
          winner: winner,
          confidence: confidence,
          riskLevel: riskLevel
        },
        analysis: {
          homeStrength: Math.round(homeStrength * 100),
          awayStrength: Math.round(awayStrength * 100),
          headToHeadAdvantage: Math.round(headToHeadAdvantage * 100),
          leagueStrength: leagueStrength,
          dataQuality: Math.round(dataQuality * 100),
          goalExpectations: {
            home: Math.round(goalExpectations.homeGoals * 10) / 10,
            away: Math.round(goalExpectations.awayGoals * 10) / 10
          }
        },
        reasoning: this.generateReasoning(match, homeData, awayData, probabilities, score, confidence)
      };
      
    } catch (error) {
      console.error('Error in Bayesian prediction:', error);
      return null;
    }
  }

  /**
   * Generate mock team data (replace with real data source)
   */
  generateMockTeamData(teamName) {
    const formOptions = ['W', 'D', 'L'];
    const last5 = [];
    
    for (let i = 0; i < 5; i++) {
      last5.push(formOptions[Math.floor(Math.random() * formOptions.length)]);
    }
    
    return {
      last5: last5,
      teamName: teamName,
      // Add more team data as needed
    };
  }

  /**
   * Generate reasoning for the prediction
   */
  generateReasoning(match, homeData, awayData, probabilities, score, confidence) {
    const homeWins = homeData.last5.filter(result => result === 'W').length;
    const awayWins = awayData.last5.filter(result => result === 'W').length;
    
    let reasoning = `Based on Bayesian analysis, ${match.homeTeam} has ${homeWins}/5 recent wins `;
    reasoning += `while ${match.awayTeam} has ${awayWins}/5 recent wins. `;
    
    if (probabilities.homeWinProbability > 50) {
      reasoning += `The model favors ${match.homeTeam} with ${probabilities.homeWinProbability}% win probability. `;
    } else if (probabilities.awayWinProbability > 50) {
      reasoning += `The model favors ${match.awayTeam} with ${probabilities.awayWinProbability}% win probability. `;
    } else {
      reasoning += `The model suggests a close match with ${probabilities.drawProbability}% draw probability. `;
    }
    
    reasoning += `Expected score: ${score.homeScore}-${score.awayScore}. `;
    reasoning += `Confidence level: ${confidence}.`;
    
    return reasoning;
  }
}

/**
 * Main function to test the Bayesian predictor
 */
async function main() {
  try {
    console.log('🎯 Bayesian Prediction System');
    console.log('='.repeat(50));
    
    const predictor = new BayesianPredictor();
    
    // Test with sample matches
    const testMatches = [
      {
        homeTeam: 'Manchester City',
        awayTeam: 'Liverpool',
        league: 'Premier League',
        date: '2025-08-10',
        historicalData: [
          { homeTeam: 'Manchester City', awayTeam: 'Liverpool', homeGoals: 2, awayGoals: 1 },
          { homeTeam: 'Manchester City', awayTeam: 'Liverpool', homeGoals: 1, awayGoals: 1 },
          { homeTeam: 'Manchester City', awayTeam: 'Liverpool', homeGoals: 3, awayGoals: 0 }
        ]
      },
      {
        homeTeam: 'Barcelona',
        awayTeam: 'Real Madrid',
        league: 'La Liga',
        date: '2025-08-10',
        historicalData: []
      },
      {
        homeTeam: 'Bayern Munich',
        awayTeam: 'Borussia Dortmund',
        league: 'Bundesliga',
        date: '2025-08-10',
        historicalData: []
      }
    ];
    
    for (const match of testMatches) {
      console.log(`\n🏟️ Analyzing: ${match.homeTeam} vs ${match.awayTeam}`);
      console.log(`🏆 League: ${match.league}`);
      
      const prediction = predictor.predictMatch(match);
      
      if (prediction) {
        console.log(`📊 Prediction Results:`);
        console.log(`   Home Win: ${prediction.prediction.homeWinProbability}%`);
        console.log(`   Draw: ${prediction.prediction.drawProbability}%`);
        console.log(`   Away Win: ${prediction.prediction.awayWinProbability}%`);
        console.log(`   Likely Score: ${prediction.prediction.likelyScore}`);
        console.log(`   Halftime: ${prediction.prediction.halftimeResult}`);
        console.log(`   Over/Under: ${prediction.prediction.overUnder2_5}`);
        console.log(`   Winner: ${prediction.prediction.winner}`);
        console.log(`   Confidence: ${prediction.prediction.confidence}`);
        console.log(`   Risk Level: ${prediction.prediction.riskLevel}`);
        console.log(`   Reasoning: ${prediction.reasoning}`);
      }
    }
    
    console.log('\n✅ Bayesian prediction system ready for integration!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BayesianPredictor };
