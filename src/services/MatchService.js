const fs = require('fs').promises;
const path = require('path');
const Match = require('../models/Match');

/**
 * Match Service
 * Handles all match-related business logic and data operations
 */
class MatchService {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data');
    this.responsePath = path.join(this.dataPath, 'response.json');
    this.processedPath = path.join(this.dataPath, 'processed_matches.json');
  }

  /**
   * Load raw data from response.json
   * @returns {Promise<object>} Raw data object
   */
  async loadRawData() {
    try {
      const data = await fs.readFile(this.responsePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to load response data: ${error.message}`);
    }
  }

  /**
   * Process raw data into Match objects
   * @param {object} rawData - Raw data from response.json
   * @returns {Array<Match>} Array of Match objects
   */
  processRawData(rawData) {
    if (!rawData.response || !Array.isArray(rawData.response)) {
      throw new Error('Invalid data structure: missing or invalid response array');
    }

    return rawData.response.map(matchData => new Match(matchData));
  }

  /**
   * Fetch and process all matches
   * @returns {Promise<Array<Match>>} Array of processed matches
   */
  async fetchMatches() {
    try {
      console.log('Loading matches from response.json...');
      const rawData = await this.loadRawData();
      const matches = this.processRawData(rawData);
      
      console.log(`Successfully processed ${matches.length} matches`);
      return matches;
    } catch (error) {
      console.error('Error fetching matches:', error.message);
      throw error;
    }
  }

  /**
   * Filter matches by status
   * @param {Array<Match>} matches - Array of matches to filter
   * @param {string} statusFilter - Status code to filter by
   * @returns {Array<Match>} Filtered matches
   */
  filterByStatus(matches, statusFilter) {
    return matches.filter(match => 
      match.status.short === statusFilter || 
      match.status.long.toLowerCase().includes(statusFilter.toLowerCase())
    );
  }

  /**
   * Get finished matches
   * @param {Array<Match>} matches - Array of matches to filter
   * @returns {Array<Match>} Finished matches
   */
  getFinishedMatches(matches) {
    return matches.filter(match => match.isFinished());
  }

  /**
   * Get upcoming matches
   * @param {Array<Match>} matches - Array of matches to filter
   * @returns {Array<Match>} Upcoming matches
   */
  getUpcomingMatches(matches) {
    return matches.filter(match => match.isUpcoming());
  }

  /**
   * Get live matches
   * @param {Array<Match>} matches - Array of matches to filter
   * @returns {Array<Match>} Live matches
   */
  getLiveMatches(matches) {
    return matches.filter(match => match.isLive());
  }

  /**
   * Filter matches by league
   * @param {Array<Match>} matches - Array of matches to filter
   * @param {string} leagueName - League name to filter by
   * @returns {Array<Match>} Filtered matches
   */
  filterByLeague(matches, leagueName) {
    return matches.filter(match => 
      match.league.name.toLowerCase().includes(leagueName.toLowerCase())
    );
  }

  /**
   * Search matches by team name
   * @param {Array<Match>} matches - Array of matches to search
   * @param {string} searchTerm - Search term
   * @returns {Array<Match>} Matching matches
   */
  searchMatches(matches, searchTerm) {
    const term = searchTerm.toLowerCase();
    return matches.filter(match => 
      match.teams.home.name.toLowerCase().includes(term) ||
      match.teams.away.name.toLowerCase().includes(term) ||
      match.league.name.toLowerCase().includes(term)
    );
  }

  /**
   * Get unique leagues from matches
   * @param {Array<Match>} matches - Array of matches
   * @returns {Array<string>} Array of unique league names
   */
  getUniqueLeagues(matches) {
    return [...new Set(matches.map(match => match.league.name))].sort();
  }

  /**
   * Get match statistics
   * @param {Array<Match>} matches - Array of matches
   * @returns {object} Statistics object
   */
  getMatchStatistics(matches) {
    return {
      total: matches.length,
      finished: this.getFinishedMatches(matches).length,
      upcoming: this.getUpcomingMatches(matches).length,
      live: this.getLiveMatches(matches).length,
      leagues: this.getUniqueLeagues(matches).length
    };
  }

  /**
   * Save processed matches to JSON file
   * @param {Array<Match>} matches - Array of matches to save
   * @param {string} filename - Output filename
   * @returns {Promise<void>}
   */
  async saveProcessedMatches(matches, filename = 'processed_matches.json') {
    try {
      // Ensure data directory exists
      await fs.mkdir(this.dataPath, { recursive: true });
      
      const outputPath = path.join(this.dataPath, filename);
      const processedData = matches.map(match => match.toJSON());
      
      await fs.writeFile(outputPath, JSON.stringify(processedData, null, 2));
      console.log(`Processed matches saved to ${filename}`);
    } catch (error) {
      throw new Error(`Failed to save processed matches: ${error.message}`);
    }
  }

  /**
   * Load processed matches from JSON file
   * @param {string} filename - Input filename
   * @returns {Promise<Array<object>>} Array of match objects
   */
  async loadProcessedMatches(filename = 'processed_matches.json') {
    try {
      const filePath = path.join(this.dataPath, filename);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to load processed matches: ${error.message}`);
    }
  }

  /**
   * Get all matches - tries processed_matches.json first, then falls back to analysis.json
   * @returns {Promise<Array<object>>} Array of match objects
   */
  async getAllMatches() {
    try {
      // First try to load from processed_matches.json
      try {
        const processedData = await this.loadProcessedMatches('processed_matches.json');
        if (processedData && processedData.matches && Array.isArray(processedData.matches)) {
          console.log(`Loaded ${processedData.matches.length} matches from processed_matches.json`);
          return processedData.matches;
        }
      } catch (error) {
        console.log('processed_matches.json not found, trying analysis.json...');
      }

      // Fallback to analysis.json
      const analysisPath = path.join(this.dataPath, 'analysis.json');
      const analysisData = JSON.parse(await fs.readFile(analysisPath, 'utf8'));
      
      if (analysisData && analysisData.analyses && Array.isArray(analysisData.analyses)) {
        console.log(`Loaded ${analysisData.analyses.length} matches from analysis.json`);
        return analysisData.analyses;
      }
      
      throw new Error('No valid match data found in either processed_matches.json or analysis.json');
    } catch (error) {
      throw new Error(`Failed to load matches: ${error.message}`);
    }
  }
}

module.exports = MatchService; 