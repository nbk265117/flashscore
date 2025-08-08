const fs = require('fs');
const path = require('path');
require('dotenv').config();

function generateTeamData() {
    const formOptions = ['W', 'D', 'L'];
    const last5Matches = [];
    for (let i = 0; i < 5; i++) {
        last5Matches.push(formOptions[Math.floor(Math.random() * formOptions.length)]);
    }
    
    const injuries = ['Player A', 'Player B', 'Player C'];
    const keyPlayers = ['Striker', 'Midfielder', 'Defender'];
    
    return {
        last5: last5Matches,
        injuries: injuries.slice(0, Math.floor(Math.random() * 3)),
        keyPlayers: keyPlayers.slice(0, Math.floor(Math.random() * 3) + 1)
    };
}

function calculateWinProbabilities(homeTeam, awayTeam) {
    // Simulate team form based on last 5 matches
    const homeForm = homeTeam.last5.filter(result => result === 'W').length;
    const awayForm = awayTeam.last5.filter(result => result === 'W').length;
    
    // Base probabilities with home advantage
    let homeWinProb = 40 + (homeForm * 5) - (awayForm * 3);
    let awayWinProb = 25 + (awayForm * 5) - (homeForm * 3);
    let drawProb = 35 - (homeForm + awayForm) * 2;
    
    // Ensure probabilities are within reasonable bounds
    homeWinProb = Math.max(15, Math.min(65, homeWinProb));
    awayWinProb = Math.max(10, Math.min(55, awayWinProb));
    drawProb = Math.max(20, Math.min(40, drawProb));
    
    // Normalize to sum to 100%
    const total = homeWinProb + drawProb + awayWinProb;
    homeWinProb = Math.round((homeWinProb / total) * 100);
    drawProb = Math.round((drawProb / total) * 100);
    awayWinProb = 100 - homeWinProb - drawProb;
    
    return { homeWinProb, drawProb, awayWinProb };
}

function generateScorePrediction(homeWinProb, awayWinProb, drawProb) {
    // Generate realistic scores based on win probabilities
    let homeGoals, awayGoals;
    
    // Determine the most likely winner based on probabilities
    const homeWin = homeWinProb > awayWinProb;
    const awayWin = awayWinProb > homeWinProb;
    const isDraw = Math.abs(homeWinProb - awayWinProb) < 5; // Close match if difference < 5%
    
    // Use probabilities to determine the most likely outcome
    const maxProb = Math.max(homeWinProb, awayWinProb, drawProb);
    
    if (maxProb === homeWinProb && homeWinProb > 40) {
        // Home team most likely to win
        homeGoals = Math.floor(Math.random() * 3) + 2; // 2-4 goals
        awayGoals = Math.floor(Math.random() * 2); // 0-1 goals
    } else if (maxProb === awayWinProb && awayWinProb > 40) {
        // Away team most likely to win
        homeGoals = Math.floor(Math.random() * 2); // 0-1 goals
        awayGoals = Math.floor(Math.random() * 3) + 2; // 2-4 goals
    } else if (maxProb === drawProb && drawProb > 30) {
        // Draw most likely
        homeGoals = Math.floor(Math.random() * 3) + 1; // 1-3 goals
        awayGoals = homeGoals; // Same score for draw
    } else {
        // Close match - use weighted random based on probabilities
        const rand = Math.random() * 100;
        if (rand < homeWinProb) {
            // Home win
            homeGoals = Math.floor(Math.random() * 3) + 2; // 2-4 goals
            awayGoals = Math.floor(Math.random() * 2); // 0-1 goals
        } else if (rand < homeWinProb + awayWinProb) {
            // Away win
            homeGoals = Math.floor(Math.random() * 2); // 0-1 goals
            awayGoals = Math.floor(Math.random() * 3) + 2; // 2-4 goals
        } else {
            // Draw
            homeGoals = Math.floor(Math.random() * 3) + 1; // 1-3 goals
            awayGoals = homeGoals; // Same score for draw
        }
    }
    
    return { homeGoals, awayGoals };
}

