#!/usr/bin/env node

/**
 * Système de Gestion des Risques pour les Prédictions
 * Améliore la précision en filtrant les matchs à haut risque
 */

class RiskManagementSystem {
  constructor() {
    this.riskThresholds = {
      LOW: 0.3,
      MEDIUM: 0.6,
      HIGH: 0.9
    };
    
    this.confidenceThresholds = {
      LOW: 0.4,
      MEDIUM: 0.7,
      HIGH: 0.9
    };
  }

  /**
   * Filtrer les matchs selon le risque et la confiance
   */
  filterMatchesByRisk(predictions) {
    const filtered = {
      safe: [],
      moderate: [],
      risky: [],
      avoid: []
    };

    predictions.forEach(prediction => {
      const riskScore = this.calculateRiskScore(prediction);
      const confidenceScore = this.calculateConfidenceScore(prediction);
      const overallScore = (confidenceScore * 0.7) + ((1 - riskScore) * 0.3);

      if (overallScore > 0.8 && riskScore < 0.3) {
        filtered.safe.push({ ...prediction, overallScore });
      } else if (overallScore > 0.6 && riskScore < 0.5) {
        filtered.moderate.push({ ...prediction, overallScore });
      } else if (overallScore > 0.4 && riskScore < 0.7) {
        filtered.risky.push({ ...prediction, overallScore });
      } else {
        filtered.avoid.push({ ...prediction, overallScore });
      }
    });

    return filtered;
  }

  /**
   * Calculer le score de risque
   */
  calculateRiskScore(prediction) {
    const factors = {
      // Probabilité de victoire proche de 50% = plus de risque
      probabilityRisk: Math.abs(prediction.prediction.homeWinProbability - 50) / 50,
      
      // Forme récente instable = plus de risque
      formRisk: this.calculateFormRisk(prediction.analysis),
      
      // Données insuffisantes = plus de risque
      dataRisk: this.calculateDataRisk(prediction.analysis),
      
      // Confrontations directes limitées = plus de risque
      h2hRisk: this.calculateH2HRisk(prediction.analysis)
    };

    return Object.values(factors).reduce((sum, risk) => sum + risk, 0) / Object.keys(factors).length;
  }

  /**
   * Calculer le score de confiance
   */
  calculateConfidenceScore(prediction) {
    const factors = {
      // Plus de données = plus de confiance
      dataQuality: Math.min(prediction.analysis.homeStats.matchesPlayed / 10, 1),
      
      // Forme récente stable = plus de confiance
      formStability: this.calculateFormStability(prediction.analysis),
      
      // Probabilités claires = plus de confiance
      probabilityClarity: this.calculateProbabilityClarity(prediction.prediction),
      
      // Historique des confrontations = plus de confiance
      h2hHistory: Math.min(prediction.analysis.headToHead.matches / 5, 1)
    };

    return Object.values(factors).reduce((sum, conf) => sum + conf, 0) / Object.keys(factors).length;
  }

  /**
   * Recommandations de mise
   */
  getBettingRecommendations(filteredMatches) {
    const recommendations = {
      highConfidence: [],
      mediumConfidence: [],
      lowConfidence: [],
      avoid: []
    };

    // Matchs sûrs - Mise recommandée
    filteredMatches.safe.forEach(match => {
      recommendations.highConfidence.push({
        match: match,
        betSize: "2-3% du bankroll",
        betType: "Victoire simple",
        confidence: "TRÈS HAUTE",
        reasoning: "Données solides, risque faible, probabilité claire"
      });
    });

    // Matchs modérés - Mise limitée
    filteredMatches.moderate.forEach(match => {
      recommendations.mediumConfidence.push({
        match: match,
        betSize: "1-2% du bankroll",
        betType: "Victoire simple ou Double Chance",
        confidence: "HAUTE",
        reasoning: "Données correctes, risque modéré"
      });
    });

    // Matchs risqués - Mise minimale
    filteredMatches.risky.forEach(match => {
      recommendations.lowConfidence.push({
        match: match,
        betSize: "0.5-1% du bankroll",
        betType: "Double Chance ou Over/Under",
        confidence: "MOYENNE",
        reasoning: "Données limitées, risque élevé"
      });
    });

    // Matchs à éviter
    filteredMatches.avoid.forEach(match => {
      recommendations.avoid.push({
        match: match,
        betSize: "0% - À ÉVITER",
        betType: "Aucun",
        confidence: "TRÈS FAIBLE",
        reasoning: "Données insuffisantes ou risque trop élevé"
      });
    });

    return recommendations;
  }

  /**
   * Analyser les tendances
   */
  analyzeTrends(predictions) {
    const trends = {
      leaguePerformance: {},
      teamPerformance: {},
      betTypePerformance: {}
    };

    // Analyser la performance par ligue
    predictions.forEach(pred => {
      const league = pred.league;
      if (!trends.leaguePerformance[league]) {
        trends.leaguePerformance[league] = { wins: 0, total: 0 };
      }
      trends.leaguePerformance[league].total++;
    });

    return trends;
  }

  /**
   * Calculer le risque de forme
   */
  calculateFormRisk(analysis) {
    const homeForm = analysis.homeForm;
    const awayForm = analysis.awayForm;
    
    // Plus de variabilité = plus de risque
    const homeVariability = Math.abs(homeForm.wins - homeForm.losses);
    const awayVariability = Math.abs(awayForm.wins - awayForm.losses);
    
    return (homeVariability + awayVariability) / 10; // Normalisé entre 0 et 1
  }

  /**
   * Calculer le risque de données
   */
  calculateDataRisk(analysis) {
    const homeMatches = analysis.homeStats.matchesPlayed;
    const awayMatches = analysis.awayStats.matchesPlayed;
    
    // Moins de matchs = plus de risque
    const homeRisk = Math.max(0, (10 - homeMatches) / 10);
    const awayRisk = Math.max(0, (10 - awayMatches) / 10);
    
    return (homeRisk + awayRisk) / 2;
  }

  /**
   * Calculer le risque H2H
   */
  calculateH2HRisk(analysis) {
    const h2hMatches = analysis.headToHead.matches;
    
    // Moins de confrontations directes = plus de risque
    return Math.max(0, (5 - h2hMatches) / 5);
  }

  /**
   * Calculer la stabilité de forme
   */
  calculateFormStability(analysis) {
    const homeForm = analysis.homeForm;
    const awayForm = analysis.awayForm;
    
    // Forme stable = moins de variabilité
    const homeStability = 1 - (Math.abs(homeForm.wins - homeForm.losses) / 5);
    const awayStability = 1 - (Math.abs(awayForm.wins - awayForm.losses) / 5);
    
    return (homeStability + awayStability) / 2;
  }

  /**
   * Calculer la clarté des probabilités
   */
  calculateProbabilityClarity(prediction) {
    const homeProb = prediction.homeWinProbability;
    const awayProb = prediction.awayWinProbability;
    const drawProb = prediction.drawProbability;
    
    // Plus la probabilité dominante est élevée, plus c'est clair
    const maxProb = Math.max(homeProb, awayProb, drawProb);
    return maxProb / 100;
  }
}

module.exports = { RiskManagementSystem };
