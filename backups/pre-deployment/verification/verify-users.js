const { Client } = require('pg');

async function verifyUsers() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 
        `postgres://${process.env.DATABASE_USERNAME || 'postgres'}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST || '127.0.0.1'}:${process.env.DATABASE_PORT || 5432}/${process.env.DATABASE_NAME || 'strapi-marketplace-v5'}`
    });
    
    try {
        await client.connect();
        
        const userStats = await client.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN confirmed = true THEN 1 END) as confirmed_users,
                COUNT(CASE WHEN confirmed = false THEN 1 END) as unconfirmed_users,
                COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as users_with_email,
                COUNT(CASE WHEN username IS NOT NULL THEN 1 END) as users_with_username,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_users
            FROM up_users 
            WHERE provider = 'local' OR provider IS NULL
        `);
        
        const stats = userStats.rows[0];
        
        console.log('=== USER DATA VERIFICATION ===');
        console.log(`Total users: ${stats.total_users}`);
        console.log(`Confirmed users: ${stats.confirmed_users}`);
        console.log(`Unconfirmed users: ${stats.unconfirmed_users}`);
        console.log(`Users with email: ${stats.users_with_email}`);
        console.log(`Users with username: ${stats.users_with_username}`);
        console.log(`Recent users (30 days): ${stats.recent_users}`);
        
        // Critical checks
        if (stats.total_users === '0') {
            console.error('❌ CRITICAL: No users found in database!');
            process.exit(1);
        }
        
        if (stats.users_with_email !== stats.total_users) {
            console.warn('⚠️  WARNING: Some users missing email addresses');
        }
        
        // Save stats to file
        const fs = require('fs');
        fs.writeFileSync('verification-stats.json', JSON.stringify(stats, null, 2));
        
        console.log('✅ User data verification completed');
        
    } catch (error) {
        console.error('❌ User verification failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

verifyUsers();
