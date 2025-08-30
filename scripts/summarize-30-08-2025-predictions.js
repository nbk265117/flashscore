#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Summarize the enhanced predictions for 30/08/2025
 */
async function summarizePredictions() {
  try {
    const enhancedDataPath = path.join(__dirname, '..', 'data', 'enhanced_matches_2025_08_30.json');
    
    if (!fs.existsSync(enhancedDataPath)) {
      console.log('❌ Enhanced matches file not found');
      return;
    }
    
    console.log('📊 Analyzing enhanced predictions for 30/08/2025...\n');
    
    const data = JSON.parse(fs.readFileSync(enhancedDataPath, 'utf8'));
    const matches = data.matches;
    
    console.log(`📅 Date: ${data.date}`);
    console.log(`🏟️ Total Matches: ${data.totalMatches}`);
    console.log(`🎯 Prediction System: ${data.predictionSystem}`);
    console.log(`📝 Description: ${data.description}\n`);
    
    // Filter matches with enhanced predictions
    const matchesWithPredictions = matches.filter(m => m.enhancedData);
    const matchesWithoutPredictions = matches.filter(m => !m.enhancedData);
    
    console.log(`✅ Matches with predictions: ${matchesWithPredictions.length}`);
    console.log(`❌ Matches without predictions: ${matchesWithoutPredictions.length}\n`);
    
    // League statistics
    const leagueStats = {};
    matchesWithPredictions.forEach(match => {
      const league = match.league;
      if (!leagueStats[league]) {
        leagueStats[league] = {
          count: 0,
          avgHomeWin: 0,
          avgDraw: 0,
          avgAwayWin: 0,
          highConfidenceCount: 0,
          mediumConfidenceCount: 0
        };
      }
      
      leagueStats[league].count++;
      leagueStats[league].avgHomeWin += match.probabilities.homeWin;
      leagueStats[league].avgDraw += match.probabilities.draw;
      leagueStats[league].avgAwayWin += match.probabilities.awayWin;
      
      // Handle string confidence values
      const confidence = match.enhancedData.confidence;
      if (confidence === 'HIGH') {
        leagueStats[league].highConfidenceCount++;
      } else if (confidence === 'MEDIUM') {
        leagueStats[league].mediumConfidenceCount++;
      }
    });
    
    // Calculate averages
    Object.keys(leagueStats).forEach(league => {
      const stats = leagueStats[league];
      stats.avgHomeWin = Math.round(stats.avgHomeWin / stats.count);
      stats.avgDraw = Math.round(stats.avgDraw / stats.count);
      stats.avgAwayWin = Math.round(stats.avgAwayWin / stats.count);
    });
    
    // Sort leagues by match count
    const sortedLeagues = Object.entries(leagueStats)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 20); // Top 20 leagues
    
    console.log('🏆 Top 20 Leagues by Match Count:');
    console.log('='.repeat(90));
    console.log('League'.padEnd(40) + 'Matches'.padEnd(10) + 'Avg Home%'.padEnd(12) + 'Avg Draw%'.padEnd(12) + 'Avg Away%'.padEnd(12) + 'High Conf'.padEnd(12) + 'Med Conf');
    console.log('-'.repeat(90));
    
    sortedLeagues.forEach(([league, stats]) => {
      console.log(
        league.substring(0, 39).padEnd(40) +
        stats.count.toString().padEnd(10) +
        stats.avgHomeWin.toString().padEnd(12) +
        stats.avgDraw.toString().padEnd(12) +
        stats.avgAwayWin.toString().padEnd(12) +
        stats.highConfidenceCount.toString().padEnd(12) +
        stats.mediumConfidenceCount
      );
    });
    
    // Overall statistics
    const totalHomeWin = matchesWithPredictions.reduce((sum, m) => sum + m.probabilities.homeWin, 0);
    const totalDraw = matchesWithPredictions.reduce((sum, m) => sum + m.probabilities.draw, 0);
    const totalAwayWin = matchesWithPredictions.reduce((sum, m) => sum + m.probabilities.awayWin, 0);
    
    const avgHomeWin = Math.round(totalHomeWin / matchesWithPredictions.length);
    const avgDraw = Math.round(totalDraw / matchesWithPredictions.length);
    const avgAwayWin = Math.round(totalAwayWin / matchesWithPredictions.length);
    
    const highConfidenceMatches = matchesWithPredictions.filter(m => m.enhancedData.confidence === 'HIGH');
    const mediumConfidenceMatches = matchesWithPredictions.filter(m => m.enhancedData.confidence === 'MEDIUM');
    
    console.log('\n📈 Overall Statistics:');
    console.log('='.repeat(50));
    console.log(`Average Home Win Probability: ${avgHomeWin}%`);
    console.log(`Average Draw Probability: ${avgDraw}%`);
    console.log(`Average Away Win Probability: ${avgAwayWin}%`);
    console.log(`\nConfidence Distribution:`);
    console.log(`  High Confidence: ${highConfidenceMatches.length} matches`);
    console.log(`  Medium Confidence: ${mediumConfidenceMatches.length} matches`);
    
    // Risk level distribution
    const riskLevels = {};
    matchesWithPredictions.forEach(match => {
      const risk = match.analysis.riskLevel;
      riskLevels[risk] = (riskLevels[risk] || 0) + 1;
    });
    
    console.log(`\nRisk Level Distribution:`);
    Object.entries(riskLevels).forEach(([risk, count]) => {
      console.log(`  ${risk}: ${count} matches`);
    });
    
    // Sample high-confidence predictions
    const highConfidenceSample = highConfidenceMatches.slice(0, 10);
    
    console.log('\n🎯 Top 10 High-Confidence Predictions:');
    console.log('='.repeat(100));
    console.log('Home Team'.padEnd(25) + 'Away Team'.padEnd(25) + 'League'.padEnd(25) + 'Prediction'.padEnd(15) + 'Confidence');
    console.log('-'.repeat(100));
    
    highConfidenceSample.forEach(match => {
      const prediction = match.enhancedData.winner;
      const confidence = match.enhancedData.confidence;
      console.log(
        match.homeTeam.substring(0, 24).padEnd(25) +
        match.awayTeam.substring(0, 24).padEnd(25) +
        match.league.substring(0, 24).padEnd(25) +
        prediction.padEnd(15) +
        confidence
      );
    });
    
    // Show some notable matches
    const notableMatches = matchesWithPredictions.filter(m => 
      m.league.includes('Premier League') || 
      m.league.includes('La Liga') || 
      m.league.includes('Serie A') || 
      m.league.includes('Bundesliga') ||
      m.league.includes('Champions League')
    ).slice(0, 10);
    
    if (notableMatches.length > 0) {
      console.log('\n⭐ Notable Matches (Top Leagues):');
      console.log('='.repeat(100));
      console.log('Home Team'.padEnd(25) + 'Away Team'.padEnd(25) + 'League'.padEnd(25) + 'Score'.padEnd(15) + 'Winner');
      console.log('-'.repeat(100));
      
      notableMatches.forEach(match => {
        const score = match.predictions.likelyScore;
        const winner = match.enhancedData.winner;
        console.log(
          match.homeTeam.substring(0, 24).padEnd(25) +
          match.awayTeam.substring(0, 24).padEnd(25) +
          match.league.substring(0, 24).padEnd(25) +
          score.padEnd(15) +
          winner
        );
      });
    }
    
    console.log('\n✅ Summary completed successfully!');
    console.log(`📁 Data source: ${enhancedDataPath}`);
    console.log(`🔄 View in browser: open public/analysis.html`);
    
  } catch (error) {
    console.error('❌ Error summarizing predictions:', error.message);
  }
}

if (require.main === module) {
  summarizePredictions();
}

module.exports = { summarizePredictions };
