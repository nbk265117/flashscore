#!/usr/bin/env node

require('dotenv').config();
const { RealPredictionSystem } = require('./real-prediction-system.js');
const { RiskManagementSystem } = require('./risk-management.js');
const fs = require('fs');
const path = require('path');

/**
 * Script de Test du Système de Prédiction Réel
 * Valide la précision avec des données réelles
 */

class PredictionTester {
  constructor() {
    this.realPredictor = new RealPredictionSystem();
    this.riskManager = new RiskManagementSystem();
    this.testResults = [];
  }

  /**
   * Tester avec des matchs récents pour valider la précision
   */
  async testWithRecentMatches() {
    console.log('🧪 Test du Système de Prédiction Réel');
    console.log('=====================================');

    // Charger les matchs récents
    const recentMatches = await this.loadRecentMatches();
    
    if (!recentMatches || recentMatches.length === 0) {
      console.log('❌ Aucun match récent trouvé pour les tests');
      return;
    }

    console.log(`📊 Test avec ${recentMatches.length} matchs récents`);

    // Tester chaque match
    for (const match of recentMatches.slice(0, 10)) { // Limiter à 10 matchs pour le test
      console.log(`\n🔍 Test: ${match.homeTeam} vs ${match.awayTeam}`);
      
      try {
        const prediction = await this.realPredictor.predictMatchWithRealData(match);
        const riskAnalysis = this.riskManager.calculateRiskScore(prediction);
        const confidenceAnalysis = this.riskManager.calculateConfidenceScore(prediction);
        
        console.log(`   Prédiction: ${prediction.prediction.winner} (${prediction.prediction.homeWinProbability}%-${prediction.prediction.awayWinProbability}%-${prediction.prediction.drawProbability}%)`);
        console.log(`   Score attendu: ${prediction.prediction.expectedScore}`);
        console.log(`   Confiance: ${prediction.prediction.confidence} (${Math.round(confidenceAnalysis * 100)}%)`);
        console.log(`   Risque: ${prediction.prediction.risk} (${Math.round(riskAnalysis * 100)}%)`);
        
        this.testResults.push({
          match,
          prediction,
          riskScore: riskAnalysis,
          confidenceScore: confidenceAnalysis,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
      }
    }

    // Analyser les résultats
    this.analyzeTestResults();
  }

  /**
   * Charger les matchs récents pour les tests
   */
  async loadRecentMatches() {
    try {
      // Essayer de charger les matchs du 28/08/2025
      const dataPath = path.join(__dirname, '..', 'data', 'matches_2025_08_28.json');
      
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        return data.matches || data;
      }

      // Fallback: utiliser les matchs du 25/08/2025
      const fallbackPath = path.join(__dirname, '..', 'data', 'matches_2025_08_25.json');
      if (fs.existsSync(fallbackPath)) {
        const data = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        return data.matches || data;
      }

      return [];
    } catch (error) {
      console.error('Erreur lors du chargement des matchs:', error.message);
      return [];
    }
  }

  /**
   * Analyser les résultats des tests
   */
  analyzeTestResults() {
    if (this.testResults.length === 0) {
      console.log('\n❌ Aucun résultat de test à analyser');
      return;
    }

    console.log('\n📈 Analyse des Résultats');
    console.log('========================');

    // Statistiques générales
    const totalTests = this.testResults.length;
    const avgConfidence = this.testResults.reduce((sum, r) => sum + r.confidenceScore, 0) / totalTests;
    const avgRisk = this.testResults.reduce((sum, r) => sum + r.riskScore, 0) / totalTests;

    console.log(`📊 Total des tests: ${totalTests}`);
    console.log(`📊 Confiance moyenne: ${Math.round(avgConfidence * 100)}%`);
    console.log(`📊 Risque moyen: ${Math.round(avgRisk * 100)}%`);

    // Catégoriser les prédictions
    const highConfidence = this.testResults.filter(r => r.confidenceScore > 0.7);
    const lowRisk = this.testResults.filter(r => r.riskScore < 0.4);
    const recommended = this.testResults.filter(r => r.confidenceScore > 0.7 && r.riskScore < 0.4);

    console.log(`✅ Prédictions haute confiance: ${highConfidence.length}/${totalTests}`);
    console.log(`🛡️ Prédictions faible risque: ${lowRisk.length}/${totalTests}`);
    console.log(`⭐ Prédictions recommandées: ${recommended.length}/${totalTests}`);

    // Sauvegarder les résultats
    this.saveTestResults();
  }

  /**
   * Sauvegarder les résultats des tests
   */
  saveTestResults() {
    const resultsPath = path.join(__dirname, '..', 'data', 'prediction_test_results.json');
    const results = {
      timestamp: new Date().toISOString(),
      totalTests: this.testResults.length,
      results: this.testResults,
      summary: {
        avgConfidence: this.testResults.reduce((sum, r) => sum + r.confidenceScore, 0) / this.testResults.length,
        avgRisk: this.testResults.reduce((sum, r) => sum + r.riskScore, 0) / this.testResults.length,
        highConfidenceCount: this.testResults.filter(r => r.confidenceScore > 0.7).length,
        lowRiskCount: this.testResults.filter(r => r.riskScore < 0.4).length,
        recommendedCount: this.testResults.filter(r => r.confidenceScore > 0.7 && r.riskScore < 0.4).length
      }
    };

    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`💾 Résultats sauvegardés dans: ${resultsPath}`);
  }

