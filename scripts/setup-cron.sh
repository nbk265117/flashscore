#!/bin/bash

echo "⏰ Setting up daily automatic deployment..."

# Get the current directory
CURRENT_DIR=$(pwd)

# Create the cron job command
CRON_JOB="0 9 * * * cd $CURRENT_DIR && bash scripts/update-data.sh >> logs/deploy.log 2>&1"

# Add the cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job added successfully!"
echo "📅 Daily deployment scheduled at 9:00 AM"
echo "📝 Logs will be saved to logs/deploy.log"

# Create logs directory
mkdir -p logs

echo "🎉 Automatic deployment setup completed!"
echo "📋 To view scheduled jobs: crontab -l"
echo "📋 To remove scheduled jobs: crontab -r" 