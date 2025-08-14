#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

/**
 * Create comparison analysis between predictions and actual results
 */
class ComparisonAnalyzer {
  constructor() {
    this.comparisonData = {
      date: '2025-08-14',
      totalMatches: 0,
      completedMatches: 0,
      predictions: [],
      accuracy: {
        winner: 0,
        score: 0,
        overUnder: 0,
        halftime: 0
      },
      confidenceAnalysis: {
        high: { total: 0, correct: 0, accuracy: 0 },
        medium: { total: 0, correct: 0, accuracy: 0 },
        low: { total: 0, correct: 0, accuracy: 0 }
      },
      riskAnalysis: {
        low: { total: 0, correct: 0, accuracy: 0 },
        medium: { total: 0, correct: 0, accuracy: 0 },
        high: { total: 0, correct: 0, accuracy: 0 }
      }
    };
  }

  /**
   * Load predictions from analysis.json
   */
  async loadPredictions() {
    try {
      const analysisPath = path.join(__dirname, '..', 'data', 'analysis.json');
      const data = await fsPromises.readFile(analysisPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading predictions:', error.message);
      return null;
    }
  }

  /**
   * Load actual results from matches file
   */
  async loadActualResults() {
    try {
      const matchesPath = path.join(__dirname, '..', 'data', 'matches_2025_08_14.json');
      const data = await fsPromises.readFile(matchesPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading actual results:', error.message);
      return null;
    }
  }

  /**
   * Determine actual winner from score
   */
  getActualWinner(homeGoals, awayGoals) {
    if (homeGoals > awayGoals) return 'home';
    if (awayGoals > homeGoals) return 'away';
    return 'draw';
  }

  /**
   * Determine predicted winner from prediction data
   */
  getPredictedWinner(prediction) {
    const homeWin = prediction.homeWinProbability || 0;
    const awayWin = prediction.awayWinProbability || 0;
    const draw = prediction.drawProbability || 0;

    if (homeWin > awayWin && homeWin > draw) return 'home';
    if (awayWin > homeWin && awayWin > draw) return 'away';
    return 'draw';
  }

  /**
   * Check if over/under prediction is correct
   */
  checkOverUnder(predicted, actualHome, actualAway) {
    if (!predicted || predicted === 'N/A') return false;
    
    const totalGoals = actualHome + actualAway;
    
    if (predicted.includes('Over 2.5')) {
      return totalGoals > 2.5;
    } else if (predicted.includes('Under 2.5')) {
      return totalGoals < 2.5;
    }
    return false;
  }

  /**
   * Calculate score accuracy (how close the prediction was)
   */
  calculateScoreAccuracy(predictedScore, actualHome, actualAway) {
    if (!predictedScore || predictedScore === 'N/A') return 0;
    
    const [predHome, predAway] = predictedScore.split('-').map(Number);
    if (isNaN(predHome) || isNaN(predAway)) return 0;
    
    const homeDiff = Math.abs(predHome - actualHome);
    const awayDiff = Math.abs(predAway - actualAway);
    
    // Perfect prediction = 100%, each goal difference reduces by 25%
    const accuracy = Math.max(0, 100 - ((homeDiff + awayDiff) * 25));
    return Math.round(accuracy);
  }

  /**
   * Compare predictions with actual results
   */
  async createComparison() {
    try {
      console.log('🔄 Loading predictions and actual results...');
      
      const predictions = await this.loadPredictions();
      const actualResults = await this.loadActualResults();
      
      if (!predictions || !actualResults) {
        throw new Error('Failed to load data');
      }

      this.comparisonData.totalMatches = predictions.totalMatches;
      
      console.log(`📊 Analyzing ${predictions.totalMatches} matches...`);
      
      // Create a map of actual results by match ID for quick lookup
      const actualResultsMap = new Map();
      actualResults.matches.forEach(match => {
        actualResultsMap.set(match.id, match);
      });

      // Compare each prediction with actual result
      predictions.analyses.forEach(prediction => {
        const matchId = prediction.match.id;
        const actualResult = actualResultsMap.get(matchId);
        
        if (!actualResult) {
          console.log(`⚠️ No actual result found for match ID: ${matchId}`);
          return;
        }

        // Only analyze completed matches
        if (actualResult.status !== 'FT' && actualResult.status !== 'AET' && actualResult.status !== 'PEN') {
          return;
        }

        this.comparisonData.completedMatches++;
        
        const actualHome = actualResult.homeGoals || 0;
        const actualAway = actualResult.awayGoals || 0;
        const actualWinner = this.getActualWinner(actualHome, actualAway);
        const predictedWinner = this.getPredictedWinner(prediction);
        
        // Calculate accuracies
        const winnerCorrect = actualWinner === predictedWinner;
        const scoreAccuracy = this.calculateScoreAccuracy(prediction.predictions && prediction.predictions.likelyScore, actualHome, actualAway);
        const overUnderCorrect = this.checkOverUnder(prediction.predictions && prediction.predictions.overUnder, actualHome, actualAway);
        
        // Update accuracy counters
        if (winnerCorrect) this.comparisonData.accuracy.winner++;
        if (scoreAccuracy >= 50) this.comparisonData.accuracy.score++;
        if (overUnderCorrect) this.comparisonData.accuracy.overUnder++;
        
        // Update confidence analysis
        const confidence = (prediction.confidence && prediction.confidence.toLowerCase()) || 'medium';
        if (this.comparisonData.confidenceAnalysis[confidence]) {
          this.comparisonData.confidenceAnalysis[confidence].total++;
          if (winnerCorrect) {
            this.comparisonData.confidenceAnalysis[confidence].correct++;
          }
        }
        
        // Update risk analysis
        const risk = (prediction.analysis && prediction.analysis.riskLevel && prediction.analysis.riskLevel.toLowerCase()) || 'medium';
        if (this.comparisonData.riskAnalysis[risk]) {
          this.comparisonData.riskAnalysis[risk].total++;
          if (winnerCorrect) {
            this.comparisonData.riskAnalysis[risk].correct++;
          }
        }
        
        // Create comparison entry
        const comparison = {
          matchId: matchId,
          homeTeam: prediction.homeTeam,
          awayTeam: prediction.awayTeam,
          league: prediction.league,
          prediction: {
            winner: predictedWinner,
            score: (prediction.predictions && prediction.predictions.likelyScore) || 'N/A',
            overUnder: (prediction.predictions && prediction.predictions.overUnder) || 'N/A',
            halftime: (prediction.predictions && prediction.predictions.halftimeResult) || 'N/A',
            homeWinProb: (prediction.analysis && prediction.analysis.homeWinProbability) || 0,
            drawProb: (prediction.analysis && prediction.analysis.drawProbability) || 0,
            awayWinProb: (prediction.analysis && prediction.analysis.awayWinProbability) || 0,
            confidence: prediction.confidence || 'MEDIUM',
            riskLevel: (prediction.analysis && prediction.analysis.riskLevel) || 'MEDIUM'
          },
          actual: {
            winner: actualWinner,
            score: `${actualHome}-${actualAway}`,
            homeGoals: actualHome,
            awayGoals: actualAway,
            status: actualResult.status
          },
          accuracy: {
            winner: winnerCorrect,
            score: scoreAccuracy,
            overUnder: overUnderCorrect,
            overall: Math.round((winnerCorrect + (scoreAccuracy / 100) + overUnderCorrect) / 3 * 100)
          }
        };
        
        this.comparisonData.predictions.push(comparison);
      });
      
      // Calculate final accuracy percentages
      if (this.comparisonData.completedMatches > 0) {
        this.comparisonData.accuracy.winner = Math.round((this.comparisonData.accuracy.winner / this.comparisonData.completedMatches) * 100);
        this.comparisonData.accuracy.score = Math.round((this.comparisonData.accuracy.score / this.comparisonData.completedMatches) * 100);
        this.comparisonData.accuracy.overUnder = Math.round((this.comparisonData.accuracy.overUnder / this.comparisonData.completedMatches) * 100);
      }
      
      // Calculate confidence and risk accuracies
      Object.keys(this.comparisonData.confidenceAnalysis).forEach(level => {
        const data = this.comparisonData.confidenceAnalysis[level];
        if (data.total > 0) {
          data.accuracy = Math.round((data.correct / data.total) * 100);
        }
      });
      
      Object.keys(this.comparisonData.riskAnalysis).forEach(level => {
        const data = this.comparisonData.riskAnalysis[level];
        if (data.total > 0) {
          data.accuracy = Math.round((data.correct / data.total) * 100);
        }
      });
      
      console.log(`✅ Comparison analysis completed!`);
      console.log(`📊 Completed matches: ${this.comparisonData.completedMatches}/${this.comparisonData.totalMatches}`);
      
      return this.comparisonData;
      
    } catch (error) {
      console.error('❌ Error creating comparison:', error.message);
      throw error;
    }
  }

  /**
   * Save comparison data
   */
  async saveComparison() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        await fsPromises.mkdir(dataDir, { recursive: true });
      }
      
      const outputPath = path.join(dataDir, 'comparison_2025_08_14.json');
      await fsPromises.writeFile(outputPath, JSON.stringify(this.comparisonData, null, 2));
      
      console.log(`💾 Comparison data saved to: ${outputPath}`);
      return outputPath;
      
    } catch (error) {
      console.error('Error saving comparison data:', error.message);
      throw error;
    }
  }

  /**
   * Display summary statistics
   */
  displaySummary() {
    console.log('\n📊 PREDICTION ACCURACY SUMMARY');
    console.log('='.repeat(50));
    console.log(`📅 Date: ${this.comparisonData.date}`);
    console.log(`🏟️ Total Matches: ${this.comparisonData.totalMatches}`);
    console.log(`✅ Completed Matches: ${this.comparisonData.completedMatches}`);
    console.log(`📈 Winner Prediction Accuracy: ${this.comparisonData.accuracy.winner}%`);
    console.log(`⚽ Score Prediction Accuracy: ${this.comparisonData.accuracy.score}%`);
    console.log(`🎯 Over/Under Accuracy: ${this.comparisonData.accuracy.overUnder}%`);
    
    console.log('\n🎯 CONFIDENCE LEVEL ANALYSIS');
    console.log('-'.repeat(30));
    Object.entries(this.comparisonData.confidenceAnalysis).forEach(([level, data]) => {
      if (data.total > 0) {
        console.log(`${level.toUpperCase()}: ${data.correct}/${data.total} (${data.accuracy}%)`);
      }
    });
    
    console.log('\n⚠️ RISK LEVEL ANALYSIS');
    console.log('-'.repeat(25));
    Object.entries(this.comparisonData.riskAnalysis).forEach(([level, data]) => {
      if (data.total > 0) {
        console.log(`${level.toUpperCase()}: ${data.correct}/${data.total} (${data.accuracy}%)`);
      }
    });
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🎯 Prediction vs Reality Comparison');
    console.log('='.repeat(50));
    
    const analyzer = new ComparisonAnalyzer();
    
    // Create comparison
    await analyzer.createComparison();
    
    // Save comparison data
    await analyzer.saveComparison();
    
    // Display summary
    analyzer.displaySummary();
    
    console.log('\n✅ Comparison analysis completed successfully!');
    console.log('🌐 View comparison at: http://localhost:3000/comparison.html');
    
  } catch (error) {
    console.error('❌ Comparison failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ComparisonAnalyzer };
