#!/usr/bin/env node

require('dotenv').config();

/**
 * Process Response Data
 * 
 * This script processes the raw API response data and converts it
 * to the format expected by our analysis scripts.
 */

const fs = require('fs').promises;
const path = require('path');

// Process raw API data to our format
function processMatchData(rawMatch) {
    return {
        id: (rawMatch.fixture && rawMatch.fixture.id) || Math.floor(Math.random() * 1000000),
        homeTeam: (rawMatch.teams && rawMatch.teams.home && rawMatch.teams.home.name) || 'Unknown',
        awayTeam: (rawMatch.teams && rawMatch.teams.away && rawMatch.teams.away.name) || 'Unknown',
        league: (rawMatch.league && rawMatch.league.name) || 'Unknown League',
        country: (rawMatch.league && rawMatch.league.country) || 'Unknown Country',
        date: (rawMatch.fixture && rawMatch.fixture.date) || new Date().toISOString(),
        status: {
            long: (rawMatch.fixture && rawMatch.fixture.status && rawMatch.fixture.status.long) || 'Not Started',
            short: (rawMatch.fixture && rawMatch.fixture.status && rawMatch.fixture.status.short) || 'NS',
            elapsed: (rawMatch.fixture && rawMatch.fixture.status && rawMatch.fixture.status.elapsed) || null,
            extra: (rawMatch.fixture && rawMatch.fixture.status && rawMatch.fixture.status.extra) || null
        },
        score: {
            halftime: {
                home: (rawMatch.score && rawMatch.score.halftime && rawMatch.score.halftime.home) || null,
                away: (rawMatch.score && rawMatch.score.halftime && rawMatch.score.halftime.away) || null
            },
            fulltime: {
                home: (rawMatch.score && rawMatch.score.fulltime && rawMatch.score.fulltime.home) || null,
                away: (rawMatch.score && rawMatch.score.fulltime && rawMatch.score.fulltime.away) || null
            },
            extratime: {
                home: (rawMatch.score && rawMatch.score.extratime && rawMatch.score.extratime.home) || null,
                away: (rawMatch.score && rawMatch.score.extratime && rawMatch.score.extratime.away) || null
            },
            penalty: {
                home: (rawMatch.score && rawMatch.score.penalty && rawMatch.score.penalty.home) || null,
                away: (rawMatch.score && rawMatch.score.penalty && rawMatch.score.penalty.away) || null
            }
        },
        venue: {
            id: (rawMatch.fixture && rawMatch.fixture.venue && rawMatch.fixture.venue.id) || null,
            name: (rawMatch.fixture && rawMatch.fixture.venue && rawMatch.fixture.venue.name) || 'Unknown Venue',
            city: (rawMatch.fixture && rawMatch.fixture.venue && rawMatch.fixture.venue.city) || 'Unknown City'
        },
        referee: (rawMatch.fixture && rawMatch.fixture.referee) || null,
        formattedTime: formatMatchTime((rawMatch.fixture && rawMatch.fixture.date)),
        formattedScore: formatScore(rawMatch.score),
        isFinished: isMatchFinished((rawMatch.fixture && rawMatch.fixture.status && rawMatch.fixture.status.short)),
        isUpcoming: !isMatchFinished((rawMatch.fixture && rawMatch.fixture.status && rawMatch.fixture.status.short)),
        isLive: isMatchLive((rawMatch.fixture && rawMatch.fixture.status && rawMatch.fixture.status.short)),
        teams: {
            home: {
                id: (rawMatch.teams && rawMatch.teams.home && rawMatch.teams.home.id) || null,
                name: (rawMatch.teams && rawMatch.teams.home && rawMatch.teams.home.name) || 'Unknown',
                logo: (rawMatch.teams && rawMatch.teams.home && rawMatch.teams.home.logo) || ''
            },
            away: {
                id: (rawMatch.teams && rawMatch.teams.away && rawMatch.teams.away.id) || null,
                name: (rawMatch.teams && rawMatch.teams.away && rawMatch.teams.away.name) || 'Unknown',
                logo: (rawMatch.teams && rawMatch.teams.away && rawMatch.teams.away.logo) || ''
            }
        },
        league: {
            id: (rawMatch.league && rawMatch.league.id) || null,
            name: (rawMatch.league && rawMatch.league.name) || 'Unknown League',
            country: (rawMatch.league && rawMatch.league.country) || 'Unknown Country',
            logo: (rawMatch.league && rawMatch.league.logo) || '',
            flag: (rawMatch.league && rawMatch.league.flag) || ''
        }
    };
}

// Format match time
function formatMatchTime(dateString) {
    if (!dateString) return 'TBD';
    
    try {
        const date = new Date(dateString);
        const formattedDate = date.toLocaleDateString('en-GB');
        const formattedTime = date.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        return `${formattedDate} - ${formattedTime}`;
    } catch (error) {
        return 'TBD';
    }
}

// Format score
function formatScore(score) {
    if (!score) return 'TBD';
    
    const fulltime = score.fulltime;
    if (fulltime && fulltime.home !== null && fulltime.away !== null) {
        return `${fulltime.home}-${fulltime.away}`;
    }
    
    const halftime = score.halftime;
    if (halftime && halftime.home !== null && halftime.away !== null) {
        return `HT: ${halftime.home}-${halftime.away}`;
    }
    
    return 'TBD';
}

// Check if match is finished
function isMatchFinished(status) {
    if (!status) return false;
    const finishedStatuses = ['FT', 'AET', 'PEN', 'BT', 'SUSP', 'INT', 'PST', 'CANC', 'ABD', 'AWD', 'WO'];
    return finishedStatuses.includes(status);
}

// Check if match is live
function isMatchLive(status) {
    if (!status) return false;
    const liveStatuses = ['1H', 'HT', '2H', 'ET', 'P', 'BT'];
    return liveStatuses.includes(status);
}

// Main function
async function processResponseData() {
    try {
        console.log('🔄 Processing response data...');
        
        // Load raw response data
        const responsePath = path.join(__dirname, '../data/response.json');
        const responseData = await fs.readFile(responsePath, 'utf8');
        const rawData = JSON.parse(responseData);
        
        if (!rawData.response || !Array.isArray(rawData.response)) {
            throw new Error('Invalid response data structure');
        }
        
        console.log(`📊 Found ${rawData.response.length} matches to process`);
        
        // Process each match
        const processedMatches = rawData.response.map(match => processMatchData(match));
        
        // Save processed data
        const outputPath = path.join(__dirname, '../data/processed_matches.json');
        await fs.writeFile(outputPath, JSON.stringify(processedMatches, null, 2));
        
        console.log(`✅ Processed ${processedMatches.length} matches`);
        console.log(`📁 Saved to: ${outputPath}`);
        
        // Display sample
        if (processedMatches.length > 0) {
            console.log('\n📋 Sample processed matches:');
            processedMatches.slice(0, 3).forEach((match, index) => {
                console.log(`${index + 1}. ${match.homeTeam} vs ${match.awayTeam} (${match.league})`);
                console.log(`   📅 ${match.formattedTime} | 📍 ${match.venue.name}, ${match.venue.city}`);
                console.log(`   🏆 ${match.league.name} (${match.country})`);
            });
        }
        
        return processedMatches;
        
    } catch (error) {
        console.error('❌ Error processing response data:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    processResponseData();
}

module.exports = {
    processResponseData,
    processMatchData
}; 