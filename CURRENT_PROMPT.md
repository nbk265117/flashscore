# 🎯 Prompt Actuel pour les Prédictions

## 📊 **Prompt Principal (Grok AI)**

```javascript
const prompt = `You are an expert football analyst with deep knowledge of football tactics, team dynamics, and statistical analysis.

ANALYZE THIS MATCH: ${match.homeTeam} vs ${match.awayTeam} in ${match.league} (${match.country}).

CRITICAL ANALYSIS REQUIREMENTS:
1. **Historical Performance**: Consider last 10 matches for both teams
2. **Head-to-Head**: Recent meetings between these teams
3. **Home/Away Form**: Current season home/away performance
4. **Injury Analysis**: Key player availability and impact
5. **Tactical Matchup**: Playing styles and tactical advantages
6. **League Context**: Current league position and motivation
7. **Recent Form**: Performance in last 5 matches
8. **Goalscoring Patterns**: Average goals scored/conceded
9. **Defensive Strength**: Clean sheets and defensive record
10. **Set Piece Efficiency**: Corner and free-kick conversion rates

PREDICTION TASKS:
1. **Full-time Score**: Most likely final score based on current form and historical data
2. **Half-time Result**: Expected score at half-time
3. **Over/Under 2.5**: Will total goals be over or under 2.5?
4. **Win Probability**: Percentage chance for home win, draw, away win
5. **Key Factors**: Top 3 factors influencing this prediction

ANALYSIS GUIDELINES:
- Base predictions on statistical evidence, not gut feeling
- Consider current form more heavily than historical data
- Factor in home advantage for home team
- Account for team motivation and league context
- Be conservative with high-scoring predictions
- Consider defensive records and playing styles

Provide predictions in JSON format ONLY:
{
  "homeWinProbability": [number 1-100],
  "drawProbability": [number 1-100],
  "awayWinProbability": [number 1-100],
  "likelyScore": "[home]-[away]",
  "halftimeResult": "[home]-[away]",
  "overUnder": "Over/Under [number] goals",
  "confidence": "[HIGH/MEDIUM/LOW]",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "analysis": "Brief analysis summary"
}`;
```

## 📋 **Prompt Copié (Bouton "Copy Prompt")**

```javascript
const copyPrompt = `Analyze this match: ${match.homeTeam} vs ${match.awayTeam} in ${match.league} (${match.country}).

Please analyze both teams and predict:  
1. Likely score  
2. Half-time result  
3. Over/under 2.5 goals  
4. Who is more likely to win and why?  
5. Last 5 matches or Current injuries or key players

In short, first-half result please.`;
```

## 🎯 **Différences entre les Prompts**

### **Prompt Principal (Grok AI)**
- ✅ **Complet** : 10 points d'analyse requis
- ✅ **Structured** : Format JSON spécifique
- ✅ **Detailed** : Guidelines d'analyse détaillées
- ✅ **Confidence** : Niveaux de confiance inclus
- ✅ **Factors** : Facteurs clés identifiés

### **Prompt Copié (Copy Button)**
- ✅ **Simple** : Format facile à copier/coller
- ✅ **Concise** : Version abrégée pour usage externe
- ✅ **Focused** : Concentré sur les résultats essentiels
- ✅ **Quick** : Rapidement utilisable

## 🔧 **Configuration Technique**

```javascript
// Configuration Grok AI
const grokConfig = {
    model: 'grok-4-latest',
    temperature: 0.3,           // Faible randomisation pour plus de cohérence
    max_tokens: 800,           // Limite de tokens pour la réponse
    stream: false,             // Réponse complète en une fois
    messages: [
        {
            role: 'system',
            content: 'You are a football analyst. Provide predictions in valid JSON format only.'
        },
        {
            role: 'user', 
            content: prompt
        }
    ]
};
```

## 📊 **Exemple d'Utilisation**

### **Match Example:**
```
ANALYZE THIS MATCH: Rodina Moskva vs Arsenal Tula in First League (Russia).

CRITICAL ANALYSIS REQUIREMENTS:
1. Historical Performance: Consider last 10 matches for both teams
2. Head-to-Head: Recent meetings between these teams
3. Home/Away Form: Current season home/away performance
4. Injury Analysis: Key player availability and impact
5. Tactical Matchup: Playing styles and tactical advantages
6. League Context: Current league position and motivation
7. Recent Form: Performance in last 5 matches
8. Goalscoring Patterns: Average goals scored/conceded
9. Defensive Strength: Clean sheets and defensive record
10. Set Piece Efficiency: Corner and free-kick conversion rates
```

## 🎯 **Points Clés du Prompt**

1. **Analyse Complète** : 10 points d'analyse requis
2. **Evidence Statistique** : Basé sur les données, pas sur l'intuition
3. **Forme Récente** : Privilégie la forme actuelle
4. **Avantage Domicile** : Prend en compte l'avantage terrain
5. **Prédictions Conservatrices** : Évite les scores élevés
6. **Format JSON** : Réponse structurée et standardisée

## 🔄 **Améliorations Récentes**

- ✅ **Prompt Enhanced** : Analyse plus complète et détaillée
- ✅ **Confidence Scoring** : Niveaux de confiance ajoutés
- ✅ **Key Factors** : Facteurs clés identifiés
- ✅ **Analysis Summary** : Résumé d'analyse inclus
- ✅ **Better Guidelines** : Directives d'analyse améliorées
