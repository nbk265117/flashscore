const MatchController = require('./controllers/MatchController');
const Logger = require('./utils/Logger');
const config = require('../config/app.config');

/**
 * Main Application Class
 * Orchestrates the football matches application
 */
class FootballMatchesApp {
  constructor() {
    this.matchController = new MatchController();
  }

  /**
   * Initialize the application
   */
  async initialize() {
    Logger.info('Initializing Football Matches Application...');
    
    try {
      // Process and display matches
      await this.matchController.processAndDisplayAllMatches();
      
      Logger.success('Application completed successfully');
    } catch (error) {
      Logger.error(`Application failed: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Run the application
   */
  static async run() {
    const app = new FootballMatchesApp();
    await app.initialize();
  }
}

// Run the application if this file is executed directly
if (require.main === module) {
  FootballMatchesApp.run();
}

module.exports = FootballMatchesApp; 