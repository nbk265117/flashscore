# Football Matches Viewer

A Node.js application to fetch, process, and display football match data from JSON files. The application provides both a command-line interface and a web-based viewer for match times and scores.

## Features

- 📊 **Match Data Processing**: Parses football match data from JSON files
- ⏰ **Time Display**: Shows match times in local timezone with status indicators
- 🏆 **Score Tracking**: Displays scores for finished matches and live games
- 🔍 **Filtering**: Filter matches by status, league, and search terms
- 🌐 **Web Interface**: Beautiful, responsive web viewer with real-time filtering
- 📱 **Mobile Friendly**: Responsive design that works on all devices

## Quick Start

### Prerequisites

- Node.js (version 12 or higher)
- npm or yarn

### Installation

1. Clone or download the project files
2. Install dependencies:
   ```bash
   npm install
   ```

### Usage

#### Command Line Interface

Process and display matches from `response.json`:

```bash
npm start
# or
node index.js
```

This will:
- Load match data from `response.json`
- Process and display all matches with times and scores
- Show finished matches with final scores
- Show upcoming matches with scheduled times
- Save processed data to `processed_matches.json`

#### Web Interface

Start the web server to view matches in a browser:

```bash
npm run server
# or
node server.js
```

Then open your browser and go to: `http://localhost:3000`

#### Combined Usage

Process the data and start the web server in one command:

```bash
npm run view
```

## Data Format

The application expects a JSON file (`response.json`) with the following structure:

```json
{
  "response": [
    {
      "fixture": {
        "id": 123456,
        "date": "2025-08-05T00:00:00+00:00",
        "status": {
          "long": "Match Finished",
          "short": "FT"
        },
        "venue": {
          "name": "Stadium Name",
          "city": "City Name"
        },
        "referee": "Referee Name"
      },
      "league": {
        "name": "League Name",
        "country": "Country"
      },
      "teams": {
        "home": {
          "name": "Home Team"
        },
        "away": {
          "name": "Away Team"
        }
      },
      "score": {
        "fulltime": {
          "home": 2,
          "away": 1
        },
        "halftime": {
          "home": 1,
          "away": 0
        }
      }
    }
  ]
}
```

## Match Status Codes

The application recognizes the following match status codes:

- `NS` - Not Started
- `1H` - First Half
- `HT` - Half Time
- `2H` - Second Half
- `FT` - Full Time
- `AET` - After Extra Time
- `PEN` - Penalties
- `BT` - Break Time
- `SUSP` - Suspended
- `INT` - Interrupted
- `PST` - Postponed
- `CANC` - Cancelled
- `ABD` - Abandoned
- `AWD` - Technical Loss
- `WO` - Walkover
- `LIVE` - Live

## Web Interface Features

### Filtering Options

- **Status Filter**: Filter by match status (Finished, Upcoming, Live, etc.)
- **League Filter**: Filter by specific leagues
- **Search**: Search for teams or leagues by name

### Display Features

- **Match Cards**: Each match displayed in an attractive card format
- **Score Display**: Clear score display for finished matches
- **Time Information**: Localized time display with status indicators
- **Venue Information**: Stadium and city information when available
- **Referee Information**: Referee details when available

### Statistics

The web interface shows real-time statistics:
- Total matches
- Finished matches
- Upcoming matches

## File Structure

```
Zbet/
├── index.js              # Main application logic
├── server.js             # HTTP server for web interface
├── viewer.html           # Web interface
├── response.json         # Input data file
├── processed_matches.json # Output data file
├── package.json          # Project configuration
└── README.md            # This file
```

## API Reference

### MatchesFetcher Class

The main class for processing match data.

#### Methods

- `loadResponseData()` - Loads data from response.json
- `fetchMatches()` - Fetches and processes all matches
- `processMatches(data)` - Processes raw data into match objects
- `formatMatchTime(dateString, status)` - Formats match time display
- `formatScore(score, status)` - Formats score display
- `getMatchStatus(status)` - Converts status codes to readable text
- `displayMatches(matches)` - Displays matches in console
- `saveProcessedMatches(matches, filename)` - Saves processed data
- `getFinishedMatches(matches)` - Filters finished matches
- `getUpcomingMatches(matches)` - Filters upcoming matches

## Examples

### Basic Usage

```javascript
const MatchesFetcher = require('./index.js');

async function main() {
    const fetcher = new MatchesFetcher();
    const matches = await fetcher.fetchMatches();
    
    // Get finished matches
    const finished = fetcher.getFinishedMatches(matches);
    console.log(`Found ${finished.length} finished matches`);
    
    // Get upcoming matches
    const upcoming = fetcher.getUpcomingMatches(matches);
    console.log(`Found ${upcoming.length} upcoming matches`);
}

main();
```

### Custom Processing

```javascript
const fetcher = new MatchesFetcher();

// Process matches by specific status
const liveMatches = fetcher.getMatchesByStatus(matches, '1H');
console.log(`Live matches: ${liveMatches.length}`);

// Save custom processed data
await fetcher.saveProcessedMatches(matches, 'my_matches.json');
```

## Troubleshooting

### Common Issues

1. **"Error reading response.json"**
   - Ensure `response.json` exists in the project directory
   - Check that the JSON file is valid

2. **"SyntaxError: Unexpected token"**
   - Make sure you're using Node.js version 12 or higher
   - The application uses modern JavaScript features

3. **Web interface not loading**
   - Ensure the server is running on port 3000
   - Check that `processed_matches.json` exists
   - Try refreshing the browser page

4. **No matches displayed**
   - Verify the JSON structure matches the expected format
   - Check that the `response` array contains match data

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

### Adding New Features

1. Modify `index.js` for backend logic
2. Update `viewer.html` for frontend changes
3. Test with `npm start` and `npm run server`

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Enjoy watching football matches! ⚽** 