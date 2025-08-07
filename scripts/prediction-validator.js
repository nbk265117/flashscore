#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

/**
 * Prediction Validator - Analyzes prediction accuracy and provides feedback
 */
class PredictionValidator {
  constructor() {
    this.predictions = [];
    this.actualResults = [];
    this.accuracyMetrics = {
      homeWins: { correct: 0, total: 0, accuracy: 0 },
      awayWins: { correct: 0, total: 0, accuracy: 0 },
      draws: { correct: 0, total: 0, accuracy: 0 },
      scorePredictions: { correct: 0, total: 0, accuracy: 0 },
      overall: { correct: 0, total: 0, accuracy: 0 }
    };
  }

  /**
   * Load predictions and actual results
   */
  async loadData() {
    try {
      // Load predictions
      const predictionsData = await fs.readFile('data/enhanced_analysis.json', 'utf8');
      this.predictions = JSON.parse(predictionsData);
      
      // Load actual results (completed matches)
      const matchesData = await fs.readFile('data/processed_matches.json', 'utf8');
      const matches = JSON.parse(matchesData);
      
      // Filter for completed matches with scores
      this.actualResults = matches.filter(match => 
        match.score && 
        match.score.fulltime && 
        match.score.fulltime.home !== null && 
        match.score.fulltime.away !== null &&
        match.isFinished === true
      );
      
      console.log(`📊 Loaded ${this.predictions.length} predictions and ${this.actualResults.length} actual results`);
    } catch (error) {
      console.error('❌ Error loading data:', error.message);
    }
  }

  /**
   * Match predictions with actual results
   */
  matchPredictionsWithResults() {
    const matchedData = [];
    
    this.predictions.forEach(prediction => {
      const actualResult = this.actualResults.find(result => 
        result.homeTeam === prediction.homeTeam && 
        result.awayTeam === prediction.awayTeam
      );
      
      if (actualResult) {
        matchedData.push({
          prediction,
          actual: actualResult,
          accuracy: this.calculatePredictionAccuracy(prediction, actualResult)
        });
      }
    });
    
    return matchedData;
  }

  /**
   * Calculate prediction accuracy for a single match
   */
  calculatePredictionAccuracy(prediction, actual) {
    const homeGoals = actual.score.fulltime.home;
    const awayGoals = actual.score.fulltime.away;
    
    // Determine actual outcome
    let actualOutcome;
    if (homeGoals > awayGoals) actualOutcome = 'home';
    else if (awayGoals > homeGoals) actualOutcome = 'away';
    else actualOutcome = 'draw';
    
    // Determine predicted outcome
    const homeProb = prediction.analysis.homeWinProbability;
    const awayProb = prediction.analysis.awayWinProbability;
    const drawProb = prediction.analysis.drawProbability;
    
    let predictedOutcome;
    if (homeProb > awayProb && homeProb > drawProb) predictedOutcome = 'home';
    else if (awayProb > homeProb && awayProb > drawProb) predictedOutcome = 'away';
    else predictedOutcome = 'draw';
    
    // Calculate accuracy metrics
    const outcomeCorrect = actualOutcome === predictedOutcome;
    const scorePrediction = prediction.analysis.finalScore;
    const predictedHomeGoals = parseInt(scorePrediction.homeScore);
    const predictedAwayGoals = parseInt(scorePrediction.awayScore);
    
    const scoreAccuracy = this.calculateScoreAccuracy(
      predictedHomeGoals, predictedAwayGoals,
      homeGoals, awayGoals
    );
    
    return {
      outcomeCorrect,
      predictedOutcome,
      actualOutcome,
      scoreAccuracy,
      homeGoals: { predicted: predictedHomeGoals, actual: homeGoals },
      awayGoals: { predicted: predictedAwayGoals, actual: awayGoals },
      probabilities: {
        home: homeProb,
        away: awayProb,
        draw: drawProb
      }
    };
  }

  /**
   * Calculate score prediction accuracy
   */
  calculateScoreAccuracy(predHome, predAway, actHome, actAway) {
    const homeDiff = Math.abs(predHome - actHome);
    const awayDiff = Math.abs(predAway - actAway);
    const totalDiff = homeDiff + awayDiff;
    
    // Perfect prediction = 100%, each goal difference reduces by 20%
    return Math.max(0, 100 - (totalDiff * 20));
  }

