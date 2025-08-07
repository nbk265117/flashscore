#!/usr/bin/env node

require('dotenv').config();

/**
 * Fetch Data for Specific Date
 * 
 * This script fetches football fixtures for a specific date from the API-Sports API
 * and saves them to response.json.
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

const DATA_PATH = path.join(__dirname, '../data/response.json');
const BACKUP_PATH = path.join(__dirname, '../data/backups');

// Ensure data directory exists
async function ensureDirectories() {
    const dataDir = path.dirname(DATA_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    await fs.mkdir(BACKUP_PATH, { recursive: true });
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
                'User-Agent': 'Flashinio-Score-Specific-Date-Fetcher/1.0'
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

// Create backup of existing data
async function createBackup() {
    try {
        const existingData = await fs.readFile(DATA_PATH, 'utf8');
        const timestamp = new Date().toISOString().split('T')[0];
        const backupFile = path.join(BACKUP_PATH, `response_${timestamp}_backup.json`);
        await fs.writeFile(backupFile, existingData);
        console.log(`✅ Backup created: ${backupFile}`);
    } catch (error) {
        console.log('ℹ️  No existing data to backup');
    }
}

// Save data to response.json
async function saveData(data) {
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    console.log(`✅ Data saved to: ${DATA_PATH}`);
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
        console.log('❌ No matches found for this date');
    }
}

// Main function
async function fetchSpecificDate(date) {
    try {
        console.log('🚀 Starting specific date data fetch...');
        
        // Validate date format
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error('Invalid date format. Use YYYY-MM-DD format (e.g., 2025-08-08)');
        }
        
        console.log(`📅 Fetching data for: ${date}`);
        
        // Check API key
        if (!API_CONFIG.key) {
            throw new Error('API_SPORTS_KEY not found in .env file. Please set your API key.');
        }
        
        // Ensure directories exist
        await ensureDirectories();
        
        // Create backup of existing data
        await createBackup();
        
        // Fetch data
        const data = await makeApiRequest(date);
        
        // Check if API returned data
        if (!data || !data.response) {
            throw new Error('API returned invalid data structure');
        }
        
        console.log(`📊 Received ${data.response.length} matches`);
        
        // Save data
        await saveData(data);
        
        // Display summary
        displaySummary(data);
        
        console.log(`\n🎉 Successfully fetched data for ${date}!`);
        console.log(`📁 File: ${DATA_PATH}`);
        console.log(`📊 Total matches: ${data.results || 0}`);
        
        return data;
        
    } catch (error) {
        console.error('❌ Error fetching data:', error.message);
        
        if (error.message.includes('API_SPORTS_KEY')) {
            console.log('\n💡 To fix this:');
            console.log('1. Add your API key to .env file:');
            console.log('   API_SPORTS_KEY=your_api_key_here');
            console.log('2. Make sure the .env file exists in the project root');
        }
        
        process.exit(1);
    }
}

// Get date from command line arguments
function getDateFromArgs() {
    const args = process.argv.slice(2);
    const dateArg = args.find(arg => arg.startsWith('--date='));
    
    if (dateArg) {
        return dateArg.split('=')[1];
    }
    
    // Default to tomorrow if no date specified
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
}

// Run if called directly
if (require.main === module) {
    const date = getDateFromArgs();
    fetchSpecificDate(date);
}

module.exports = {
    fetchSpecificDate,
    makeApiRequest
}; 