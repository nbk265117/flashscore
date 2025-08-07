#!/usr/bin/env node

require('dotenv').config();

/**
 * Fetch Tomorrow's Football Data
 * 
 * This script fetches football fixtures for tomorrow from the API-Sports API
 * and saves them to a specific file.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Configuration
const API_CONFIG = {
    host: 'v3.football.api-sports.io',
    key: process.env.API_SPORTS_KEY || '',
    endpoint: '/fixtures'
};

// Get tomorrow's date
function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
}

// Make API request
function makeApiRequest(date) {
    return new Promise((resolve, reject) => {
        if (!API_CONFIG.key) {
            reject(new Error('API_SPORTS_KEY not found in .env file'));
            return;
        }

        const options = {
            hostname: API_CONFIG.host,
            path: `${API_CONFIG.endpoint}?date=${date}`,
            method: 'GET',
            headers: {
                'x-rapidapi-host': API_CONFIG.host,
                'x-apisports-key': API_CONFIG.key,
                'User-Agent': 'Flashinio-Score-Tomorrow-Fetcher/1.0'
            }
        };

        console.log(`🔍 Fetching data for ${date}...`);
        console.log(`🌐 API URL: https://${API_CONFIG.host}${options.path}`);

        const req = https.request(options, (res) => {
            let data = '';
            
            console.log(`📡 Response status: ${res.statusCode}`);
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    
                    if (jsonData.errors && jsonData.errors.length > 0) {
                        reject(new Error(`API Error: ${jsonData.errors[0]}`));
                        return;
                    }
                    
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error(`Failed to parse API response: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`API request failed: ${error.message}`));
        });

        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('API request timeout'));
        });

        req.end();
    });
}

// Save data to file
async function saveData(data, date) {
    const outputPath = path.join(__dirname, '../data', `tomorrow_${date}.json`);
    const outputDir = path.dirname(outputPath);
    
    // Ensure directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ Data saved to: ${outputPath}`);
    
    return outputPath;
}

// Display summary
function displaySummary(data) {
    console.log('\n📊 Data Summary:');
    console.log(`📅 Date: ${(data.parameters && data.parameters.date) || 'Unknown'}`);
    console.log(`📈 Total matches: ${data.results || 0}`);
    console.log(`📄 Response pages: ${(data.paging && data.paging.total) || 1}`);
    
    if (data.response && data.response.length > 0) {
        console.log('\n🏆 Sample matches:');
        data.response.slice(0, 5).forEach((match, index) => {
            const homeTeam = (match.teams && match.teams.home && match.teams.home.name) || 'Unknown';
            const awayTeam = (match.teams && match.teams.away && match.teams.away.name) || 'Unknown';
            const league = (match.league && match.league.name) || 'Unknown League';
            const time = (match.fixture && match.fixture.date) ? new Date(match.fixture.date).toLocaleTimeString() : 'TBD';
            
            console.log(`${index + 1}. ${homeTeam} vs ${awayTeam} (${league}) - ${time}`);
        });
        
        if (data.response.length > 5) {
            console.log(`... and ${data.response.length - 5} more matches`);
        }
    } else {
        console.log('❌ No matches found for tomorrow');
    }
}

// Main function
async function fetchTomorrowData() {
    try {
        console.log('🚀 Starting tomorrow\'s data fetch...');
        
        const tomorrow = getTomorrowDate();
        console.log(`📅 Tomorrow's date: ${tomorrow}`);
        
        // Check API key
        if (!API_CONFIG.key) {
            throw new Error('API_SPORTS_KEY not found in .env file. Please set your API key.');
        }
        
        // Fetch data
        const data = await makeApiRequest(tomorrow);
        
        // Save data
        const savedPath = await saveData(data, tomorrow);
        
        // Display summary
        displaySummary(data);
        
        console.log(`\n🎉 Successfully fetched tomorrow's data!`);
        console.log(`📁 File: ${savedPath}`);
        console.log(`📊 Total matches: ${data.results || 0}`);
        
        return data;
        
    } catch (error) {
        console.error('❌ Error fetching tomorrow\'s data:', error.message);
        
        if (error.message.includes('API_SPORTS_KEY')) {
            console.log('\n💡 To fix this:');
            console.log('1. Add your API key to .env file:');
            console.log('   API_SPORTS_KEY=your_api_key_here');
            console.log('2. Make sure the .env file exists in the project root');
        }
        
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    fetchTomorrowData();
}

module.exports = {
    fetchTomorrowData,
    getTomorrowDate,
    makeApiRequest
}; 