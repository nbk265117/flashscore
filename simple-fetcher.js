import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SimpleMatchesFetcher {
  constructor() {
    this.responsePath = path.join(__dirname, 'response.json');
  }

  async loadResponseData() {
    try {
      const data = await fs.readFile(this.responsePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading response.json:', error.message);
      throw error;
    }
  }

  async fetchMatches() {
    try {
      console.log('Loading matches from response.json...');
      const data = await this.loadResponseData();
      
      // Process the matches data
      const matches = this.processMatches(data);
      
      console.log(`Found ${matches.length} matches`);
      return matches;
    } catch (error) {
      console.error('Error fetching matches:', error.message);
      throw error;
    }
  }

  processMatches(data) {
    // Handle different possible data structures
    if (Array.isArray(data)) {
      return data;
    } else if (data.matches) {
      return data.matches;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else {
      console.log('Data structure:', JSON.stringify(data, null, 2));
      return [];
    }
  }

  displayMatches(matches) {
    console.log('\n=== MATCHES ===');
    matches.forEach((match, index) => {
      console.log(`${index + 1}. ${match.homeTeam} vs ${match.awayTeam}`);
      console.log(`   Date: ${match.date} | Time: ${match.time}`);
      console.log(`   Competition: ${match.competition} | Venue: ${match.venue}`);
      console.log(`   Status: ${match.status}`);
      console.log('');
    });
  }

  async saveProcessedMatches(matches, filename = 'processed_matches.json') {
    try {
      const outputPath = path.join(__dirname, filename);
      await fs.writeFile(outputPath, JSON.stringify(matches, null, 2));
      console.log(`Processed matches saved to ${filename}`);
    } catch (error) {
      console.error('Error saving processed matches:', error.message);
    }
  }

  // Additional utility methods
  filterMatchesByCompetition(matches, competition) {
    return matches.filter(match => 
      match.competition && match.competition.toLowerCase().includes(competition.toLowerCase())
    );
  }

  filterMatchesByDate(matches, date) {
    return matches.filter(match => match.date === date);
  }

  sortMatchesByDate(matches) {
    return matches.sort((a, b) => new Date(a.date) - new Date(b.date));
  }
}

// Main execution
async function main() {
  const fetcher = new SimpleMatchesFetcher();
  
  try {
    const matches = await fetcher.fetchMatches();
    fetcher.displayMatches(matches);
    await fetcher.saveProcessedMatches(matches);

    // Example of additional filtering
    console.log('\n=== PREMIER LEAGUE MATCHES ===');
    const premierLeagueMatches = fetcher.filterMatchesByCompetition(matches, 'Premier League');
    premierLeagueMatches.forEach((match, index) => {
      console.log(`${index + 1}. ${match.homeTeam} vs ${match.awayTeam} (${match.date})`);
    });

    console.log('\n=== SORTED BY DATE ===');
    const sortedMatches = fetcher.sortMatchesByDate(matches);
    sortedMatches.forEach((match, index) => {
      console.log(`${index + 1}. ${match.date} - ${match.homeTeam} vs ${match.awayTeam}`);
    });

  } catch (error) {
    console.error('Failed to process matches:', error.message);
    process.exit(1);
  }
}

// Run the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default SimpleMatchesFetcher; 