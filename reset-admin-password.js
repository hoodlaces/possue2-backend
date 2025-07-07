const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const dbConfig = {
  host: process.env.DATABASE_HOST || '127.0.0.1',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'strapi-marketplace-v5',
  user: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD
};

async function resetPassword() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    // Hash the new password
    const newPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the admin user's password
    const result = await client.query(
      'UPDATE admin_users SET password = $1 WHERE email = $2 RETURNING id, email',
      [hashedPassword, 'info@possue.com']
    );
    
    if (result.rowCount > 0) {
      console.log('✅ Password successfully reset for:', result.rows[0].email);
      console.log('📧 Email: info@possue.com');
      console.log('🔑 New Password: Accusync70');
    } else {
      console.log('❌ No user found with email: info@possue.com');
    }
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  } finally {
    await client.end();
  }
}

resetPassword();