# Development Guide

## Overview

This guide explains how to use nodemon for automatic server restart during development.

## Available Development Scripts

### 1. Basic Development Commands

```bash
# Start the main application with auto-restart
npm run dev

# Start the server with auto-restart
npm run server:dev

# Start the app processor with auto-restart
npm run app:dev

# Start the web server with auto-restart
npm run serve:dev
```

### 2. Full Development Environment

```bash
# Start both app processor and web server with auto-restart
npm run dev:full
```

This runs both the match processor and web server simultaneously with automatic restart on file changes.

## Nodemon Configuration

The `nodemon.json` file configures what files to watch and ignore:

### Watched Files
- `src/` - All source code
- `public/` - Web interface files
- `config/` - Configuration files
- `index.js` - Main entry point
- `server.js` - Server entry point

### Ignored Files
- `node_modules/` - Dependencies
- `data/` - Data files (don't restart on data changes)
- `docs/` - Documentation
- `*.log` - Log files
- `*.md` - Markdown files

### File Extensions Watched
- `.js` - JavaScript files
- `.json` - JSON files
- `.html` - HTML files
- `.css` - CSS files

## Development Workflow

### 1. Start Development Mode

```bash
# Option 1: Full development environment
npm run dev:full

# Option 2: Individual components
npm run server:dev  # Web server only
npm run app:dev     # App processor only
```

### 2. Make Changes

Edit any file in the watched directories:
- `src/` - Backend code changes
- `public/` - Frontend changes
- `config/` - Configuration changes

### 3. Automatic Restart

Nodemon will automatically:
- Detect file changes
- Restart the appropriate process
- Show restart messages
- Maintain the development environment

## Development Features

### 1. Verbose Logging
- Shows which files triggered restarts
- Displays restart messages with emojis
- Logs crashes and exits

### 2. Graceful Shutdown
- Handles Ctrl+C properly
- Stops all child processes
- Cleans up resources

### 3. Environment Variables
- Sets `NODE_ENV=development`
- Enables debug logging
- Configures development settings

## Troubleshooting

### 1. Server Not Restarting
- Check if file is in watched directory
- Verify file extension is watched
- Ensure file is not in ignored list

### 2. Multiple Restarts
- Nodemon has a 1-second delay to prevent rapid restarts
- Check for file watchers in your editor
- Verify no circular dependencies

### 3. Port Already in Use
- Kill existing processes: `pkill -f node`
- Change port in `config/app.config.js`
- Use different port: `PORT=3001 npm run server:dev`

## Best Practices

### 1. File Organization
- Keep source files in `src/`
- Put static files in `public/`
- Store data in `data/`
- Keep config in `config/`

### 2. Development Workflow
- Use `npm run dev:full` for full development
- Use individual scripts for focused development
- Check logs for restart messages
- Test changes immediately

### 3. Code Changes
- Make small, incremental changes
- Test after each restart
- Use console.log for debugging
- Check browser console for frontend issues

## Environment Variables

Set these for development:

```bash
export NODE_ENV=development
export LOG_LEVEL=debug
export PORT=3000
```

## Monitoring

### 1. Console Output
- Restart messages with timestamps
- Error messages with stack traces
- Process status updates

### 2. Browser Console
- Frontend JavaScript errors
- Network request logs
- Filter application logs

### 3. File System
- Watch for file changes
- Monitor log files
- Check data file updates

## Performance Tips

### 1. Optimize File Watching
- Exclude unnecessary directories
- Use specific file extensions
- Avoid watching large directories

### 2. Reduce Restart Frequency
- Make changes in batches
- Use appropriate file extensions
- Avoid unnecessary file saves

### 3. Memory Management
- Monitor memory usage
- Restart if memory grows large
- Use garbage collection hints

This development setup provides a smooth, efficient development experience with automatic restarts and comprehensive monitoring. 