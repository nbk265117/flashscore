#!/usr/bin/env node

/**
 * Cron Job Setup Helper
 * 
 * This script helps you set up automated daily execution
 * of the data fetcher script.
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

const SCRIPT_PATH = path.join(__dirname, 'fetch-daily-data.js');
const CRON_FILE = path.join(__dirname, '../crontab.txt');

async function createCronFile() {
    const cronContent = `# Football Data Fetch - Run every 15 minutes (respects API rate limit)
# Add this line to your crontab: crontab -e
# */15 * * * * cd ${process.cwd()} && node scripts/fetch-daily-data.js >> logs/daily-fetch.log 2>&1

# Or use this command to add it automatically:
# crontab -l | { cat; echo "*/15 * * * * cd ${process.cwd()} && node scripts/fetch-daily-data.js >> logs/daily-fetch.log 2>&1"; } | crontab -

# Manual execution:
# npm run fetch-daily

# Check logs:
# tail -f logs/daily-fetch.log

# Note: Script will only make API call once per day to respect rate limits
`;

    await fs.writeFile(CRON_FILE, cronContent);
    console.log('✅ Cron file created:', CRON_FILE);
}

async function createLogsDirectory() {
    const logsDir = path.join(__dirname, '../logs');
    await fs.mkdir(logsDir, { recursive: true });
    console.log('✅ Logs directory created:', logsDir);
}

async function checkScriptPermissions() {
    try {
        await fs.access(SCRIPT_PATH, fs.constants.X_OK);
        console.log('✅ Script is executable');
    } catch (error) {
        console.log('⚠️  Making script executable...');
        await fs.chmod(SCRIPT_PATH, 0o755);
        console.log('✅ Script permissions updated');
    }
}

async function setupCron() {
    try {
        console.log('🚀 Setting up automated daily data fetch...');
        
        // Create cron file
        await createCronFile();
        
        // Create logs directory
        await createLogsDirectory();
        
        // Check script permissions
        await checkScriptPermissions();
        
        console.log('\n📋 Setup completed! Here are your options:');
        console.log('\n1. Manual execution:');
        console.log('   npm run fetch-daily');
        
        console.log('\n2. Automated execution (add to crontab):');
        console.log('   crontab -e');
        console.log('   # Add this line:');
        console.log('   */15 * * * * cd ' + process.cwd() + ' && node scripts/fetch-daily-data.js >> logs/daily-fetch.log 2>&1');
        
        console.log('\n3. Or use the provided cron file:');
        console.log('   cat crontab.txt | crontab -');
        
        console.log('\n4. Check logs:');
        console.log('   tail -f logs/daily-fetch.log');
        
        console.log('\n📝 Note: Script runs every 15 minutes but only makes API call once per day');
        
        console.log('\n✅ Setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    setupCron();
}

module.exports = { setupCron }; 