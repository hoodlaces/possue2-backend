const { parse } = require("pg-connection-string");
const { Client } = require('pg');

async function testConnection() {
  console.log('Testing database connection...\n');
  
  // Test with DATABASE_URL if available
  if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL is set');
    console.log('Raw DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
    
    try {
      // Parse the connection string
      const config = parse(process.env.DATABASE_URL);
      console.log('\nParsed configuration:');
      console.log('- Host:', config.host);
      console.log('- Port:', config.port);
      console.log('- Database:', config.database);
      console.log('- User:', config.user);
      console.log('- Password:', config.password ? '****' : 'NOT SET');
      
      // Test direct connection
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      
      await client.connect();
      console.log('\n✅ Successfully connected to database!');
      
      const result = await client.query('SELECT current_database(), current_user');
      console.log('Connected to database:', result.rows[0].current_database);
      console.log('Connected as user:', result.rows[0].current_user);
      
      await client.end();
    } catch (error) {
      console.error('\n❌ Connection failed:', error.message);
      if (error.message.includes('password authentication failed')) {
        console.log('\nPossible issues:');
        console.log('1. Password contains special characters that need URL encoding');
        console.log('2. Wrong password in DATABASE_URL');
        console.log('3. User does not exist in the database');
      }
    }
  } else {
    // Test with individual env vars
    console.log('DATABASE_URL not set, using individual environment variables:');
    console.log('- DATABASE_HOST:', process.env.DATABASE_HOST || 'NOT SET');
    console.log('- DATABASE_PORT:', process.env.DATABASE_PORT || 'NOT SET');
    console.log('- DATABASE_NAME:', process.env.DATABASE_NAME || 'NOT SET');
    console.log('- DATABASE_USERNAME:', process.env.DATABASE_USERNAME || 'NOT SET');
    console.log('- DATABASE_PASSWORD:', process.env.DATABASE_PASSWORD ? '****' : 'NOT SET');
    
    if (!process.env.DATABASE_HOST || !process.env.DATABASE_NAME || !process.env.DATABASE_USERNAME) {
      console.error('\n❌ Missing required environment variables');
      return;
    }
    
    try {
      const client = new Client({
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        database: process.env.DATABASE_NAME,
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
      });
      
      await client.connect();
      console.log('\n✅ Successfully connected to database!');
      
      const result = await client.query('SELECT current_database(), current_user');
      console.log('Connected to database:', result.rows[0].current_database);
      console.log('Connected as user:', result.rows[0].current_user);
      
      await client.end();
    } catch (error) {
      console.error('\n❌ Connection failed:', error.message);
    }
  }
}

// Run the test
testConnection().catch(console.error);