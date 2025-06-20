const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const dbConfig = {
  host: '127.0.0.1',
  port: 5432,
  database: 'strapi-marketplace-v5',
  user: 'postgres',
  password: '1212'
};

async function createNewAdmin() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    // Hash the password
    const password = 'Accusync70';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new admin user with specific ID
    await client.query('DELETE FROM admin_users_roles_lnk WHERE user_id = 2');
    await client.query('DELETE FROM admin_users WHERE id = 2');
    
    const result = await client.query(`
      INSERT INTO admin_users (id, firstname, lastname, username, email, password, is_active, blocked, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) 
      RETURNING id, email
    `, [
      2,
      'Admin',
      'User', 
      'admin@possue.com',
      'admin@possue.com',
      hashedPassword,
      true,
      false
    ]);
    
    const userId = result.rows[0].id;
    
    // Assign Super Admin role (role ID 1)
    await client.query(
      'INSERT INTO admin_users_roles_lnk (user_id, role_id) VALUES ($1, $2)',
      [userId, 1]
    );
    
    console.log('✅ New admin user created successfully!');
    console.log('📧 Email: admin@possue.com');
    console.log('🔑 Password: Accusync70');
    
    // Also reset the original user password
    await client.query(
      'UPDATE admin_users SET password = $1 WHERE email = $2',
      [hashedPassword, 'info@possue.com']
    );
    
    console.log('✅ Original admin password also reset!');
    console.log('📧 Email: info@possue.com');
    console.log('🔑 Password: Accusync70');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await client.end();
  }
}

createNewAdmin();