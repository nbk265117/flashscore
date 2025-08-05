const MatchService = require('../services/MatchService');

/**
 * Match Controller
 * Handles match display logic and user interactions
 */
class MatchController {
  constructor() {
    this.matchService = new MatchService();
  }

  /**
   * Display matches in console with formatted output
   * @param {Array<Match>} matches - Array of matches to display
   */
  displayMatches(matches) {
    console.log('\n=== MATCHES ===');
    console.log(`Total matches: ${matches.length}\n`);
    
    matches.forEach((match, index) => {
      console.log(`${index + 1}. ${match.teams.home.name} vs ${match.teams.away.name}`);
      console.log(`   League: ${match.league.name} (${match.league.country})`);
      console.log(`   Time: ${match.getFormattedTime()}`);
      console.log(`   Status: ${match.getStatusDescription()}`);
      console.log(`   Score: ${match.getFormattedScore()}`);
      
      if (match.getVenueInfo()) {
        console.log(`   Venue: ${match.getVenueInfo()}`);
      }
      
      if (match.referee) {
        console.log(`   Referee: ${match.referee}`);
      }
      
      console.log(''); // Empty line for separation
    });
  }

  /**
   * Display match statistics
   * @param {Array<Match>} matches - Array of matches
   */
  displayStatistics(matches) {
    const stats = this.matchService.getMatchStatistics(matches);
    
    console.log('\n=== STATISTICS ===');
    console.log(`Total Matches: ${stats.total}`);
    console.log(`Finished Matches: ${stats.finished}`);
    console.log(`Upcoming Matches: ${stats.upcoming}`);
    console.log(`Live Matches: ${stats.live}`);
    console.log(`Unique Leagues: ${stats.leagues}`);
  }

  /**
   * Display finished matches
   * @param {Array<Match>} matches - Array of all matches
   */
  displayFinishedMatches(matches) {
    const finishedMatches = this.matchService.getFinishedMatches(matches);
    console.log(`\n=== FINISHED MATCHES (${finishedMatches.length}) ===`);
    this.displayMatches(finishedMatches);
  }

  /**
   * Display upcoming matches
   * @param {Array<Match>} matches - Array of all matches
   */
  displayUpcomingMatches(matches) {
    const upcomingMatches = this.matchService.getUpcomingMatches(matches);
    console.log(`\n=== UPCOMING MATCHES (${upcomingMatches.length}) ===`);
    this.displayMatches(upcomingMatches);
  }

  /**
   * Display live matches
   * @param {Array<Match>} matches - Array of all matches
   */
  displayLiveMatches(matches) {
    const liveMatches = this.matchService.getLiveMatches(matches);
    console.log(`\n=== LIVE MATCHES (${liveMatches.length}) ===`);
    this.displayMatches(liveMatches);
  }

  /**
   * Display matches by status
   * @param {Array<Match>} matches - Array of all matches
   * @param {string} status - Status to filter by
   */
  displayMatchesByStatus(matches, status) {
    const filteredMatches = this.matchService.filterByStatus(matches, status);
    console.log(`\n=== MATCHES WITH STATUS: ${status.toUpperCase()} (${filteredMatches.length}) ===`);
    this.displayMatches(filteredMatches);
  }

  /**
   * Display matches by league
   * @param {Array<Match>} matches - Array of all matches
   * @param {string} leagueName - League name to filter by
   */
  displayMatchesByLeague(matches, leagueName) {
    const filteredMatches = this.matchService.filterByLeague(matches, leagueName);
    console.log(`\n=== MATCHES IN LEAGUE: ${leagueName.toUpperCase()} (${filteredMatches.length}) ===`);
    this.displayMatches(filteredMatches);
  }

  /**
   * Search and display matches
   * @param {Array<Match>} matches - Array of all matches
   * @param {string} searchTerm - Search term
   */
  searchAndDisplayMatches(matches, searchTerm) {
    const searchResults = this.matchService.searchMatches(matches, searchTerm);
    console.log(`\n=== SEARCH RESULTS FOR: "${searchTerm}" (${searchResults.length}) ===`);
    this.displayMatches(searchResults);
  }

  /**
   * Display available leagues
   * @param {Array<Match>} matches - Array of all matches
   */
  displayAvailableLeagues(matches) {
    const leagues = this.matchService.getUniqueLeagues(matches);
    console.log('\n=== AVAILABLE LEAGUES ===');
    leagues.forEach((league, index) => {
      console.log(`${index + 1}. ${league}`);
    });
  }

  /**
   * Main method to process and display all match information
   * @returns {Promise<void>}
   */
  async processAndDisplayAllMatches() {
    try {
      const matches = await this.matchService.fetchMatches();
      
      // Display all matches
      this.displayMatches(matches);
      
      // Display statistics
      this.displayStatistics(matches);
      
      // Display categorized matches
      this.displayFinishedMatches(matches);
      this.displayUpcomingMatches(matches);
      this.displayLiveMatches(matches);
      
      // Save processed data
      await this.matchService.saveProcessedMatches(matches);
      
    } catch (error) {
      console.error('Failed to process matches:', error.message);
      throw error;
    }
  }
}

module.exports = MatchController; 