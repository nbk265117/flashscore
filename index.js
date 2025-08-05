#!/usr/bin/env node

/**
 * Football Matches Application Entry Point
 * 
 * This is the main entry point for the football matches application.
 * It processes match data and displays results in the console.
 */

const FootballMatchesApp = require('./src/app');

// Run the application
FootballMatchesApp.run().catch(error => {
  console.error('Application failed to start:', error.message);
  process.exit(1);
}); 