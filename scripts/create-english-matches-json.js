const fs = require('fs');
const path = require('path');

// Read the matches data
const matchesData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'matches_2025_08_25.json'), 'utf8'));

// Filter English matches
const englishMatches = matchesData.matches.filter(match => match.country === 'England');

// Group by league
const leagues = {};
englishMatches.forEach(match => {
  const leagueName = match.league;
  if (!leagues[leagueName]) {
    leagues[leagueName] = [];
  }
  leagues[leagueName].push(match);
});

// Create the result structure
const result = {
  metadata: {
    date: '2025-08-25',
    country: 'England',
    totalMatches: englishMatches.length,
    totalLeagues: Object.keys(leagues).length,
    generatedAt: new Date().toISOString()
  },
  leagues: Object.keys(leagues).map(leagueName => ({
    name: leagueName,
    matchCount: leagues[leagueName].length,
    matches: leagues[leagueName]
  })).sort((a, b) => b.matchCount - a.matchCount),
  summary: {
    byLevel: {
      'Top Tier': englishMatches.filter(m => m.league === 'Premier League').length,
      'U21 Development': englishMatches.filter(m => m.league.includes('U21') || m.league.includes('Development')).length,
      'Professional Non-League': englishMatches.filter(m => m.league.includes('National League')).length,
      'Semi-Professional': englishMatches.filter(m => !m.league.includes('Premier League') && !m.league.includes('U21') && !m.league.includes('Development') && !m.league.includes('National League')).length
    }
  }
};

// Write to file
const outputPath = path.join(__dirname, '..', 'data', 'english_matches_complete_2025_08_25.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log('✅ Complete English matches JSON file created!');
console.log(`📁 File: ${outputPath}`);
console.log(`📊 Total matches: ${result.metadata.totalMatches}`);
console.log(`🏆 Total leagues: ${result.metadata.totalLeagues}`);
console.log('\n📋 League breakdown:');
result.leagues.forEach(league => {
  console.log(`   ${league.name}: ${league.matchCount} matches`);
});
