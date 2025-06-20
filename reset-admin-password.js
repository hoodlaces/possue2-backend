const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const dbConfig = {
  host: '127.0.0.1',
  port: 5432,
  database: 'strapi-marketplace-v5',
  user: 'postgres',
  password: '1212'
};

async function resetPassword() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    // Hash the new password
    const newPassword = 'Accusync70';
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