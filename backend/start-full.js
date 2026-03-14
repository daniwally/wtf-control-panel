// Force start the full server
console.log('🚀 Starting FULL WTF Control Panel Backend...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);

// Start the main server
require('./src/server.js');