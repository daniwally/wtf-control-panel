// Minimal server for debugging
const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

console.log('🚀 Starting simple server...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);

if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL preview:', process.env.DATABASE_URL.substring(0, 20) + '...');
    console.log('DATABASE_URL protocol:', process.env.DATABASE_URL.split('://')[0]);
}

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        env: {
            NODE_ENV: process.env.NODE_ENV,
            DATABASE_URL_PRESENT: !!process.env.DATABASE_URL
        }
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'WTF Control Panel API - Debug Mode',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Simple server running on port ${PORT}`);
    console.log(`💗 Health check: http://localhost:${PORT}/health`);
});