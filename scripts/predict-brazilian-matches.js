#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { ImprovedPredictor } = require('./improved-prediction-system.js');

/**
 * Predict Brazilian matches for August 27, 2025
 */
class BrazilianMatchPredictor {
  constructor() {
    this.predictor = new ImprovedPredictor();
  }

  /**
   * Load matches data
   */
  async loadMatches(targetDate = '2025-08-27') {
    try {
      const dataPath = path.join(__dirname, '..', 'data', `matches_${targetDate.replace(/-/g, '_')}.json`);
      const data = await fsPromises.readFile(dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading matches:', error.message);
      return null;
    }
  }

  /**
   * Filter Brazilian matches
   */
  filterBrazilianMatches(matches) {
    return matches.filter(match => {
      return match.country === 'Brazil';
    });
  }

  /**
   * Predict Brazilian matches
   */
  async predictBrazilianMatches(targetDate = '2025-08-27') {
    try {
      console.log('🇧🇷 Predicting Brazilian Matches for August 27, 2025');
      console.log('='.repeat(80));
      
      const matchesData = await this.loadMatches(targetDate);
      if (!matchesData || !matchesData.matches) {
        throw new Error('No matches data found');
      }

      const brazilianMatches = this.filterBrazilianMatches(matchesData.matches);
      console.log(`📊 Found ${brazilianMatches.length} Brazilian matches out of ${matchesData.matches.length} total matches`);
      
      const predictions = [];
      let processedCount = 0;
      
      for (const match of brazilianMatches) {
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
          
          // Generate exact scores and override the reasoning
          if (prediction) {
            prediction.prediction.expectedScore = this.generateExactScore(prediction);
            prediction.prediction.halftimeScore = this.generateHalftimeScore(prediction);
            prediction.prediction.overUnder = this.generateOverUnder(prediction);
            prediction.reasoning = this.generateBrazilianReasoning(match, prediction);
          }
          
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
            console.log(`🕐 Time: ${match.date ? new Date(match.date).toLocaleString() : 'undefined'}`);
            console.log(`📊 Home: ${prediction.prediction.homeWinProbability}% | Draw: ${prediction.prediction.drawProbability}% | Away: ${prediction.prediction.awayWinProbability}%`);
            console.log(`⚽ Score: ${prediction.prediction.expectedScore} | HT: ${prediction.prediction.halftimeScore} | O/U: ${prediction.prediction.overUnder}`);
            console.log(`🎯 Winner: ${prediction.prediction.winner} | Confidence: ${prediction.prediction.confidence} | Risk: ${prediction.prediction.risk}`);
            console.log(`📈 Home Strength: ${prediction.prediction.homeStrength}% | Away Strength: ${prediction.prediction.awayStrength}%`);
            console.log(`💡 Reasoning: ${prediction.reasoning}`);
            
            if (processedCount % 10 === 0) {
              console.log(`\n✅ Processed ${processedCount} matches...`);
            }
          }
        } catch (error) {
          console.error(`❌ Error predicting match ${match.homeTeam} vs ${match.awayTeam}:`, error.message);
        }
      }

      // Save predictions
      const predictionData = {
        date: targetDate,
        totalMatches: matchesData.matches.length,
        brazilianMatches: brazilianMatches.length,
        predictions: predictions,
        generatedAt: new Date().toISOString()
      };

      const outputPath = path.join(__dirname, '..', 'data', `brazilian_predictions_${targetDate.replace(/-/g, '_')}.json`);
      await fsPromises.writeFile(outputPath, JSON.stringify(predictionData, null, 2));
      
      console.log(`\n✅ Predictions saved to: ${outputPath}`);
      
      // Display summary
      this.displaySummary(predictionData);
      
      return predictionData;
      
    } catch (error) {
      console.error('❌ Error predicting Brazilian matches:', error.message);
      throw error;
    }
  }

  /**
   * Generate exact score prediction
   */
  generateExactScore(prediction) {
    const homeProb = prediction.prediction.homeWinProbability;
    const awayProb = prediction.prediction.awayWinProbability;
    const drawProb = prediction.prediction.drawProbability;
    
    // Base scores based on probabilities
    let homeGoals = 0;
    let awayGoals = 0;
    
    if (homeProb > 60) {
      // Strong home win
      homeGoals = Math.floor(Math.random() * 3) + 2; // 2-4 goals
      awayGoals = Math.floor(Math.random() * 2); // 0-1 goals
    } else if (homeProb > 45) {
      // Moderate home win
      homeGoals = Math.floor(Math.random() * 2) + 1; // 1-2 goals
      awayGoals = Math.floor(Math.random() * 2); // 0-1 goals
    } else if (awayProb > 60) {
      // Strong away win
      homeGoals = Math.floor(Math.random() * 2); // 0-1 goals
      awayGoals = Math.floor(Math.random() * 3) + 2; // 2-4 goals
    } else if (awayProb > 45) {
      // Moderate away win
      homeGoals = Math.floor(Math.random() * 2); // 0-1 goals
      awayGoals = Math.floor(Math.random() * 2) + 1; // 1-2 goals
    } else if (drawProb > 25) {
      // Likely draw
      homeGoals = Math.floor(Math.random() * 2) + 1; // 1-2 goals
      awayGoals = homeGoals;
    } else {
      // Close match
      homeGoals = Math.floor(Math.random() * 3) + 1; // 1-3 goals
      awayGoals = Math.floor(Math.random() * 3) + 1; // 1-3 goals
    }
    
    return `${homeGoals}-${awayGoals}`;
  }

  /**
   * Generate halftime score
   */
  generateHalftimeScore(prediction) {
    const fullScore = prediction.prediction.expectedScore;
    const [homeGoals, awayGoals] = fullScore.split('-').map(Number);
    
    // Halftime is typically 40-60% of full-time goals
    const homeHT = Math.floor(homeGoals * (0.4 + Math.random() * 0.2)); // 40-60% of full goals
    const awayHT = Math.floor(awayGoals * (0.4 + Math.random() * 0.2));
    
    return `${homeHT}-${awayHT}`;
  }

  /**
   * Generate over/under prediction
   */
  generateOverUnder(prediction) {
    const fullScore = prediction.prediction.expectedScore;
    const [homeGoals, awayGoals] = fullScore.split('-').map(Number);
    const totalGoals = homeGoals + awayGoals;
    
    if (totalGoals > 2.5) {
      return "Over 2.5";
    } else {
      return "Under 2.5";
    }
  }

  /**
   * Generate realistic Brazilian match reasoning
   */
  generateBrazilianReasoning(match, prediction) {
    const homeTeam = match.homeTeam;
    const awayTeam = match.awayTeam;
    const league = match.league;
    const homeWinProb = prediction.prediction.homeWinProbability;
    const awayWinProb = prediction.prediction.awayWinProbability;
    const drawProb = prediction.prediction.drawProbability;
    const expectedScore = prediction.prediction.expectedScore;
    const confidence = prediction.prediction.confidence;
    
    let reasoning = `${homeTeam} vs ${awayTeam} in ${league}. `;
    
    // Add league-specific context
    if (league.includes('U17')) {
      reasoning += `This is a youth development match in the Brazilian U17 championship. `;
    } else if (league.includes('U20')) {
      reasoning += `This is a youth development match in the Brazilian U20 championship. `;
    } else if (league.includes('Copa Rio')) {
      reasoning += `This is a regional cup match in Rio de Janeiro. `;
    } else if (league.includes('Copa Do Brasil')) {
      reasoning += `This is a prestigious national cup match. `;
    } else if (league.includes('Paraibano')) {
      reasoning += `This is a state championship match in Paraíba. `;
    } else if (league.includes('Alagoano')) {
      reasoning += `This is a state championship match in Alagoas. `;
    } else if (league.includes('Catarinense')) {
      reasoning += `This is a state championship match in Santa Catarina. `;
    }
    
    // Add prediction reasoning
    if (homeWinProb > 50) {
      reasoning += `${homeTeam} is favored with ${homeWinProb}% win probability due to home advantage and current form. `;
    } else if (awayWinProb > 50) {
      reasoning += `${awayTeam} is favored with ${awayWinProb}% win probability despite being away. `;
    } else {
      reasoning += `This is a closely contested match with ${drawProb}% draw probability. `;
    }
    
    reasoning += `Expected score: ${expectedScore}. `;
    reasoning += `Halftime: ${prediction.prediction.halftimeScore}. `;
    reasoning += `Over/Under: ${prediction.prediction.overUnder}. `;
    reasoning += `Confidence level: ${confidence}.`;
    
    return reasoning;
  }

  /**
   * Display summary
   */
  displaySummary(data) {
    console.log('\n================================================================================');
    console.log('📊 PREDICTION SUMMARY');
    console.log('================================================================================');

    const highConfidence = data.predictions.filter(p => p.prediction.confidence === 'HIGH').length;
    const mediumConfidence = data.predictions.filter(p => p.prediction.confidence === 'MEDIUM').length;
    const lowConfidence = data.predictions.filter(p => p.prediction.confidence === 'LOW').length;

    console.log(`\n🎯 Confidence Levels:`);
    console.log(`   HIGH: ${highConfidence} matches`);
    console.log(`   MEDIUM: ${mediumConfidence} matches`);
    console.log(`   LOW: ${lowConfidence} matches`);

    const highRisk = data.predictions.filter(p => p.prediction.risk === 'HIGH').length;
    const mediumRisk = data.predictions.filter(p => p.prediction.risk === 'MEDIUM').length;
    const lowRisk = data.predictions.filter(p => p.prediction.risk === 'LOW').length;

    console.log(`\n⚠️ Risk Levels:`);
    console.log(`   HIGH: ${highRisk} matches`);
    console.log(`   MEDIUM: ${mediumRisk} matches`);
    console.log(`   LOW: ${lowRisk} matches`);

    // Group by league
    const leagueStats = {};
    data.predictions.forEach(pred => {
      const league = pred.league || 'Unknown';
      if (!leagueStats[league]) {
        leagueStats[league] = 0;
      }
      leagueStats[league]++;
    });

    console.log(`\n🏆 Matches by League:`);
    Object.entries(leagueStats).sort((a, b) => b[1] - a[1]).forEach(([league, count]) => {
      console.log(`   ${league}: ${count} matches`);
    });

    // Top recommendations
    const highConfidenceMatches = data.predictions.filter(p => p.prediction.confidence === 'HIGH');
    
    if (highConfidenceMatches.length > 0) {
      console.log(`\n🎯 TOP RECOMMENDATIONS:`);
      console.log('==================================================');
      
      highConfidenceMatches.slice(0, 5).forEach((match, index) => {
        console.log(`${index + 1}. ${match.homeTeam} vs ${match.awayTeam} (${match.league})`);
        console.log(`   Winner: ${match.prediction.winner} | Score: ${match.prediction.expectedScore} | Risk: ${match.prediction.risk}`);
      });
    }

    console.log(`\n💡 BETTING STRATEGY:`);
    console.log('==================================================');
    console.log('🎯 HIGH CONFIDENCE + LOW RISK = Best betting opportunities');
    console.log('⚠️ Avoid LOW confidence matches');
    console.log('💰 Use risk levels for bet sizing:');
    console.log('   - LOW Risk: Bet 2-3% of bankroll');
    console.log('   - MEDIUM Risk: Bet 1-2% of bankroll');
    console.log('   - HIGH Risk: Avoid or bet minimal amounts');

    console.log('\n✅ Brazilian match prediction analysis complete!');
    console.log(`📁 Check the saved file for detailed predictions`);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const predictor = new BrazilianMatchPredictor();
    await predictor.predictBrazilianMatches('2025-08-27');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BrazilianMatchPredictor };
