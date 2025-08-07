#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const SAMPLE_ANALYSES = [
    {
        homeWinProbability: 45,
        awayWinProbability: 35,
        drawProbability: 20,
        halftime: {
            homeWinProbability: 50,
            awayWinProbability: 30,
            drawProbability: 20,
            prediction: "Home team likely to lead at halftime",
            scorePrediction: "1-0"
        },
        finalScore: {
            homeScore: "2",
            awayScore: "1",
            prediction: "2-1"
        },
        corners: {
            total: "9-11",
            homeTeam: "5-6",
            awayTeam: "4-5",
            prediction: "Above average corner count expected"
        },
        cards: {
            yellowCards: "4-6",
            redCards: "0-1",
            homeTeamCards: "2-3",
            awayTeamCards: "2-3",
            prediction: "Moderate card count, away team slightly more aggressive"
        },
        substitutions: {
            homeTeam: "2-3",
            awayTeam: "2-3",
            timing: "Most substitutions between 60-75 minutes",
            prediction: "Standard substitution pattern expected"
        },
        keyFactors: [
            "Home team strong recent form",
            "Away team missing key striker",
            "Historical home advantage",
            "Weather conditions favor home team"
        ],
        analysis: "The home team has been in excellent form recently, winning 4 of their last 5 matches. They have a strong home record and the away team is missing their top scorer due to injury. The weather conditions are expected to favor the home team's style of play.",
        bettingRecommendation: "Consider home win with moderate confidence. The home team's recent form and home advantage make them the favorites, but the away team has shown resilience in recent matches.",
        riskLevel: "medium"
    },
    {
        homeWinProbability: 60,
        awayWinProbability: 25,
        drawProbability: 15,
        halftime: {
            homeWinProbability: 65,
            awayWinProbability: 25,
            drawProbability: 10,
            prediction: "Strong home team dominance expected at halftime",
            scorePrediction: "2-0"
        },
        finalScore: {
            homeScore: "3",
            awayScore: "1",
            prediction: "3-1"
        },
        corners: {
            total: "10-12",
            homeTeam: "6-7",
            awayTeam: "3-4",
            prediction: "High corner count due to home team attacking style"
        },
        cards: {
            yellowCards: "3-5",
            redCards: "0-0",
            homeTeamCards: "1-2",
            awayTeamCards: "2-3",
            prediction: "Low card count, disciplined match expected"
        },
        substitutions: {
            homeTeam: "2-3",
            awayTeam: "3-4",
            timing: "Away team likely to make early substitutions",
            prediction: "Away team will need fresh legs to counter home pressure"
        },
        keyFactors: [
            "Home team unbeaten at home this season",
            "Away team struggling with injuries",
            "Home team superior goal difference",
            "Historical dominance in this fixture"
        ],
        analysis: "The home team has been dominant at home this season, remaining unbeaten. They have a superior goal difference and the away team is dealing with multiple injuries. The historical record in this fixture heavily favors the home team.",
        bettingRecommendation: "Home win is highly recommended. The home team's form and the away team's injury crisis make this a strong bet. Consider home win with high confidence.",
        riskLevel: "low"
    },
    {
        homeWinProbability: 30,
        awayWinProbability: 55,
        drawProbability: 15,
        halftime: {
            homeWinProbability: 25,
            awayWinProbability: 60,
            drawProbability: 15,
            prediction: "Away team likely to lead at halftime",
            scorePrediction: "0-1"
        },
        finalScore: {
            homeScore: "1",
            awayScore: "2",
            prediction: "1-2"
        },
        corners: {
            total: "8-10",
            homeTeam: "3-4",
            awayTeam: "5-6",
            prediction: "Away team will create more corner opportunities"
        },
        cards: {
            yellowCards: "5-7",
            redCards: "0-1",
            homeTeamCards: "3-4",
            awayTeamCards: "2-3",
            prediction: "Higher card count as home team tries to contain away attack"
        },
        substitutions: {
            homeTeam: "3-4",
            awayTeam: "2-3",
            timing: "Home team will need fresh defensive players",
            prediction: "Home team will make defensive substitutions to counter away pressure"
        },
        keyFactors: [
            "Away team in excellent form",
            "Home team missing key defenders",
            "Away team superior attacking stats",
            "Recent away team victories in similar matches"
        ],
        analysis: "The away team is in excellent form and has superior attacking statistics. The home team is missing key defenders and has struggled against similar opposition. The away team's recent victories in similar matches suggest they have the upper hand.",
        bettingRecommendation: "Away win is recommended. The away team's form and the home team's defensive issues make this a good betting opportunity. Consider away win with moderate confidence.",
        riskLevel: "medium"
    }
];

