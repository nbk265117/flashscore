const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static files from public directory
app.use(express.static('public'));

// Serve data files
app.use('/data', express.static('data'));

// Serve images
app.use('/images', express.static('public/images'));

// Main route - serve analysis.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'analysis.html'));
});

// API route for analysis data
app.get('/api/analysis', (req, res) => {
    res.sendFile(path.join(__dirname, 'data', 'analysis.json'));
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Analysis page: http://localhost:${PORT}/analysis.html`);
    console.log(`📁 Static files: http://localhost:${PORT}/public/`);
    console.log(`💾 Data files: http://localhost:${PORT}/data/`);
});

module.exports = app;