  /**
   * Générer des prédictions améliorées pour demain
   */
  async generateImprovedPredictions() {
    console.log('\n🚀 Génération de Prédictions Améliorées');
    console.log('=====================================');

    const matches = await this.loadRecentMatches();
    if (!matches || matches.length === 0) {
      console.log('❌ Aucun match trouvé');
      return;
    }

    const improvedPredictions = [];

    for (const match of matches) {
      try {
        const prediction = await this.realPredictor.predictMatchWithRealData(match);
        const riskScore = this.riskManager.calculateRiskScore(prediction);
        const confidenceScore = this.riskManager.calculateConfidenceScore(prediction);

        // Filtrer seulement les prédictions de qualité
        if (confidenceScore > 0.6 && riskScore < 0.6) {
          improvedPredictions.push({
            ...match,
            prediction: prediction.prediction,
            analysis: prediction.analysis,
            reasoning: prediction.reasoning,
            riskScore,
            confidenceScore,
            overallScore: (confidenceScore * 0.7) + ((1 - riskScore) * 0.3)
          });
        }
      } catch (error) {
        console.log(`❌ Erreur pour ${match.homeTeam} vs ${match.awayTeam}: ${error.message}`);
      }
    }

    // Trier par score global
    improvedPredictions.sort((a, b) => b.overallScore - a.overallScore);

    // Sauvegarder les prédictions améliorées
    const outputPath = path.join(__dirname, '..', 'data', 'improved_predictions.json');
    const output = {
      timestamp: new Date().toISOString(),
      totalMatches: matches.length,
      filteredMatches: improvedPredictions.length,
      predictions: improvedPredictions
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`💾 Prédictions améliorées sauvegardées: ${outputPath}`);
    console.log(`📊 ${improvedPredictions.length} prédictions de qualité sur ${matches.length} matchs`);

    // Copier automatiquement dans le dossier public
    const publicPath = path.join(__dirname, '..', 'public', 'data', 'improved_predictions.json');
    const publicDir = path.dirname(publicPath);
    
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    fs.copyFileSync(outputPath, publicPath);
    console.log(`📁 Fichier copié dans: ${publicPath}`);

    return improvedPredictions;
  }
}

// Exécution du script
async function main() {
  const tester = new PredictionTester();
  
  // Test du système
  await tester.testWithRecentMatches();
  
  // Génération de prédictions améliorées
  await tester.generateImprovedPredictions();
  
  console.log('\n✅ Test terminé !');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { PredictionTester };
