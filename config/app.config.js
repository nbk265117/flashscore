/**
 * Application Configuration
 * Centralized configuration for the football matches application
 */
module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },

  // Data paths
  data: {
    inputFile: 'data/response.json',
    outputFile: 'data/processed_matches.json',
    backupDir: 'data/backups'
  },

  // Time formatting
  timeFormat: {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    timezone: 'UTC'
  },

  // Match status codes
  statusCodes: {
    NOT_STARTED: 'NS',
    FIRST_HALF: '1H',
    HALF_TIME: 'HT',
    SECOND_HALF: '2H',
    FULL_TIME: 'FT',
    AFTER_EXTRA_TIME: 'AET',
    PENALTIES: 'PEN',
    SUSPENDED: 'SUSP',
    POSTPONED: 'PST',
    CANCELLED: 'CANC',
    ABANDONED: 'ABD'
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableDebug: process.env.NODE_ENV === 'development'
  },

  // Web interface
  web: {
    title: 'Football Matches Viewer',
    description: 'Live scores, match times, and results',
    maxMatchesPerPage: 50
  }
}; 