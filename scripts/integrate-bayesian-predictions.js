#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { BayesianPredictor } = require('./enhanced-bayesian-prediction.js');

/**
 * Integrate Bayesian predictions with existing match data
 */
class BayesianIntegration {
  constructor() {
    this.predictor = new BayesianPredictor();
  }

  /**
   * Load existing analysis data
   */
  async loadAnalysisData() {
    try {
      const analysisPath = path.join(__dirname, '..', 'data', 'analysis.json');
      const data = await fsPromises.readFile(analysisPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading analysis data:', error.message);
      return null;
    }
  }

  /**
   * Load matches data
   */
  async loadMatchesData() {
    try {
      const matchesPath = path.join(__dirname, '..', 'data', 'matches_2025_08_14.json');
      const data = await fsPromises.readFile(matchesPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading matches data:', error.message);
      return null;
    }
  }

  /**
   * Generate historical data for teams (mock data for demonstration)
   */
  generateHistoricalData(homeTeam, awayTeam) {
    // In a real implementation, this would come from a database
    // For now, we'll generate some mock historical data
    const historicalData = [];
    
    // Generate 3-5 historical matches
    const numMatches = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < numMatches; i++) {
      const homeGoals = Math.floor(Math.random() * 4);
      const awayGoals = Math.floor(Math.random() * 4);
      
      historicalData.push({
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        homeGoals: homeGoals,
        awayGoals: awayGoals,
        date: new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString() // Random past dates
      });
    }
    
    return historicalData;
  }

  /**
   * Convert match data to Bayesian format
   */
  convertMatchToBayesianFormat(match) {
    return {
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      league: match.league,
      country: match.country,
      date: match.date,
      venue: match.venue,
      city: match.city,
      historicalData: this.generateHistoricalData(match.homeTeam, match.awayTeam)
    };
  }

  /**
   * Apply Bayesian predictions to analysis data
   */
  async applyBayesianPredictions() {
    try {
      console.log('🔄 Loading existing data...');
      
      // Load existing data
      const analysisData = await this.loadAnalysisData();
      const matchesData = await this.loadMatchesData();
      
      if (!analysisData || !matchesData) {
        throw new Error('Failed to load data');
      }

      console.log(`📊 Found ${analysisData.analyses.length} matches to analyze`);
      
      // Process each match with Bayesian predictions
      const updatedAnalyses = [];
      let processedCount = 0;
      
      for (const analysis of analysisData.analyses) {
        try {
          // Convert to Bayesian format
          const bayesianMatch = this.convertMatchToBayesianFormat(analysis);
          
          // Get Bayesian prediction
          const bayesianPrediction = this.predictor.predictMatch(bayesianMatch);
          
          if (bayesianPrediction) {
            // Update analysis with Bayesian predictions
            const updatedAnalysis = {
              ...analysis,
              // Update probabilities with Bayesian results
              homeWinProbability: bayesianPrediction.prediction.homeWinProbability,
              drawProbability: bayesianPrediction.prediction.drawProbability,
              awayWinProbability: bayesianPrediction.prediction.awayWinProbability,
              
              // Update score predictions
              likelyScore: bayesianPrediction.prediction.likelyScore,
              halftimeResult: bayesianPrediction.prediction.halftimeResult,
              overUnder: bayesianPrediction.prediction.overUnder2_5,
              
              // Update other fields
              winner: bayesianPrediction.prediction.winner,
              confidence: bayesianPrediction.prediction.confidence,
              riskLevel: bayesianPrediction.prediction.riskLevel,
              
              // Add Bayesian analysis
              analysis: `Bayesian Analysis: ${bayesianPrediction.reasoning}`,
              keyFactors: [
                `Home Team Strength: ${bayesianPrediction.analysis.homeStrength}%`,
                `Away Team Strength: ${bayesianPrediction.analysis.awayStrength}%`,
                `Head-to-Head Advantage: ${bayesianPrediction.analysis.headToHeadAdvantage}%`,
                `Data Quality: ${bayesianPrediction.analysis.dataQuality}%`,
                `League Strength: ${bayesianPrediction.analysis.leagueStrength}`
              ],
              reasoning: bayesianPrediction.reasoning,
              
              // Add Bayesian metadata
              bayesianAnalysis: {
                homeStrength: bayesianPrediction.analysis.homeStrength,
                awayStrength: bayesianPrediction.analysis.awayStrength,
                headToHeadAdvantage: bayesianPrediction.analysis.headToHeadAdvantage,
                leagueStrength: bayesianPrediction.analysis.leagueStrength,
                dataQuality: bayesianPrediction.analysis.dataQuality,
                goalExpectations: bayesianPrediction.analysis.goalExpectations,
                confidence: bayesianPrediction.prediction.confidence
              }
            };
            
            updatedAnalyses.push(updatedAnalysis);
            processedCount++;
            
            if (processedCount % 50 === 0) {
              console.log(`✅ Processed ${processedCount}/${analysisData.analyses.length} matches`);
            }
          } else {
            // Keep original analysis if Bayesian prediction fails
            updatedAnalyses.push(analysis);
          }
          
        } catch (error) {
          console.error(`Error processing match ${analysis.homeTeam} vs ${analysis.awayTeam}:`, error.message);
          // Keep original analysis
          updatedAnalyses.push(analysis);
        }
      }
      
      // Create updated analysis data
      const updatedAnalysisData = {
        ...analysisData,
        analyses: updatedAnalyses,
        analysisType: 'BAYESIAN_ENHANCED',
        description: `${analysisData.description} - Enhanced with Bayesian modeling`,
        bayesianInfo: {
          totalMatches: updatedAnalyses.length,
          processedMatches: processedCount,
          predictionMethod: 'Bayesian Inference with Poisson Distribution',
          confidenceLevels: {
            high: updatedAnalyses.filter(a => a.confidence === 'HIGH').length,
            medium: updatedAnalyses.filter(a => a.confidence === 'MEDIUM').length,
            low: updatedAnalyses.filter(a => a.confidence === 'LOW').length
          },
          riskLevels: {
            low: updatedAnalyses.filter(a => a.riskLevel === 'LOW').length,
            medium: updatedAnalyses.filter(a => a.riskLevel === 'MEDIUM').length,
            high: updatedAnalyses.filter(a => a.riskLevel === 'HIGH').length
          }
        }
      };
      
      // Save updated analysis
      const outputPath = path.join(__dirname, '..', 'data', 'analysis.json');
      await fsPromises.writeFile(outputPath, JSON.stringify(updatedAnalysisData, null, 2));
      
      console.log('\n✅ Bayesian predictions applied successfully!');
      console.log(`📊 Updated analysis saved to: ${outputPath}`);
      console.log(`📈 Total matches processed: ${processedCount}`);
      console.log(`🎯 Confidence levels: HIGH: ${updatedAnalysisData.bayesianInfo.confidenceLevels.high}, MEDIUM: ${updatedAnalysisData.bayesianInfo.confidenceLevels.medium}, LOW: ${updatedAnalysisData.bayesianInfo.confidenceLevels.low}`);
      console.log(`⚠️ Risk levels: LOW: ${updatedAnalysisData.bayesianInfo.riskLevels.low}, MEDIUM: ${updatedAnalysisData.bayesianInfo.riskLevels.medium}, HIGH: ${updatedAnalysisData.bayesianInfo.riskLevels.high}`);
      
      return updatedAnalysisData;
      
    } catch (error) {
      console.error('❌ Error applying Bayesian predictions:', error.message);
      throw error;
    }
  }

  /**
   * Generate sample predictions for demonstration
   */
  async generateSamplePredictions() {
    try {
      console.log('🎯 Generating sample Bayesian predictions...');
      
      const sampleMatches = [
        {
          homeTeam: 'Vasco DA Gama',
          awayTeam: 'Atletico-MG',
          league: 'Serie A (Brazil)',
          date: '2025-08-10'
        },
        {
          homeTeam: 'Palmeiras',
          awayTeam: 'Ceara',
          league: 'Serie A (Brazil)',
          date: '2025-08-10'
        },
        {
          homeTeam: 'FC Cincinnati',
          awayTeam: 'Charlotte',
          league: 'Major League Soccer',
          date: '2025-08-10'
        }
      ];
      
      console.log('\n📊 Sample Bayesian Predictions:');
      console.log('='.repeat(60));
      
      for (const match of sampleMatches) {
        const bayesianMatch = this.convertMatchToBayesianFormat(match);
        const prediction = this.predictor.predictMatch(bayesianMatch);
        
        if (prediction) {
          console.log(`\n🏟️ ${match.homeTeam} vs ${match.awayTeam}`);
          console.log(`🏆 League: ${match.league}`);
          console.log(`📊 Home Win: ${prediction.prediction.homeWinProbability}% | Draw: ${prediction.prediction.drawProbability}% | Away Win: ${prediction.prediction.awayWinProbability}%`);
          console.log(`⚽ Score: ${prediction.prediction.likelyScore} | HT: ${prediction.prediction.halftimeResult} | O/U: ${prediction.prediction.overUnder2_5}`);
          console.log(`🎯 Winner: ${prediction.prediction.winner} | Confidence: ${prediction.prediction.confidence} | Risk: ${prediction.prediction.riskLevel}`);
          console.log(`📈 Home Strength: ${prediction.analysis.homeStrength}% | Away Strength: ${prediction.analysis.awayStrength}% | Data Quality: ${prediction.analysis.dataQuality}%`);
        }
      }
      
    } catch (error) {
      console.error('Error generating sample predictions:', error.message);
    }
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🎯 Bayesian Prediction Integration System');
    console.log('='.repeat(60));
    
    const integration = new BayesianIntegration();
    
    // Generate sample predictions first
    await integration.generateSamplePredictions();
    
    console.log('\n🔄 Starting full integration...');
    
    // Apply Bayesian predictions to all matches
    const result = await integration.applyBayesianPredictions();
    
    console.log('\n✅ Integration completed successfully!');
    console.log('🌐 View updated predictions at: http://localhost:3000/analysis.html');
    
  } catch (error) {
    console.error('❌ Integration failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BayesianIntegration };
