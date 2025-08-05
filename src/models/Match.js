/**
 * Match Model
 * Represents a football match with all its properties and methods
 */
class Match {
  constructor(data) {
    this.id = (data.fixture && data.fixture.id) || null;
    this.date = (data.fixture && data.fixture.date) || null;
    this.status = (data.fixture && data.fixture.status) || {};
    this.venue = (data.fixture && data.fixture.venue) || {};
    this.referee = (data.fixture && data.fixture.referee) || null;
    
    this.league = {
      name: (data.league && data.league.name) || '',
      country: (data.league && data.league.country) || ''
    };
    
    this.teams = {
      home: {
        id: (data.teams && data.teams.home && data.teams.home.id) || null,
        name: (data.teams && data.teams.home && data.teams.home.name) || '',
        logo: (data.teams && data.teams.home && data.teams.home.logo) || '',
        winner: (data.teams && data.teams.home && data.teams.home.winner) || null
      },
      away: {
        id: (data.teams && data.teams.away && data.teams.away.id) || null,
        name: (data.teams && data.teams.away && data.teams.away.name) || '',
        logo: (data.teams && data.teams.away && data.teams.away.logo) || '',
        winner: (data.teams && data.teams.away && data.teams.away.winner) || null
      }
    };
    
    this.score = data.score || {};
    this.goals = data.goals || {};
  }

  /**
   * Get formatted match time
   * @returns {string} Formatted time string
   */
  getFormattedTime() {
    if (!this.date) return 'Invalid date';
    
    try {
      const date = new Date(this.date);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} - ${hours}:${minutes} (${this.status.short})`;
    } catch (error) {
      return `Invalid date: ${this.date}`;
    }
  }

  /**
   * Get formatted score
   * @returns {string} Formatted score string
   */
  getFormattedScore() {
    const status = this.status.short;
    
    if (status === 'FT' || status === 'AET' || status === 'PEN') {
      const homeScore = this.getScore('fulltime', 'home') || this.getScore('halftime', 'home') || '?';
      const awayScore = this.getScore('fulltime', 'away') || this.getScore('halftime', 'away') || '?';
      return `${homeScore} - ${awayScore}`;
    } else if (status === 'HT') {
      const homeScore = this.getScore('halftime', 'home') || '?';
      const awayScore = this.getScore('halftime', 'away') || '?';
      return `${homeScore} - ${awayScore} (HT)`;
    } else if (status === '1H' || status === '2H') {
      const homeScore = this.getScore('fulltime', 'home') || this.getScore('halftime', 'home') || '?';
      const awayScore = this.getScore('fulltime', 'away') || this.getScore('halftime', 'away') || '?';
      return `${homeScore} - ${awayScore} (${status})`;
    } else {
      return 'TBD';
    }
  }

  /**
   * Get score from specific period and team
   * @param {string} period - 'fulltime' or 'halftime'
   * @param {string} team - 'home' or 'away'
   * @returns {number|null} Score value
   */
  getScore(period, team) {
    return this.score[period] && this.score[period][team] !== null 
      ? this.score[period][team] 
      : null;
  }

  /**
   * Check if match is finished
   * @returns {boolean} True if match is finished
   */
  isFinished() {
    return ['FT', 'AET', 'PEN'].includes(this.status.short);
  }

  /**
   * Check if match is upcoming
   * @returns {boolean} True if match hasn't started
   */
  isUpcoming() {
    return this.status.short === 'NS';
  }

  /**
   * Check if match is live
   * @returns {boolean} True if match is in progress
   */
  isLive() {
    return ['1H', '2H', 'HT'].includes(this.status.short);
  }

  /**
   * Get match status description
   * @returns {string} Human readable status
   */
  getStatusDescription() {
    const statusMap = {
      'NS': 'Not Started',
      '1H': 'First Half',
      'HT': 'Half Time',
      '2H': 'Second Half',
      'FT': 'Full Time',
      'AET': 'After Extra Time',
      'PEN': 'Penalties',
      'BT': 'Break Time',
      'SUSP': 'Suspended',
      'INT': 'Interrupted',
      'PST': 'Postponed',
      'CANC': 'Cancelled',
      'ABD': 'Abandoned',
      'AWD': 'Technical Loss',
      'WO': 'Walkover',
      'LIVE': 'Live'
    };
    
    return statusMap[this.status.short] || this.status.long || 'Unknown';
  }

  /**
   * Get venue information
   * @returns {string} Formatted venue string
   */
  getVenueInfo() {
    if (!this.venue.name) return '';
    return this.venue.city ? `${this.venue.name}, ${this.venue.city}` : this.venue.name;
  }

  /**
   * Convert to plain object for JSON serialization
   * @returns {object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      homeTeam: this.teams.home.name,
      awayTeam: this.teams.away.name,
      league: this.league.name,
      country: this.league.country,
      date: this.date,
      status: this.status,
      score: this.score,
      venue: this.venue,
      referee: this.referee,
      formattedTime: this.getFormattedTime(),
      formattedScore: this.getFormattedScore(),
      isFinished: this.isFinished(),
      isUpcoming: this.isUpcoming(),
      isLive: this.isLive()
    };
  }
}

module.exports = Match; 