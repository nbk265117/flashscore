const fs = require('fs');
const path = require('path');

function validateAnalysis() {
    try {
        const analysisData = JSON.parse(fs.readFileSync('public/data/analysis.json', 'utf8'));
        const analyses = analysisData.analyses;
        
        console.log(`🔍 Analysing ${analyses.length} matches...\n`);
        
        let totalIssues = 0;
        let validMatches = 0;
        
        analyses.forEach((analysis, index) => {
            const issues = [];
            
            // 1. Vérifier la cohérence des probabilités
            const { homeWin, draw, awayWin } = analysis.probabilities;
            const sum = homeWin + draw + awayWin;
            if (sum !== 100) {
                issues.push(`❌ Probabilities sum to ${sum}% instead of 100%`);
            }
            
            // 2. Vérifier la cohérence score vs probabilités
            const { likelyScore, halftimeResult } = analysis.predictions;
            const [homeGoals, awayGoals] = likelyScore.split('-').map(Number);
            const [halftimeHome, halftimeAway] = halftimeResult.split('-').map(Number);
            
            // Vérifier si le score correspond aux probabilités
            if (homeGoals > awayGoals && homeWin < 50) {
                issues.push(`❌ Home wins ${likelyScore} but Home Win probability is only ${homeWin}%`);
            }
            if (awayGoals > homeGoals && awayWin < 50) {
                issues.push(`❌ Away wins ${likelyScore} but Away Win probability is only ${awayWin}%`);
            }
            if (homeGoals === awayGoals && draw < 50) {
                issues.push(`❌ Draw ${likelyScore} but Draw probability is only ${draw}%`);
            }
            
            // 3. Vérifier la cohérence des probabilités de mi-temps
            const { halftimeHomeWin, halftimeDraw, halftimeAwayWin } = analysis.predictions;
            const halftimeSum = halftimeHomeWin + halftimeDraw + halftimeAwayWin;
            if (halftimeSum !== 100) {
                issues.push(`❌ Halftime probabilities sum to ${halftimeSum}% instead of 100%`);
            }
            
            // 4. Vérifier la cohérence score mi-temps vs probabilités mi-temps
            if (halftimeHome > halftimeAway && halftimeHomeWin < 50) {
                issues.push(`❌ Home leads ${halftimeResult} but Halftime Home Win probability is only ${halftimeHomeWin}%`);
            }
            if (halftimeAway > halftimeHome && halftimeAwayWin < 50) {
                issues.push(`❌ Away leads ${halftimeResult} but Halftime Away Win probability is only ${halftimeAwayWin}%`);
            }
            if (halftimeHome === halftimeAway && halftimeDraw < 50) {
                issues.push(`❌ Halftime draw ${halftimeResult} but Halftime Draw probability is only ${halftimeDraw}%`);
            }
            
            // 5. Vérifier la cohérence des corners
            const { totalCorners, homeCorners, awayCorners } = analysis.predictions;
            if (homeCorners + awayCorners !== totalCorners) {
                issues.push(`❌ Corners: ${homeCorners} + ${awayCorners} ≠ ${totalCorners}`);
            }
            
            // 6. Vérifier la cohérence des cartes
            const { yellowCards, redCards, homeYellowCards, awayYellowCards, homeRedCards, awayRedCards } = analysis.predictions;
            if (homeYellowCards + awayYellowCards !== yellowCards) {
                issues.push(`❌ Yellow cards: ${homeYellowCards} + ${awayYellowCards} ≠ ${yellowCards}`);
            }
            if (homeRedCards + awayRedCards !== redCards) {
                issues.push(`❌ Red cards: ${homeRedCards} + ${awayRedCards} ≠ ${redCards}`);
            }
            
            // 7. Vérifier la cohérence des substitutions
            const { homeTeamSubs, awayTeamSubs } = analysis.predictions;
            if (homeTeamSubs < 2 || homeTeamSubs > 4) {
                issues.push(`❌ Home substitutions (${homeTeamSubs}) should be 2-4`);
            }
            if (awayTeamSubs < 2 || awayTeamSubs > 4) {
                issues.push(`❌ Away substitutions (${awayTeamSubs}) should be 2-4`);
            }
            
            // 8. Vérifier la cohérence winner vs score
            const { winner } = analysis.predictions;
            if (homeGoals > awayGoals && winner !== analysis.match.homeTeam) {
                issues.push(`❌ Home wins ${likelyScore} but winner is ${winner}`);
            }
            if (awayGoals > homeGoals && winner !== analysis.match.awayTeam) {
                issues.push(`❌ Away wins ${likelyScore} but winner is ${winner}`);
            }
            if (homeGoals === awayGoals && winner !== 'Draw') {
                issues.push(`❌ Draw ${likelyScore} but winner is ${winner}`);
            }
            
            // Afficher les résultats
            if (issues.length > 0) {
                console.log(`📊 Match ${index + 1}: ${analysis.match.homeTeam} vs ${analysis.match.awayTeam}`);
                console.log(`   Score: ${likelyScore} | Halftime: ${halftimeResult}`);
                console.log(`   Probabilities: H${homeWin}% D${draw}% A${awayWin}%`);
                issues.forEach(issue => console.log(`   ${issue}`));
                console.log('');
                totalIssues += issues.length;
            } else {
                validMatches++;
            }
        });
        
        console.log(`📈 Summary:`);
        console.log(`   ✅ Valid matches: ${validMatches}/${analyses.length}`);
        console.log(`   ❌ Total issues found: ${totalIssues}`);
        console.log(`   📊 Success rate: ${((validMatches / analyses.length) * 100).toFixed(1)}%`);
        
        if (totalIssues === 0) {
            console.log(`\n🎉 All matches are perfectly consistent!`);
        } else {
            console.log(`\n⚠️  Found ${totalIssues} issues that need to be fixed.`);
        }
        
    } catch (error) {
        console.error('❌ Error reading analysis file:', error.message);
    }
}

validateAnalysis(); 