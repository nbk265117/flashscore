#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

/**
 * Data Integrity Checker - Validates analysis data structure and logic
 */
class DataIntegrityChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalMatches: 0,
      validMatches: 0,
      invalidMatches: 0,
      riskLevels: {},
      probabilityRanges: {}
    };
  }

  /**
   * Load and validate analysis data
   */
  async validateAnalysisData() {
    try {
      console.log('🔍 Starting data integrity validation...');
      
      // Load analysis data
      const analysisData = await fs.readFile('data/analysis_2025_08_08T00:00:00+00:00.json', 'utf8');
      const analysis = JSON.parse(analysisData);
      
      console.log(`📊 Validating ${analysis.analyses.length} matches...`);
      
      this.stats.totalMatches = analysis.analyses.length;
      
      // Validate each match
      analysis.analyses.forEach((match, index) => {
        this.validateMatch(match, index);
      });
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Error validating data:', error.message);
    }
  }

  /**
   * Validate a single match
   */
  validateMatch(match, index) {
    const matchId = `${(match.match && match.match.homeTeam) || 'Unknown'} vs ${(match.match && match.match.awayTeam) || 'Unknown'}`;
    
    // Check required fields
    this.checkRequiredFields(match, index, matchId);
    
    // Check probability logic
    this.checkProbabilityLogic(match, index, matchId);
    
    // Check risk level logic
    this.checkRiskLevelLogic(match, index, matchId);
    
    // Check score predictions
    this.checkScorePredictions(match, index, matchId);
    
    // Update stats
    if (this.errors.length === 0) {
      this.stats.validMatches++;
    } else {
      this.stats.invalidMatches++;
    }
    
    // Count risk levels
    const riskLevel = (match.analysis && match.analysis.riskLevel);
    if (riskLevel) {
      this.stats.riskLevels[riskLevel] = (this.stats.riskLevels[riskLevel] || 0) + 1;
    }
  }

  /**
   * Check required fields
   */
  checkRequiredFields(match, index, matchId) {
    const requiredFields = [
      'homeTeam', 'awayTeam', 'league', 'country', 'matchTime',
      'analysis.homeWinProbability', 'analysis.awayWinProbability', 
      'analysis.drawProbability', 'analysis.riskLevel'
    ];
    
    requiredFields.forEach(field => {
      const value = this.getNestedValue(match, field);
      if (value === undefined || value === null || value === '') {
        this.errors.push(`Match ${index + 1} (${matchId}): Missing required field '${field}'`);
      }
    });
  }

  /**
   * Check probability logic
   */
  checkProbabilityLogic(match, index, matchId) {
    const homeProb = (match.analysis && match.analysis.homeWinProbability);
    const awayProb = (match.analysis && match.analysis.awayWinProbability);
    const drawProb = (match.analysis && match.analysis.drawProbability);
    
    if (homeProb !== undefined && awayProb !== undefined && drawProb !== undefined) {
      const total = homeProb + awayProb + drawProb;
      
      // Check if probabilities sum to approximately 100%
      if (Math.abs(total - 100) > 5) {
        this.warnings.push(`Match ${index + 1} (${matchId}): Probabilities sum to ${total}% (should be ~100%)`);
      }
      
      // Check probability ranges
      [homeProb, awayProb, drawProb].forEach(prob => {
        if (prob < 0 || prob > 100) {
          this.errors.push(`Match ${index + 1} (${matchId}): Invalid probability ${prob}% (should be 0-100)`);
        }
      });
      
      // Track probability ranges
      const maxProb = Math.max(homeProb, awayProb, drawProb);
      if (maxProb <= 35) {
        this.stats.probabilityRanges['≤35%'] = (this.stats.probabilityRanges['≤35%'] || 0) + 1;
      } else if (maxProb <= 55) {
        this.stats.probabilityRanges['35-55%'] = (this.stats.probabilityRanges['35-55%'] || 0) + 1;
      } else {
        this.stats.probabilityRanges['>55%'] = (this.stats.probabilityRanges['>55%'] || 0) + 1;
      }
    }
  }

  /**
   * Check risk level logic
   */
  checkRiskLevelLogic(match, index, matchId) {
    const homeProb = (match.analysis && match.analysis.homeWinProbability);
    const riskLevel = (match.analysis && match.analysis.riskLevel);
    
    if (homeProb !== undefined && riskLevel) {
      let expectedRiskLevel;
      
      if (homeProb > 55) {
        expectedRiskLevel = 'LOW';
      } else if (homeProb > 35) {
        expectedRiskLevel = 'MEDIUM';
      } else {
        expectedRiskLevel = 'HIGH';
      }
      
      if (riskLevel !== expectedRiskLevel) {
        this.errors.push(`Match ${index + 1} (${matchId}): Risk level mismatch - got '${riskLevel}', expected '${expectedRiskLevel}' (home prob: ${homeProb}%)`);
      }
    }
  }

  /**
   * Check score predictions
   */
  checkScorePredictions(match, index, matchId) {
    const predictions = match.predictions;
    
    if (predictions) {
      // Check likely score format
      if (predictions.likelyScore && !/^\d+-\d+$/.test(predictions.likelyScore)) {
        this.warnings.push(`Match ${index + 1} (${matchId}): Invalid score format '${predictions.likelyScore}'`);
      }
      
      // Check halftime result format
      if (predictions.halftimeResult && !/^\d+-\d+$/.test(predictions.halftimeResult)) {
        this.warnings.push(`Match ${index + 1} (${matchId}): Invalid halftime format '${predictions.halftimeResult}'`);
      }
      
      // Check numeric predictions
      const numericFields = ['totalCorners', 'yellowCards', 'redCards', 'homeTeamSubs', 'awayTeamSubs'];
      numericFields.forEach(field => {
        if (predictions[field] !== undefined && (isNaN(predictions[field]) || predictions[field] < 0)) {
          this.warnings.push(`Match ${index + 1} (${matchId}): Invalid ${field} value: ${predictions[field]}`);
        }
      });
    }
  }

  /**
   * Get nested object value
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  /**
   * Generate validation report
   */
  generateReport() {
    console.log('\n📋 Data Integrity Report');
    console.log('=' .repeat(50));
    
    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`- Total matches: ${this.stats.totalMatches}`);
    console.log(`- Valid matches: ${this.stats.validMatches}`);
    console.log(`- Invalid matches: ${this.stats.invalidMatches}`);
    console.log(`- Success rate: ${((this.stats.validMatches / this.stats.totalMatches) * 100).toFixed(1)}%`);
    
    // Risk level distribution
    console.log(`\n🎯 Risk Level Distribution:`);
    Object.entries(this.stats.riskLevels).forEach(([level, count]) => {
      const percentage = ((count / this.stats.totalMatches) * 100).toFixed(1);
      console.log(`- ${level}: ${count} matches (${percentage}%)`);
    });
    
    // Probability ranges
    console.log(`\n📈 Probability Ranges:`);
    Object.entries(this.stats.probabilityRanges).forEach(([range, count]) => {
      const percentage = ((count / this.stats.totalMatches) * 100).toFixed(1);
      console.log(`- ${range}: ${count} matches (${percentage}%)`);
    });
    
    // Errors
    if (this.errors.length > 0) {
      console.log(`\n❌ Errors (${this.errors.length}):`);
      this.errors.slice(0, 10).forEach(error => console.log(`- ${error}`));
      if (this.errors.length > 10) {
        console.log(`- ... and ${this.errors.length - 10} more errors`);
      }
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.slice(0, 10).forEach(warning => console.log(`- ${warning}`));
      if (this.warnings.length > 10) {
        console.log(`- ... and ${this.warnings.length - 10} more warnings`);
      }
    }
    
    // Overall assessment
    console.log(`\n🎯 Overall Assessment:`);
    if (this.errors.length === 0) {
      console.log('✅ Data integrity is good - no critical errors found');
    } else {
      console.log('❌ Data integrity issues found - review errors above');
    }
    
    if (this.warnings.length > 0) {
      console.log('⚠️  Some warnings detected - consider reviewing');
    } else {
      console.log('✅ No warnings detected');
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Run the validator
async function main() {
  const validator = new DataIntegrityChecker();
  await validator.validateAnalysisData();
}

if (require.main === module) {
  main();
}

module.exports = { DataIntegrityChecker }; 