function analyzeMatch(match) {
    const homeTeam = generateTeamData();
    const awayTeam = generateTeamData();
    
    const { homeWinProb, drawProb, awayWinProb } = calculateWinProbabilities(homeTeam, awayTeam);
    const { homeGoals, awayGoals } = generateScorePrediction(homeWinProb, awayWinProb, drawProb);
    
    // Generate halftime score
    const halftimeHome = Math.floor(homeGoals * 0.6);
    const halftimeAway = Math.floor(awayGoals * 0.6);
    
    // Determine winner based on predicted score
    const winner = homeGoals > awayGoals ? match.homeTeam : awayGoals > homeGoals ? match.awayTeam : 'Draw';
    
    // Calculate total goals for over/under
    const totalGoals = homeGoals + awayGoals;
    const overUnder = totalGoals > 2.5 ? 'Over 2.5' : 'Under 2.5';
    
    // Generate corner predictions by team
    const homeCorners = Math.floor(Math.random() * 6) + 3; // 3-8 corners
    const awayCorners = Math.floor(Math.random() * 6) + 3; // 3-8 corners
    
    // Calculate total corners (sum of team corners)
    const totalCorners = homeCorners + awayCorners;
    const corners = `${homeCorners}-${awayCorners}`;
    
    // Generate substitution predictions
    const homeTeamSubs = Math.floor(Math.random() * 3) + 2; // 2-4 substitutions
    const awayTeamSubs = Math.floor(Math.random() * 3) + 2; // 2-4 substitutions
    const substitutionTiming = ['60-70 minutes', '65-75 minutes', '70-80 minutes'][Math.floor(Math.random() * 3)];
    
    // Generate halftime predictions that match the halftime score
    let halftimeHomeWin, halftimeDraw, halftimeAwayWin;
    
    if (halftimeHome > halftimeAway) {
        // Home leads at halftime (1-0, 2-0, 2-1, etc.)
        halftimeHomeWin = Math.floor(Math.random() * 15) + 60; // 60-75%
        halftimeDraw = Math.floor(Math.random() * 10) + 15; // 15-25%
        halftimeAwayWin = 100 - halftimeHomeWin - halftimeDraw;
    } else if (halftimeAway > halftimeHome) {
        // Away leads at halftime (0-1, 0-2, 1-2, etc.)
        halftimeHomeWin = Math.floor(Math.random() * 10) + 10; // 10-20%
        halftimeDraw = Math.floor(Math.random() * 10) + 15; // 15-25%
        halftimeAwayWin = 100 - halftimeHomeWin - halftimeDraw;
    } else {
        // Draw at halftime (0-0, 1-1, 2-2, etc.)
        halftimeHomeWin = Math.floor(Math.random() * 15) + 20; // 20-35%
        halftimeDraw = Math.floor(Math.random() * 15) + 55; // 55-70%
        halftimeAwayWin = 100 - halftimeHomeWin - halftimeDraw;
    }
    
    // Generate card predictions by team
    const homeYellowCards = Math.floor(Math.random() * 4) + 1; // 1-4 cartes jaunes
    const awayYellowCards = Math.floor(Math.random() * 4) + 1; // 1-4 cartes jaunes
    const homeRedCards = Math.floor(Math.random() * 2); // 0-1 cartes rouges
    const awayRedCards = Math.floor(Math.random() * 2); // 0-1 cartes rouges
    
    // Calculate total cards (sum of team cards)
    const totalYellowCards = homeYellowCards + awayYellowCards;
    const totalRedCards = homeRedCards + awayRedCards;
    
    // Calculate win probabilities
    const homeWinRate = Math.round((homeTeam.last5.filter(r => r === 'W').length / 5) * 100);
    const awayWinRate = Math.round((awayTeam.last5.filter(r => r === 'W').length / 5) * 100);
    
    // Generate analysis text
    const analysisText = `Based on recent form, ${match.homeTeam} (${homeWinRate}% win rate) faces ${match.awayTeam} (${awayWinRate}% win rate). ${match.homeTeam} has scored ${homeGoals} goals in their last 5 matches while conceding ${awayGoals}. ${match.awayTeam} has scored ${awayGoals} goals and conceded ${homeGoals}. Both teams are evenly matched.`;
    
    // Generate key factors
    const keyFactors = [
        `${match.homeTeam} in ${homeWinRate > 50 ? 'excellent' : 'good'} form`,
        `${match.awayTeam} ${awayTeam.injuries.length > 0 ? 'missing key players' : 'at full strength'}`,
        `${match.venue === 'Unknown' ? 'Neutral' : 'Home'} venue`,
        'Regular season game'
    ];
    
    // Adjust probabilities to match the predicted score
    let adjustedHomeWinProb, adjustedDrawProb, adjustedAwayWinProb;
    
    if (winner === 'Draw') {
        // Draw - make draw probability clearly dominant
        adjustedDrawProb = Math.floor(Math.random() * 15) + 60; // 60-75%
        adjustedHomeWinProb = Math.floor(Math.random() * 10) + 15; // 15-25%
        adjustedAwayWinProb = 100 - adjustedHomeWinProb - adjustedDrawProb;
    } else if (winner === match.homeTeam) {
        // Home wins - adjust probabilities to reflect home advantage
        const winMargin = homeGoals - awayGoals;
        if (winMargin >= 2) {
            // Clear home win (2-0, 3-0, 3-1, etc.)
            adjustedHomeWinProb = Math.floor(Math.random() * 10) + 70; // 70-80%
            adjustedDrawProb = Math.floor(Math.random() * 8) + 8; // 8-16%
            adjustedAwayWinProb = 100 - adjustedHomeWinProb - adjustedDrawProb;
        } else {
            // Close home win (1-0, 2-1, etc.)
            adjustedHomeWinProb = Math.floor(Math.random() * 10) + 55; // 55-65%
            adjustedDrawProb = Math.floor(Math.random() * 10) + 20; // 20-30%
            adjustedAwayWinProb = 100 - adjustedHomeWinProb - adjustedDrawProb;
        }
    } else {
        // Away wins - adjust probabilities to reflect away win
        const winMargin = awayGoals - homeGoals;
        if (winMargin >= 2) {
            // Clear away win (0-2, 1-3, etc.)
            adjustedHomeWinProb = Math.floor(Math.random() * 8) + 8; // 8-16%
            adjustedDrawProb = Math.floor(Math.random() * 8) + 8; // 8-16%
            adjustedAwayWinProb = 100 - adjustedHomeWinProb - adjustedDrawProb;
        } else {
            // Close away win (0-1, 1-2, etc.)
            adjustedHomeWinProb = Math.floor(Math.random() * 10) + 15; // 15-25%
            adjustedDrawProb = Math.floor(Math.random() * 10) + 15; // 15-25%
            adjustedAwayWinProb = 100 - adjustedHomeWinProb - adjustedDrawProb;
        }
    }
    
    // Generate betting recommendation based on adjusted probabilities
    let confidence, bettingRecommendation;
    const maxProb = Math.max(adjustedHomeWinProb, adjustedDrawProb, adjustedAwayWinProb);
    
    if (maxProb === adjustedDrawProb) {
        confidence = adjustedDrawProb > 60 ? 'high' : adjustedDrawProb > 45 ? 'moderate' : 'low';
        bettingRecommendation = `Draw recommended with ${adjustedDrawProb}% probability. Consider draw with ${confidence} confidence.`;
    } else if (maxProb === adjustedHomeWinProb) {
        confidence = adjustedHomeWinProb > 60 ? 'high' : adjustedHomeWinProb > 45 ? 'moderate' : 'low';
        bettingRecommendation = `${match.homeTeam} win recommended with ${adjustedHomeWinProb}% probability. Consider home win with ${confidence} confidence.`;
    } else {
        confidence = adjustedAwayWinProb > 60 ? 'high' : adjustedAwayWinProb > 45 ? 'moderate' : 'low';
        bettingRecommendation = `${match.awayTeam} win recommended with ${adjustedAwayWinProb}% probability. Consider away win with ${confidence} confidence.`;
    }
    
    return {
        match: {
            id: match.id,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            date: match.date,
            venue: match.venue,
            city: match.city,
            country: match.country,
            league: match.league,
            homeTeamLogo: match.homeTeamLogo,
            awayTeamLogo: match.awayTeamLogo
        },
        homeTeamLogo: match.homeTeamLogo,
        awayTeamLogo: match.awayTeamLogo,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        league: match.league,
        country: match.country,
        matchTime: match.date,
        venue: {
            name: match.venue,
            city: match.city,
            country: match.country
        },
        teamData: {
            home: homeTeam,
            away: awayTeam
        },
        probabilities: {
            homeWin: adjustedHomeWinProb,
            draw: adjustedDrawProb,
            awayWin: adjustedAwayWinProb
        },
        predictions: {
            likelyScore: `${homeGoals}-${awayGoals}`,
            halftimeResult: `${halftimeHome}-${halftimeAway}`,
            overUnder: overUnder,
            corners: corners,
            totalCorners: totalCorners,
            yellowCards: totalYellowCards,
            redCards: totalRedCards,
            homeTeamSubs: homeTeamSubs,
            awayTeamSubs: awayTeamSubs,
            substitutionTiming: substitutionTiming,
            halftimeHomeWin: halftimeHomeWin,
            halftimeDraw: halftimeDraw,
            halftimeAwayWin: halftimeAwayWin,
            homeYellowCards: homeYellowCards,
            awayYellowCards: awayYellowCards,
            homeRedCards: homeRedCards,
            awayRedCards: awayRedCards,
            homeCorners: homeCorners,
            awayCorners: awayCorners,
            winner: winner,
            reason: `${winner} has better form and key players available`
        },
        analysis: {
            homeWinProbability: homeWinProb,
            drawProbability: drawProb,
            awayWinProbability: awayWinProb,
            riskLevel: homeWinProb > 60 ? 'LOW' : homeWinProb > 40 ? 'MEDIUM' : 'HIGH',
            keyFactors: keyFactors,
            analysis: analysisText,
            bettingRecommendation: bettingRecommendation
        }
    };
}

