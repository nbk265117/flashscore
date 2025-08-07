#!/usr/bin/env node

require('dotenv').config();

/**
 * Daily Football Data Fetcher
 * 
 * This script fetches football fixtures from the API-Sports API
 * and saves them to response.json. It's designed to be run once per day
 * to respect the API's rate limits.
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
        const options = {
            hostname: API_CONFIG.host,
            path: `${API_CONFIG.endpoint}?date=${date}`,
            method: 'GET',
            headers: {
                'x-rapidapi-host': API_CONFIG.host,
                'x-apisports-key': API_CONFIG.key,
                'User-Agent': 'Flashinio-Score-Daily-Fetcher/1.0'
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
        const backupFile = path.join(BACKUP_PATH, `response_${timestamp}.json`);
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

// Check if we should fetch data today
async function shouldFetchToday() {
    try {
        const lastFetchFile = path.join(__dirname, '../data/.last-fetch');
        
        // Check if we have a last fetch record
        try {
            const lastFetch = await fs.readFile(lastFetchFile, 'utf8');
            const lastFetchDate = new Date(lastFetch);
            const today = new Date();
            
            // Compare dates (ignore time)
            const lastFetchDay = lastFetchDate.toISOString().split('T')[0];
            const todayDay = today.toISOString().split('T')[0];
            
            if (lastFetchDay === todayDay) {
                console.log('ℹ️  Data already fetched today, skipping...');
                return false;
            }
        } catch (error) {
            // No last fetch record, proceed with fetch
            console.log('ℹ️  No previous fetch record found, proceeding...');
        }
        
        return true;
    } catch (error) {
        console.log('⚠️  Error checking last fetch, proceeding...');
        return true;
    }
}

// Record successful fetch
async function recordFetch() {
    try {
        const lastFetchFile = path.join(__dirname, '../data/.last-fetch');
        const now = new Date().toISOString();
        await fs.writeFile(lastFetchFile, now);
        console.log('✅ Fetch timestamp recorded');
    } catch (error) {
        console.log('⚠️  Could not record fetch timestamp');
    }
}

// Main function
async function fetchDailyData() {
    try {
        console.log('🚀 Starting data fetch check...');
        
        // Check if we should fetch today
        if (!(await shouldFetchToday())) {
            console.log('✅ Skipping fetch - already done today');
            return;
        }
        
        // Ensure directories exist
        await ensureDirectories();
        
        // Create backup of existing data
        await createBackup();
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        console.log(`📅 Fetching data for: ${today}`);
        
        // Make API request
        console.log('🌐 Making API request...');
        const apiData = await makeApiRequest(today);
        
        // Check if API returned data
        if (!apiData || !apiData.response) {
            throw new Error('API returned invalid data structure');
        }
        
        console.log(`📊 Received ${apiData.response.length} matches`);
        
        // Save data
        await saveData(apiData);
        
        // Record successful fetch
        await recordFetch();
        
        console.log('✅ Daily data fetch completed successfully!');
        console.log(`📈 Total matches: ${apiData.response.length}`);
        
        // Log some sample matches
        if (apiData.response.length > 0) {
            console.log('\n📋 Sample matches:');
            apiData.response.slice(0, 3).forEach((match, index) => {
                const homeTeam = (match.teams && match.teams.home && match.teams.home.name) || 'Unknown';
                const awayTeam = (match.teams && match.teams.away && match.teams.away.name) || 'Unknown';
                const league = (match.league && match.league.name) || 'Unknown';
                console.log(`  ${index + 1}. ${homeTeam} vs ${awayTeam} (${league})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error fetching daily data:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    fetchDailyData();
}

module.exports = { fetchDailyData }; 