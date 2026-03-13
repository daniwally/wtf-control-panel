// Debug environment variables
console.log('=== ENVIRONMENT DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL starts with postgres:', process.env.DATABASE_URL.startsWith('postgres'));
  console.log('DATABASE_URL length:', process.env.DATABASE_URL.length);
  console.log('✅ DATABASE_URL found, continuing...');
} else {
  console.error('❌ DATABASE_URL is missing! Will skip Prisma for now.');
}

console.log('=== DEBUG COMPLETE, STARTING SERVER ===');