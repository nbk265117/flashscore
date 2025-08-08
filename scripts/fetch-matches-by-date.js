const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_KEY = process.env.API_SPORTS_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

if (!API_KEY) {
    console.error('❌ API_SPORTS_KEY not found in environment variables');
    console.log('Please add your API key to .env file: API_SPORTS_KEY=your_key_here');
    process.exit(1);
}

function makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'v3.football.api-sports.io',
            port: 443,
            path: endpoint,
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': API_KEY
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error(`Failed to parse JSON: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`Request failed: ${error.message}`));
        });

        req.end();
    });
}

async function fetchMatchesByDate(date) {
    try {
        console.log(`🚀 Fetching matches for date: ${date}`);
        
        const endpoint = `/fixtures?date=${date}`;
        const response = await makeRequest(endpoint);
        
        if (response.errors && Object.keys(response.errors).length > 0) {
            throw new Error(`API Error: ${JSON.stringify(response.errors)}`);
        }
        
        if (!response.response) {
            throw new Error('No response data from API');
        }
        
        const matches = response.response;
        console.log(`✅ Found ${matches.length} matches for ${date}`);
        
        return matches;
    } catch (error) {
        console.error(`❌ Error fetching matches: ${error.message}`);
        throw error;
    }
}

function processMatches(matches) {
    return matches.map(match => {
        const fixture = match.fixture;
        const teams = match.teams;
        const goals = match.goals;
        const score = match.score;
        
        return {
            id: fixture.id,
            date: fixture.date,
            venue: fixture.venue ? fixture.venue.name : 'Unknown',
            city: fixture.venue ? fixture.venue.city : 'Unknown',
            country: fixture.venue ? fixture.venue.country : 'Unknown',
            homeTeam: teams.home.name,
            awayTeam: teams.away.name,
            homeTeamLogo: teams.home.logo,
            awayTeamLogo: teams.away.logo,
            league: match.league.name,
            country: match.league.country,
            homeGoals: goals.home,
            awayGoals: goals.away,
            homeScore: score ? score.halftime.home : null,
            awayScore: score ? score.halftime.away : null,
            status: fixture.status.short,
            elapsed: fixture.status.elapsed
        };
    });
}

async function main() {
    try {
        const date = process.argv[2] || '2025-08-08';
        console.log(`📅 Fetching matches for date: ${date}`);
        
        const matches = await fetchMatchesByDate(date);
        
        if (matches.length === 0) {
            console.log('⚠️  No matches found for this date');
            return;
        }
        
        const processedMatches = processMatches(matches);
        
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const filename = `matches_${date.replace(/-/g, '_')}.json`;
        const filepath = path.join(dataDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(processedMatches, null, 2));
        console.log(`💾 Saved ${processedMatches.length} matches to ${filepath}`);
        
        // Also save to public/data for web interface
        const publicDataDir = path.join(__dirname, '..', 'public', 'data');
        if (!fs.existsSync(publicDataDir)) {
            fs.mkdirSync(publicDataDir, { recursive: true });
        }
        
        const publicFilepath = path.join(publicDataDir, filename);
        fs.writeFileSync(publicFilepath, JSON.stringify(processedMatches, null, 2));
        console.log(`🌐 Also saved to public interface: ${publicFilepath}`);
        
        console.log('✅ Match fetching completed successfully!');
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
} 