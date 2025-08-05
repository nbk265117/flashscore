# Time Filter Feature

## Overview

The time filter allows you to quickly find upcoming matches scheduled for specific times. This is particularly useful for planning your viewing schedule or finding matches at convenient times.

## How to Use

### 1. Basic Time Filtering

1. **Select a Time**: Choose a specific time from the "Time" dropdown (e.g., "19:00")
2. **View Results**: All upcoming matches scheduled from that time onwards will be displayed
3. **Highlighted Times**: All matching times from the selected time onwards are highlighted with a yellow background

### 2. Combined Filtering

You can combine the time filter with other filters:

- **Time + Status**: Select "22:00" and "Upcoming" to see only upcoming matches at 22:00
- **Time + League**: Select "22:00" and a specific league to see matches in that league at 22:00
- **Time + Search**: Select "22:00" and search for a team name

### 3. Quick Actions

- **Show All Upcoming**: Click the green "Show All Upcoming" button to quickly view all upcoming matches
- **Reset Filters**: Select "All Times" to remove time filtering

## Example Usage

### Scenario 1: Find all matches from 19:00 onwards
1. Set Status to "Upcoming"
2. Set Time to "19:00"
3. View results showing all matches scheduled from 19:00, 20:00, 21:00, etc.

### Scenario 2: Find Premier League matches from 20:00 onwards
1. Set Status to "Upcoming"
2. Set League to "Premier League"
3. Set Time to "20:00"
4. View results showing Premier League matches from 20:00 onwards

### Scenario 3: Find all upcoming matches for a team
1. Set Status to "Upcoming"
2. Search for team name (e.g., "Manchester")
3. View all upcoming matches for that team

## Available Times

The time filter includes all 24-hour times:
- 00:00 to 23:00 (hourly intervals)
- "All Times" to show all matches regardless of time

## Visual Indicators

- **Highlighted Time**: When a time filter is active, matching times are highlighted in yellow
- **Status Colors**: 
  - Green: Finished matches
  - Red: Live matches
  - Yellow: Upcoming matches
  - Gray: Other statuses

## Tips

1. **Use with Status Filter**: Always set status to "Upcoming" when using time filter for best results
2. **Combine with Search**: Use the search box to find specific teams at specific times
3. **Check Multiple Times**: You can quickly switch between different times to plan your viewing
4. **Mobile Friendly**: The time filter works on mobile devices for on-the-go planning

## Technical Details

- Time filtering only works with upcoming matches (status: NS)
- Shows matches from the selected time onwards (inclusive)
- Times are extracted from the match date/time data
- Filtering is case-insensitive and real-time
- Results update immediately when filters change 