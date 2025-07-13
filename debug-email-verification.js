#!/usr/bin/env node

/**
 * Debug tool for email verification system
 * Provides comprehensive monitoring and debugging capabilities
 */

const { createCoreService } = require('@strapi/strapi');

async function debugEmailVerification() {
  console.log('=== EMAIL VERIFICATION DEBUG TOOL ===');
  console.log('=======================================');

  try {
    // Check environment variables
    console.log('\n📧 Email Configuration:');
    console.log(`SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`SENDGRID_FROM_EMAIL: ${process.env.SENDGRID_FROM_EMAIL || 'NOT SET'}`);
    console.log(`SENDGRID_FROM_NAME: ${process.env.SENDGRID_FROM_NAME || 'NOT SET'}`);
    console.log(`CLIENT_URL: ${process.env.CLIENT_URL || 'NOT SET'}`);
    console.log(`CONFIRMATION_TOKEN_EXPIRY_HOURS: ${process.env.CONFIRMATION_TOKEN_EXPIRY_HOURS || '24 (default)'}`);

    // Connect to database (assuming development environment)
    const { Client } = require('pg');
    const client = new Client({
      host: process.env.DATABASE_HOST || '127.0.0.1',
      port: process.env.DATABASE_PORT || 5432,
      database: process.env.DATABASE_NAME || 'strapi-marketplace-v5',
      user: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || '1212'
    });

    await client.connect();
    console.log('\n✅ Database connected');

    // Check user verification status
    console.log('\n👥 User Verification Status:');
    const userStats = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN confirmed = true THEN 1 END) as confirmed_users,
        COUNT(CASE WHEN confirmed = false THEN 1 END) as unconfirmed_users,
        COUNT(CASE WHEN confirmation_token IS NOT NULL THEN 1 END) as pending_tokens,
        COUNT(CASE WHEN confirmation_token_expiry < NOW() THEN 1 END) as expired_tokens
      FROM up_users 
      WHERE provider = 'local'
    `);
    
    const stats = userStats.rows[0];
    console.log(`Total users: ${stats.total_users}`);
    console.log(`Confirmed users: ${stats.confirmed_users}`);
    console.log(`Unconfirmed users: ${stats.unconfirmed_users}`);
    console.log(`Users with pending tokens: ${stats.pending_tokens}`);
    console.log(`Users with expired tokens: ${stats.expired_tokens}`);

    // Recent registrations
    console.log('\n📅 Recent Registrations (last 24 hours):');
    const recentUsers = await client.query(`
      SELECT email, username, confirmed, created_at, email_verified_at
      FROM up_users 
      WHERE created_at > NOW() - INTERVAL '24 hours' 
      AND provider = 'local'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (recentUsers.rows.length === 0) {
      console.log('No recent registrations found');
    } else {
      recentUsers.rows.forEach(user => {
        console.log(`- ${user.email} (${user.username}) - Confirmed: ${user.confirmed ? '✅' : '❌'} - Created: ${user.created_at}`);
      });
    }

    // Users with pending verification
    console.log('\n⏳ Users Pending Email Verification:');
    const pendingUsers = await client.query(`
      SELECT email, username, created_at, confirmation_token_expiry
      FROM up_users 
      WHERE confirmed = false 
      AND confirmation_token IS NOT NULL
      AND provider = 'local'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (pendingUsers.rows.length === 0) {
      console.log('No users pending verification');
    } else {
      pendingUsers.rows.forEach(user => {
        const isExpired = user.confirmation_token_expiry && new Date() > new Date(user.confirmation_token_expiry);
        console.log(`- ${user.email} - Created: ${user.created_at} - Token ${isExpired ? '❌ EXPIRED' : '✅ Valid'}`);
      });
    }

    // Check for expired tokens
    console.log('\n⚠️  Users with Expired Tokens:');
    const expiredTokens = await client.query(`
      SELECT email, username, created_at, confirmation_token_expiry
      FROM up_users 
      WHERE confirmed = false 
      AND confirmation_token IS NOT NULL
      AND confirmation_token_expiry < NOW()
      AND provider = 'local'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (expiredTokens.rows.length === 0) {
      console.log('No expired tokens found');
    } else {
      expiredTokens.rows.forEach(user => {
        console.log(`- ${user.email} - Expired: ${user.confirmation_token_expiry}`);
      });
    }

    await client.end();
    
    console.log('\n=== DEBUG COMPLETE ===');

  } catch (error) {
    console.error('❌ Debug tool failed:', error);
    process.exit(1);
  }
}

// Function to clean up expired tokens
async function cleanupExpiredTokens() {
  console.log('\n🧹 Cleaning up expired tokens...');
  
  try {
    const { Client } = require('pg');
    const client = new Client({
      host: process.env.DATABASE_HOST || '127.0.0.1',
      port: process.env.DATABASE_PORT || 5432,
      database: process.env.DATABASE_NAME || 'strapi-marketplace-v5',
      user: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || '1212'
    });

    await client.connect();

    const result = await client.query(`
      UPDATE up_users 
      SET confirmation_token = NULL, confirmation_token_expiry = NULL
      WHERE confirmed = false 
      AND confirmation_token IS NOT NULL
      AND confirmation_token_expiry < NOW()
      RETURNING email
    `);

    console.log(`✅ Cleaned up ${result.rows.length} expired tokens`);
    result.rows.forEach(user => {
      console.log(`- ${user.email}`);
    });

    await client.end();

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Function to resend verification email for specific user
async function resendVerificationEmail(email) {
  console.log(`\n📧 Resending verification email for: ${email}`);
  
  try {
    // This would need to be integrated with Strapi's email service
    // For now, just log what would happen
    console.log('This feature requires integration with running Strapi instance');
    console.log('Use the debug endpoints instead once they are created');
    
  } catch (error) {
    console.error('❌ Resend failed:', error);
  }
}

// Main execution
const command = process.argv[2];

if (command === 'cleanup') {
  cleanupExpiredTokens();
} else if (command === 'resend' && process.argv[3]) {
  resendVerificationEmail(process.argv[3]);
} else {
  debugEmailVerification();
}

// Export for use in other scripts
module.exports = {
  debugEmailVerification,
  cleanupExpiredTokens,
  resendVerificationEmail
};