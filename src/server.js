const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const Logger = require('./utils/Logger');
const config = require('../config/app.config');

/**
 * HTTP Server Class
 * Handles serving the web interface and static files
 */
class HttpServer {
  constructor() {
    this.port = config.server.port;
    this.host = config.server.host;
    this.mimeTypes = this.getMimeTypes();
  }

  /**
   * Get MIME types for different file extensions
   * @returns {object} MIME types mapping
   */
  getMimeTypes() {
    return {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.woff': 'application/font-woff',
      '.ttf': 'application/font-ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'application/font-otf',
      '.wasm': 'application/wasm'
    };
  }

  /**
   * Create HTTP server
   * @returns {http.Server} HTTP server instance
   */
  createServer() {
    return http.createServer((req, res) => {
      this.handleRequest(req, res);
    });
  }

  /**
   * Handle incoming HTTP requests
   * @param {http.IncomingMessage} req - Request object
   * @param {http.ServerResponse} res - Response object
   */
  handleRequest(req, res) {
    Logger.info(`${req.method} ${req.url}`);

    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;

    // Default to viewer.html if root is requested
    if (pathname === '/') {
      pathname = '/viewer.html';
    }

    this.serveFile(pathname, res);
  }

  /**
   * Serve static files
   * @param {string} pathname - Requested file path
   * @param {http.ServerResponse} res - Response object
   */
  serveFile(pathname, res) {
    // Determine file path based on file type
    let filePath;
    
    // Handle data files (JSON files in data directory)
    if (pathname.startsWith('/data/') && pathname.endsWith('.json')) {
      filePath = path.join(__dirname, '..', pathname);
    } else if (pathname.endsWith('.html') || pathname.endsWith('.js') || pathname.endsWith('.css')) {
      filePath = path.join(__dirname, '../public', pathname);
    } else if (pathname.endsWith('.json')) {
      filePath = path.join(__dirname, '../data', pathname);
    } else {
      filePath = path.join(__dirname, '../public', pathname);
    }

    const extname = path.extname(filePath).toLowerCase();
    const contentType = this.mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        this.handleError(err, res);
      } else {
        this.sendResponse(res, contentType, content);
      }
    });
  }

  /**
   * Handle file read errors
   * @param {Error} err - Error object
   * @param {http.ServerResponse} res - Response object
   */
  handleError(err, res) {
    if (err.code === 'ENOENT') {
      this.sendErrorResponse(res, 404, 'File Not Found');
    } else {
      Logger.error(`Server error: ${err.message}`);
      this.sendErrorResponse(res, 500, 'Internal Server Error');
    }
  }

  /**
   * Send successful response
   * @param {http.ServerResponse} res - Response object
   * @param {string} contentType - Content type
   * @param {Buffer} content - File content
   */
  sendResponse(res, contentType, content) {
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  }

  /**
   * Send error response
   * @param {http.ServerResponse} res - Response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   */
  sendErrorResponse(res, statusCode, message) {
    const html = `
      <html>
        <head><title>${statusCode} ${message}</title></head>
        <body>
          <h1>${statusCode} ${message}</h1>
          <p>The requested resource was not found on this server.</p>
          <p><a href="/">Go to Football Matches Viewer</a></p>
        </body>
      </html>
    `;

    res.writeHead(statusCode, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  /**
   * Start the server
   */
  start() {
    const server = this.createServer();
    
    server.listen(this.port, this.host, () => {
      Logger.success(`🚀 Server running at http://${this.host}:${this.port}`);
      Logger.info(`📊 Football Matches Viewer available at http://${this.host}:${this.port}/viewer.html`);
      Logger.info(`📁 Serving files from: ${path.resolve(__dirname, '../')}`);
      Logger.info(`⏹️  Press Ctrl+C to stop the server`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      Logger.info('🛑 Shutting down server...');
      server.close(() => {
        Logger.success('✅ Server closed');
        process.exit(0);
      });
    });

    return server;
  }
}

// Start server if this file is executed directly
if (require.main === module) {
  const server = new HttpServer();
  server.start();
}

module.exports = HttpServer; 