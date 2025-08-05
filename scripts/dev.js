#!/usr/bin/env node

/**
 * Development Script
 * 
 * This script runs both the application and server in development mode
 * with automatic restart on file changes.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Football Matches Application in development mode...\n');

// Function to run a command with nodemon
function runWithNodemon(command, name) {
  const child = spawn('npx', ['nodemon', command], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  child.on('error', (error) => {
    console.error(`❌ Error starting ${name}:`, error.message);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`💥 ${name} exited with code ${code}`);
    }
  });

  return child;
}

// Start the application processor
console.log('📊 Starting match processor...');
const appProcess = runWithNodemon('src/app.js', 'Match Processor');

// Wait a bit for the app to process data, then start the server
setTimeout(() => {
  console.log('🌐 Starting web server...');
  const serverProcess = runWithNodemon('src/server.js', 'Web Server');
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development servers...');
    appProcess.kill('SIGINT');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down development servers...');
    appProcess.kill('SIGTERM');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
}, 2000);

console.log('\n✅ Development environment started!');
console.log('📊 Match processor will restart when source files change');
console.log('🌐 Web server will restart when server files change');
console.log('⏹️  Press Ctrl+C to stop all servers\n'); 