function generateSampleAnalysis(match) {
    const template = SAMPLE_ANALYSES[Math.floor(Math.random() * SAMPLE_ANALYSES.length)];
    
                // Add some randomization to make each analysis unique
            const homeWin = template.homeWinProbability + (Math.random() - 0.5) * 20;
            const awayWin = template.awayWinProbability + (Math.random() - 0.5) * 20;
            const draw = 100 - homeWin - awayWin;
            
            // Ensure probabilities are valid (between 0 and 100)
            const adjustedHomeWin = Math.max(0, Math.min(100, homeWin));
            const adjustedAwayWin = Math.max(0, Math.min(100, awayWin));
            const adjustedDraw = Math.max(0, Math.min(100, draw));
            
            // Normalize to ensure they sum to 100
            const total = adjustedHomeWin + adjustedAwayWin + adjustedDraw;
            const normalizedHomeWin = Math.round((adjustedHomeWin / total) * 100);
            const normalizedAwayWin = Math.round((adjustedAwayWin / total) * 100);
            const normalizedDraw = Math.max(0, 100 - normalizedHomeWin - normalizedAwayWin);
    
                const halftimeHomeWin = template.halftime.homeWinProbability + (Math.random() - 0.5) * 20;
            const halftimeAwayWin = template.halftime.awayWinProbability + (Math.random() - 0.5) * 20;
            const halftimeDraw = 100 - halftimeHomeWin - halftimeAwayWin;
            
            // Ensure halftime probabilities are valid
            const adjustedHalftimeHomeWin = Math.max(0, Math.min(100, halftimeHomeWin));
            const adjustedHalftimeAwayWin = Math.max(0, Math.min(100, halftimeAwayWin));
            const adjustedHalftimeDraw = Math.max(0, Math.min(100, halftimeDraw));
            
            // Normalize halftime probabilities
            const halftimeTotal = adjustedHalftimeHomeWin + adjustedHalftimeAwayWin + adjustedHalftimeDraw;
            const normalizedHalftimeHomeWin = Math.round((adjustedHalftimeHomeWin / halftimeTotal) * 100);
            const normalizedHalftimeAwayWin = Math.round((adjustedHalftimeAwayWin / halftimeTotal) * 100);
            const normalizedHalftimeDraw = Math.max(0, 100 - normalizedHalftimeHomeWin - normalizedHalftimeAwayWin);
    
    // Generate venue information
    const venue = (match.fixture && match.fixture.venue) || {};
    const venueName = venue.name || 'Unknown Stadium';
    const venueCity = venue.city || 'Unknown City';
    const venueCountry = venue.country || 'Unknown Country';
    
    // Generate score predictions based on win probabilities
    let homeScore, awayScore;
    
    // Determine the most likely outcome based on probabilities
    const maxProb = Math.max(homeWin, awayWin, draw);
    
    if (maxProb === homeWin) {
        // Home win scenario
        homeScore = Math.floor(Math.random() * 2) + 2; // 2-3 goals
        awayScore = Math.floor(Math.random() * 2); // 0-1 goals
    } else if (maxProb === awayWin) {
        // Away win scenario
        homeScore = Math.floor(Math.random() * 2); // 0-1 goals
        awayScore = Math.floor(Math.random() * 2) + 1; // 1-2 goals
    } else {
        // Draw scenario
        homeScore = Math.floor(Math.random() * 2) + 1; // 1-2 goals
        awayScore = homeScore; // Same score for draw
    }
    
    // Generate halftime scores (typically 60-70% of final score)
    const halftimeHomeScore = Math.floor(homeScore * 0.6) + Math.floor(Math.random() * 1);
    const halftimeAwayScore = Math.floor(awayScore * 0.6) + Math.floor(Math.random() * 1);
    
    return {
        homeTeam: (match.teams && match.teams.home && match.teams.home.name) || 'Home Team',
        awayTeam: (match.teams && match.teams.away && match.teams.away.name) || 'Away Team',
        homeTeamLogo: (match.teams && match.teams.home && match.teams.home.logo) || null,
        awayTeamLogo: (match.teams && match.teams.away && match.teams.away.logo) || null,
        league: (match.league && match.league.name) || 'Unknown League',
        country: (match.league && match.league.country) || 'Unknown Country',
        matchTime: (match.fixture && match.fixture.date) || new Date().toISOString(),
        venue: {
            name: venueName,
            city: venueCity,
            country: venueCountry
        },
        analysis: {
                                homeWinProbability: normalizedHomeWin,
                    awayWinProbability: normalizedAwayWin,
                    drawProbability: normalizedDraw,
            halftime: {
                homeWinProbability: normalizedHalftimeHomeWin,
                awayWinProbability: normalizedHalftimeAwayWin,
                drawProbability: normalizedHalftimeDraw,
                prediction: template.halftime.prediction,
                scorePrediction: `${halftimeHomeScore}-${halftimeAwayScore}`
            },
            finalScore: {
                homeScore: homeScore.toString(),
                awayScore: awayScore.toString(),
                prediction: `${homeScore}-${awayScore}`
            },
            corners: template.corners,
            cards: template.cards,
            substitutions: template.substitutions,
            keyFactors: template.keyFactors,
            analysis: template.analysis,
            bettingRecommendation: template.bettingRecommendation,
            riskLevel: template.riskLevel
        }
    };
}