  /**
   * Calculate overall accuracy metrics
   */
  calculateOverallAccuracy(matchedData) {
    let homeWinsCorrect = 0, homeWinsTotal = 0;
    let awayWinsCorrect = 0, awayWinsTotal = 0;
    let drawsCorrect = 0, drawsTotal = 0;
    let scoreCorrect = 0, scoreTotal = 0;
    let overallCorrect = 0, overallTotal = 0;
    
    matchedData.forEach(match => {
      const { accuracy } = match;
      
      // Count outcome predictions
      if (accuracy.actualOutcome === 'home') {
        homeWinsTotal++;
        if (accuracy.outcomeCorrect) homeWinsCorrect++;
      } else if (accuracy.actualOutcome === 'away') {
        awayWinsTotal++;
        if (accuracy.outcomeCorrect) awayWinsCorrect++;
      } else if (accuracy.actualOutcome === 'draw') {
        drawsTotal++;
        if (accuracy.outcomeCorrect) drawsCorrect++;
      }
      
      // Count score predictions
      scoreTotal++;
      if (accuracy.scoreAccuracy > 60) scoreCorrect++;
      
      // Count overall accuracy
      overallTotal++;
      if (accuracy.outcomeCorrect) overallCorrect++;
    });
    
    this.accuracyMetrics = {
      homeWins: {
        correct: homeWinsCorrect,
        total: homeWinsTotal,
        accuracy: homeWinsTotal > 0 ? (homeWinsCorrect / homeWinsTotal) * 100 : 0
      },
      awayWins: {
        correct: awayWinsCorrect,
        total: awayWinsTotal,
        accuracy: awayWinsTotal > 0 ? (awayWinsCorrect / awayWinsTotal) * 100 : 0
      },
      draws: {
        correct: drawsCorrect,
        total: drawsTotal,
        accuracy: drawsTotal > 0 ? (drawsCorrect / drawsTotal) * 100 : 0
      },
      scorePredictions: {
        correct: scoreCorrect,
        total: scoreTotal,
        accuracy: scoreTotal > 0 ? (scoreCorrect / scoreTotal) * 100 : 0
      },
      overall: {
        correct: overallCorrect,
        total: overallTotal,
        accuracy: overallTotal > 0 ? (overallCorrect / overallTotal) * 100 : 0
      }
    };
  }

  /**
   * Generate improvement recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Analyze accuracy by outcome type
    if (this.accuracyMetrics.homeWins.accuracy < 50) {
      recommendations.push('Improve home win predictions - consider home advantage factors more carefully');
    }
    
    if (this.accuracyMetrics.awayWins.accuracy < 50) {
      recommendations.push('Improve away win predictions - analyze away team form and motivation');
    }
    
    if (this.accuracyMetrics.draws.accuracy < 30) {
      recommendations.push('Improve draw predictions - draws are often underestimated');
    }
    
    if (this.accuracyMetrics.scorePredictions.accuracy < 40) {
      recommendations.push('Improve score predictions - focus on team goal statistics and form');
    }
    
    if (this.accuracyMetrics.overall.accuracy < 60) {
      recommendations.push('Overall accuracy needs improvement - consider using more data sources and ML algorithms');
    }
    
    return recommendations;
  }

  /**
   * Generate detailed validation report
   */
  async generateValidationReport() {
    try {
      console.log('🔍 Starting prediction validation...');
      
      await this.loadData();
      const matchedData = this.matchPredictionsWithResults();
      
      if (matchedData.length === 0) {
        console.log('❌ No completed matches found to validate predictions');
        return;
      }
      
      this.calculateOverallAccuracy(matchedData);
      const recommendations = this.generateRecommendations();
      
      // Generate report
      const report = {
        summary: {
          totalPredictions: this.predictions.length,
          totalResults: this.actualResults.length,
          matchedPredictions: matchedData.length,
          validationDate: new Date().toISOString()
        },
        accuracyMetrics: this.accuracyMetrics,
        recommendations,
        detailedResults: matchedData.map(match => ({
          match: `${match.prediction.homeTeam} vs ${match.prediction.awayTeam}`,
          predicted: match.accuracy.predictedOutcome,
          actual: match.accuracy.actualOutcome,
          correct: match.accuracy.outcomeCorrect,
          scoreAccuracy: match.accuracy.scoreAccuracy,
          predictedScore: `${match.accuracy.homeGoals.predicted}-${match.accuracy.awayGoals.predicted}`,
          actualScore: `${match.accuracy.homeGoals.actual}-${match.accuracy.awayGoals.actual}`
        }))
      };
      
      // Save validation report
      const outputPath = 'data/validation_report.json';
      await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
      
      // Display results
      console.log('\n📊 Prediction Validation Results:');
      console.log(`✅ Overall Accuracy: ${this.accuracyMetrics.overall.accuracy.toFixed(1)}%`);
      console.log(`🏠 Home Win Accuracy: ${this.accuracyMetrics.homeWins.accuracy.toFixed(1)}%`);
      console.log(`✈️ Away Win Accuracy: ${this.accuracyMetrics.awayWins.accuracy.toFixed(1)}%`);
      console.log(`🤝 Draw Accuracy: ${this.accuracyMetrics.draws.accuracy.toFixed(1)}%`);
      console.log(`⚽ Score Prediction Accuracy: ${this.accuracyMetrics.scorePredictions.accuracy.toFixed(1)}%`);
      
      console.log('\n💡 Recommendations:');
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
      
      console.log(`\n📁 Validation report saved to: ${path.resolve(outputPath)}`);
      
    } catch (error) {
      console.error('❌ Error generating validation report:', error.message);
    }
  }
}

// Run validation
if (require.main === module) {
  const validator = new PredictionValidator();
  validator.generateValidationReport();
}

module.exports = {
  PredictionValidator
}; 