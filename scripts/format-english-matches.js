const fs = require('fs');
const path = require('path');

// Read the English matches JSON file
const englishMatchesData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'english_matches_complete_2025_08_25.json'), 'utf8'));

console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLISH LEAGUE MATCHES - AUGUST 25, 2025');
console.log('=' .repeat(60));
console.log('');

// Format matches as "X vs Y (League A)"
englishMatchesData.leagues.forEach(league => {
  console.log(`🏆 ${league.name} (${league.matchCount} matches):`);
  console.log('-'.repeat(40));
  
  league.matches.forEach(match => {
    const matchTime = new Date(match.date).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    console.log(`   ${match.homeTeam} vs ${match.awayTeam} (${matchTime})`);
  });
  
  console.log('');
});

console.log('📊 SUMMARY:');
console.log(`   Total matches: ${englishMatchesData.metadata.totalMatches}`);
console.log(`   Total leagues: ${englishMatchesData.metadata.totalLeagues}`);
console.log(`   Date: ${englishMatchesData.metadata.date}`);