async function generateDemoAnalysis() {
    try {
        console.log('🤖 Starting demo analysis generation...');
        
        // Read the response.json file
        const responsePath = path.join(__dirname, '../data/response.json');
        const responseData = await fs.readFile(responsePath, 'utf8');
        const data = JSON.parse(responseData);
        
        if (!data.response || !Array.isArray(data.response)) {
            throw new Error('Invalid response.json structure');
        }
        
        console.log(`📊 Found ${data.response.length} matches to analyze`);
        
        // Generate analysis for all matches
        const analyses = data.response.map(match => generateSampleAnalysis(match));
        
        // Save to analysis.json
        const analysisPath = path.join(__dirname, '../data/analysis.json');
        await fs.writeFile(analysisPath, JSON.stringify(analyses, null, 2));
        
        console.log(`✅ Generated analysis for ${analyses.length} matches`);
        console.log(`📁 Analysis saved to: ${analysisPath}`);
        
        // Show sample analysis
        if (analyses.length > 0) {
            console.log('\n📋 Sample analysis:');
            const sample = analyses[0];
            console.log(`Match: ${sample.homeTeam} vs ${sample.awayTeam}`);
            console.log(`League: ${sample.league} (${sample.country})`);
            console.log(`Risk Level: ${sample.analysis.riskLevel.toUpperCase()}`);
            console.log(`Win Probabilities: Home ${sample.analysis.homeWinProbability}%, Draw ${sample.analysis.drawProbability}%, Away ${sample.analysis.awayWinProbability}%`);
        }
        
    } catch (error) {
        console.error('❌ Error generating demo analysis:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    generateDemoAnalysis();
}

module.exports = { generateDemoAnalysis }; 