const fs = require('fs').promises;
const path = require('path');

/**
 * Generate processed_matches.json from analysis.json
 * This script converts the analysis.json format to the processed_matches.json format
 */
async function generateProcessedMatches() {
    try {
        console.log('🔄 Generating processed_matches.json from analysis.json...');
        
        // Read the analysis.json file
        const analysisPath = path.join(__dirname, '..', 'data', 'analysis.json');
        const analysisData = JSON.parse(await fs.readFile(analysisPath, 'utf8'));
        
        console.log(`📊 Found ${analysisData.totalMatches} matches in analysis.json`);
        
        // Convert analyses to processed matches format
        const processedMatches = analysisData.analyses.map(analysis => ({
            id: analysis.match.id,
            homeTeam: analysis.homeTeam,
            awayTeam: analysis.awayTeam,
            date: analysis.matchTime,
            venue: analysis.venue || {
                name: 'Unknown Stadium',
                city: 'Unknown City',
                country: 'Unknown Country'
            },
            city: (analysis.venue && analysis.venue.city) || 'Unknown City',
            country: (analysis.venue && analysis.venue.country) || analysis.country || 'Unknown Country',
            league: analysis.league,
            homeTeamLogo: analysis.homeTeamLogo,
            awayTeamLogo: analysis.awayTeamLogo,
            status: {
                short: 'NS',
                long: 'Not Started'
            },
            score: {
                home: null,
                away: null,
                fulltime: { home: null, away: null },
                halftime: { home: null, away: null }
            },
            homeGoals: null,
            awayGoals: null,
            probabilities: analysis.probabilities || {
                homeWin: 0,
                draw: 0,
                awayWin: 0
            },
            predictions: analysis.predictions || {
                likelyScore: 'N/A',
                halftimeResult: 'N/A',
                overUnder: 'N/A'
            },
            analysis: analysis.analysis || {
                homeWinProbability: 0,
                drawProbability: 0,
                awayWinProbability: 0,
                riskLevel: 'UNKNOWN',
                keyFactors: ['No analysis performed'],
                analysis: 'No analysis performed - raw data only',
                bettingRecommendation: 'No recommendations - raw data only'
            }
        }));
        
        // Create the processed_matches.json structure
        const processedData = {
            date: analysisData.date,
            totalMatches: analysisData.totalMatches,
            matches: processedMatches,
            generatedAt: new Date().toISOString(),
            description: 'Processed matches generated from analysis.json'
        };
        
        // Write the processed_matches.json file
        const outputPath = path.join(__dirname, '..', 'data', 'processed_matches.json');
        await fs.writeFile(outputPath, JSON.stringify(processedData, null, 2));
        
        console.log(`✅ Successfully generated processed_matches.json with ${processedMatches.length} matches`);
        console.log(`📁 File saved to: ${outputPath}`);
        
        // Also copy to public/data if it exists
        const publicDataPath = path.join(__dirname, '..', 'public', 'data');
        try {
            await fs.access(publicDataPath);
            const publicOutputPath = path.join(publicDataPath, 'processed_matches.json');
            await fs.writeFile(publicOutputPath, JSON.stringify(processedData, null, 2));
            console.log(`📁 Also saved to: ${publicOutputPath}`);
        } catch (error) {
            console.log('⚠️  public/data directory not found, skipping copy');
        }
        
    } catch (error) {
        console.error('❌ Error generating processed_matches.json:', error.message);
        process.exit(1);
    }
}

// Run the script
generateProcessedMatches();
