# Daily Data Fetch System

This system automatically fetches football match data from the API-Sports API once per day to respect rate limits.

## 🚀 Quick Start

### 1. Manual Execution
```bash
npm run fetch-daily
```

### 2. Automated Execution (Recommended)
```bash
npm run setup-cron
```

## 📋 Features

### API Integration
- **Endpoint**: `https://v3.football.api-sports.io/fixtures`
- **Rate Limit**: 1 call per day
- **Data**: Today's football fixtures
- **Format**: JSON response saved to `data/response.json`

### Automatic Backup
- **Backup Location**: `data/backups/`
- **Format**: `response_YYYY-MM-DD.json`
- **Frequency**: Before each new fetch

### Logging
- **Log Location**: `logs/daily-fetch.log`
- **Content**: Execution status, match count, errors
- **Rotation**: Daily log files

## 🔧 Configuration

### API Settings
```javascript
const API_CONFIG = {
    host: 'v3.football.api-sports.io',
    key: 'de648a1cb23cfb5ccf9df22231faa1d6',
    endpoint: '/fixtures'
};
```

### File Paths
- **Data**: `data/response.json`
- **Backups**: `data/backups/`
- **Logs**: `logs/daily-fetch.log`

## 📅 Cron Job Setup

### Option 1: Manual Setup
```bash
crontab -e
# Add this line:
0 6 * * * cd /path/to/your/project && node scripts/fetch-daily-data.js >> logs/daily-fetch.log 2>&1
```

### Option 2: Automatic Setup
```bash
npm run setup-cron
cat crontab.txt | crontab -
```

### Cron Schedule
- **Time**: Every 15 minutes
- **Timezone**: System default
- **Logging**: All output to log file
- **Rate Limit Protection**: Only makes API call once per day

## 📊 Data Structure

### API Response
```json
{
  "get": "fixtures",
  "parameters": { "date": "2025-08-06" },
  "errors": [],
  "results": 195,
  "paging": { "current": 1, "total": 1 },
  "response": [
    {
      "fixture": {
        "id": 1338476,
        "date": "2025-08-06T00:00:00+00:00",
        "status": { "long": "Match Finished", "short": "FT" }
      },
      "league": { "id": 242, "name": "Liga Pro", "country": "Ecuador" },
      "teams": { "home": { "name": "Delfin SC" }, "away": { "name": "Cuniburo" } },
      "goals": { "home": 3, "away": 3 },
      "score": { "fulltime": { "home": 3, "away": 3 } }
    }
  ]
}
```

## 🔍 Monitoring

### Check Logs
```bash
# View recent logs
tail -f logs/daily-fetch.log

# View today's log
cat logs/daily-fetch.log
```

### Check Data
```bash
# View current data
cat data/response.json

# Check backup
ls -la data/backups/
```

### Test API
```bash
# Manual test
npm run fetch-daily
```

## ⚠️ Error Handling

### Common Issues
1. **API Rate Limit**: Wait 24 hours before retry
2. **Network Issues**: Check internet connection
3. **Invalid API Key**: Verify API key is correct
4. **Disk Space**: Ensure sufficient storage

### Error Recovery
```bash
# Check last backup
ls -la data/backups/

# Restore from backup
cp data/backups/response_2025-08-05.json data/response.json
```

## 🔄 Workflow

### Daily Process
1. **Every 15 minutes**: Cron job triggers
2. **Check**: Verify if data was already fetched today
3. **Skip**: If already fetched today, skip API call
4. **API Call**: Only if not fetched today, fetch today's fixtures
5. **Save**: Data saved to `response.json`
6. **Log**: Results logged to file

### Manual Override
```bash
# Force fetch today's data
npm run fetch-daily

# Check results
cat data/response.json | jq '.response | length'
```

## 📈 Benefits

### Rate Limit Compliance
- **Respects API limits**: 1 call per day
- **Automatic scheduling**: No manual intervention
- **Reliable execution**: Cron job ensures daily runs

### Data Integrity
- **Automatic backups**: Previous data preserved
- **Error logging**: Issues tracked and logged
- **Recovery options**: Backup restoration available

### Integration
- **Seamless updates**: Viewer uses latest data
- **No downtime**: Background updates
- **Consistent format**: Same data structure maintained

## 🛠️ Troubleshooting

### Script Not Executing
```bash
# Check permissions
chmod +x scripts/fetch-daily-data.js

# Test manually
node scripts/fetch-daily-data.js
```

### Cron Not Working
```bash
# Check cron service
sudo service cron status

# List cron jobs
crontab -l

# Check cron logs
sudo tail -f /var/log/cron
```

### API Issues
```bash
# Test API manually
curl -H "x-rapidapi-host: v3.football.api-sports.io" \
     -H "x-apisports-key: de648a1cb23cfb5ccf9df22231faa1d6" \
     "https://v3.football.api-sports.io/fixtures?date=2025-08-06"
```

## 📞 Support

For issues with the daily data fetch system:
1. Check logs: `tail -f logs/daily-fetch.log`
2. Test manually: `npm run fetch-daily`
3. Verify API key and rate limits
4. Check system resources and permissions 