// Debug environment variables
console.log('=== ENVIRONMENT DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL starts with postgres:', process.env.DATABASE_URL?.startsWith('postgres'));
console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length);

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is missing!');
  process.exit(1);
}

if (!process.env.DATABASE_URL.startsWith('postgres')) {
  console.error('❌ DATABASE_URL malformed:', process.env.DATABASE_URL.substring(0, 20) + '...');
  process.exit(1);
}

console.log('✅ DATABASE_URL looks good');