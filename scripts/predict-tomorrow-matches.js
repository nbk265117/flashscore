#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { ImprovedPredictor } = require('./improved-prediction-system.js');

/**
 * Predict tomorrow's matches using the improved prediction system
 */
class TomorrowPredictor {
  constructor() {
    this.predictor = new ImprovedPredictor();
  }

  /**
   * Load tomorrow's matches
   */
  async loadTomorrowMatches(targetDate = '2025-08-22') {
    try {
      const dataPath = path.join(__dirname, '..', 'data', `matches_${targetDate.replace(/-/g, '_')}.json`);
      const data = await fsPromises.readFile(dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading tomorrow matches:', error.message);
      return null;
    }
  }

  /**
   * Filter important matches
   */
  filterImportantMatches(matches) {
    const importantLeagues = [
      'Premier League',
      'La Liga',
      'Bundesliga',
      'Serie A',
      'Ligue 1',
      'Champions League',
      'Europa League',
      'Eredivisie',
      'Primeira Liga',
      'Superliga',
      'Ekstraklasa',
      'Süper Lig',
      'Liga I',
      'NB I',
      '1. SNL',
      'First League',
      'Liga Profesional Argentina',
      'Primera A',
      'Serie A (Brazil)',
      'Liga MX'
    ];

    const importantTeams = [
      'Liverpool', 'Bournemouth', 'Celtic', 'Falkirk',
      'Rennes', 'Marseille', 'Villarreal', 'Oviedo',
      'Girona', 'Rayo Vallecano', 'Galatasaray', 'Fatih Karagümrük',
      'Arminia Bielefeld', 'Werder Bremen', 'OH Leuven', 'Genk',
      'Cracovia Krakow', 'Widzew Łódź', 'Dinamo Bucuresti', 'Uta Arad',
      'Ujpest', 'Kisvarda FC', 'Radomlje', 'Primorje',
      'Lokomotiv Plovdiv', 'Slavia Sofia', 'Aldosivi', 'Belgrano Cordoba',
      'Alianza Petrolera', 'Once Caldas', 'Instituto Cordoba', 'Union Santa Fe',
      'Boston River', 'Penarol', 'Amazonas', 'America Mineiro'
    ];

    return matches.filter(match => {
      const isImportantLeague = importantLeagues.some(league => 
        match.league && match.league.includes(league)
      );
      
      const isImportantTeam = importantTeams.some(team => 
        (match.homeTeam && match.homeTeam.includes(team)) ||
        (match.awayTeam && match.awayTeam.includes(team))
      );

      return isImportantLeague || isImportantTeam;
    });
  }

  /**
   * Predict matches
   */
  async predictImportantMatches(targetDate = '2025-08-23') {
    try {
      console.log('🎯 Predicting Tomorrow\'s Important Matches');
      console.log('='.repeat(80));
      
      const matchesData = await this.loadTomorrowMatches(targetDate);
      if (!matchesData || !matchesData.matches) {
        throw new Error('No matches data found');
      }

      const importantMatches = this.filterImportantMatches(matchesData.matches);
      console.log(`📊 Found ${importantMatches.length} important matches out of ${matchesData.matches.length} total matches`);
      
      const predictions = [];
      let processedCount = 0;
      
      for (const match of importantMatches) {
        try {
          const matchData = {
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            league: match.league,
            date: match.date,
            time: match.time,
            venue: match.venue
          };
          
          const prediction = this.predictor.predictMatch(matchData);
          
          if (prediction) {
            predictions.push({
              ...match,
              prediction: prediction.prediction,
              analysis: prediction.analysis,
              reasoning: prediction.reasoning,
              keyFactors: prediction.keyFactors
            });
            
            processedCount++;
            
            // Display prediction
            console.log(`\n🏟️ ${match.homeTeam} vs ${match.awayTeam}`);
            console.log(`🏆 League: ${match.league}`);
            console.log(`🕐 Time: ${match.time}`);
            console.log(`📊 Home: ${prediction.prediction.homeWinProbability}% | Draw: ${prediction.prediction.drawProbability}% | Away: ${prediction.prediction.awayWinProbability}%`);
            console.log(`⚽ Score: ${prediction.prediction.likelyScore} | HT: ${prediction.prediction.halftimeResult} | O/U: ${prediction.prediction.overUnder2_5}`);
            console.log(`🎯 Winner: ${prediction.prediction.winner} | Confidence: ${prediction.prediction.confidence} | Risk: ${prediction.prediction.riskLevel}`);
            console.log(`📈 Home Strength: ${prediction.analysis.homeStrength}% | Away Strength: ${prediction.analysis.awayStrength}%`);
            console.log(`💡 Reasoning: ${prediction.reasoning}`);
            
            if (processedCount % 10 === 0) {
              console.log(`\n✅ Processed ${processedCount} matches...`);
            }
          }
          
        } catch (error) {
          console.error(`❌ Error predicting ${match.homeTeam} vs ${match.awayTeam}:`, error.message);
        }
      }
      
      // Save predictions
      await this.savePredictions(predictions, targetDate, matchesData.matches.length);
      
      // Display summary
      this.displaySummary(predictions);
      
      return predictions;
      
    } catch (error) {
      console.error('❌ Error predicting matches:', error.message);
      return [];
    }
  }

  /**
   * Save predictions to file
   */
  async savePredictions(predictions, targetDate = '2025-08-23', totalOriginalMatches = 1440) {
    try {
      const dateStr = targetDate.replace(/-/g, '_');
      const outputPath = path.join(__dirname, '..', 'data', `tomorrow_predictions_${dateStr}.json`);
      const data = {
        date: targetDate,
        totalMatches: totalOriginalMatches,
        predictions: predictions
      };
      
      await fsPromises.writeFile(outputPath, JSON.stringify(data, null, 2));
      console.log(`\n✅ Predictions saved to: ${outputPath}`);
      
    } catch (error) {
      console.error('Error saving predictions:', error.message);
    }
  }

  /**
   * Display prediction summary
   */
  displaySummary(predictions) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PREDICTION SUMMARY');
    console.log('='.repeat(80));
    
    // Count by confidence level
    const confidenceCounts = predictions.reduce((acc, pred) => {
      const confidence = pred.prediction.confidence;
      acc[confidence] = (acc[confidence] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n🎯 Confidence Levels:');
    Object.entries(confidenceCounts).forEach(([level, count]) => {
      console.log(`   ${level}: ${count} matches`);
    });
    
    // Count by risk level
    const riskCounts = predictions.reduce((acc, pred) => {
      const risk = pred.prediction.riskLevel;
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n⚠️ Risk Levels:');
    Object.entries(riskCounts).forEach(([level, count]) => {
      console.log(`   ${level}: ${count} matches`);
    });
    
    // Top recommendations
    const highConfidenceMatches = predictions.filter(p => p.prediction.confidence === 'HIGH');
    const lowRiskMatches = predictions.filter(p => p.prediction.riskLevel === 'LOW');
    
    console.log('\n🎯 TOP RECOMMENDATIONS:');
    console.log('='.repeat(50));
    
    if (highConfidenceMatches.length > 0) {
      console.log('\n🔥 HIGH CONFIDENCE MATCHES:');
      highConfidenceMatches.slice(0, 5).forEach((match, index) => {
        console.log(`${index + 1}. ${match.homeTeam} vs ${match.awayTeam} (${match.league})`);
        console.log(`   Winner: ${match.prediction.winner} | Score: ${match.prediction.likelyScore} | Risk: ${match.prediction.riskLevel}`);
      });
    }
    
    if (lowRiskMatches.length > 0) {
      console.log('\n🛡️ LOW RISK MATCHES:');
      lowRiskMatches.slice(0, 5).forEach((match, index) => {
        console.log(`${index + 1}. ${match.homeTeam} vs ${match.awayTeam} (${match.league})`);
        console.log(`   Winner: ${match.prediction.winner} | Score: ${match.prediction.likelyScore} | Confidence: ${match.prediction.confidence}`);
      });
    }
    
    // Betting strategy
    console.log('\n💡 BETTING STRATEGY:');
    console.log('='.repeat(50));
    console.log('🎯 HIGH CONFIDENCE + LOW RISK = Best betting opportunities');
    console.log('⚠️ Avoid LOW confidence matches');
    console.log('💰 Use risk levels for bet sizing:');
    console.log('   - LOW Risk: Bet 2-3% of bankroll');
    console.log('   - MEDIUM Risk: Bet 1-2% of bankroll');
    console.log('   - HIGH Risk: Avoid or bet minimal amounts');
    
    console.log('\n✅ Prediction analysis complete!');
    console.log('📁 Check the saved file for detailed predictions');
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const targetDate = process.argv[2] || '2025-08-23';
    console.log(`📅 Processing predictions for date: ${targetDate}`);
    
    const predictor = new TomorrowPredictor();
    await predictor.predictImportantMatches(targetDate);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { TomorrowPredictor };