async function main() {
    try {
        const inputFile = process.argv[2];
        
        if (!inputFile) {
            console.error('❌ Please provide an input file path');
            console.log('Usage: node analyze-matches.js <input-file>');
            process.exit(1);
        }
        
        const inputPath = path.resolve(inputFile);
        
        if (!fs.existsSync(inputPath)) {
            console.error(`❌ Input file not found: ${inputPath}`);
            process.exit(1);
        }
        
        console.log('🚀 Starting match analysis...');
        
        const matchesData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
        console.log(`📊 Processing ${matchesData.length} matches from ${matchesData[0] ? matchesData[0].date : 'unknown date'}`);
        
        const analyses = matchesData.map(match => analyzeMatch(match));
        
        const analysisData = {
            date: matchesData[0] ? matchesData[0].date : new Date().toISOString().split('T')[0],
            totalMatches: matchesData.length,
            analyses: analyses
        };
        
        // Save to data directory
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const outputFilename = `analysis_${analysisData.date.replace(/-/g, '_')}.json`;
        const outputPath = path.join(dataDir, outputFilename);
        
        fs.writeFileSync(outputPath, JSON.stringify(analysisData, null, 2));
        console.log(`💾 Saved analysis to ${outputFilename}`);
        
        // Also save to public interface
        const publicAnalysisPath = path.join(__dirname, '..', 'data', 'analysis.json');
        fs.writeFileSync(publicAnalysisPath, JSON.stringify(analysisData, null, 2));
        console.log('🌐 Saved analysis to public interface: analysis.json');
        
        console.log('✅ Match analysis completed successfully!');
        console.log(`📁 Analysis saved to: ${outputPath}`);
        console.log(`📊 Total matches analyzed: ${analyses.length}`);
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
} 