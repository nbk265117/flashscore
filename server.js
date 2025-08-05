#!/usr/bin/env node

/**
 * HTTP Server Entry Point
 * 
 * This is the entry point for the HTTP server that serves
 * the web interface for the football matches application.
 */

const HttpServer = require('./src/server');

// Start the server
const server = new HttpServer();
server.start(); 