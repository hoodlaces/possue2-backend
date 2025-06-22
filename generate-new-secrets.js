const crypto = require('crypto');

console.log('🔐 Generating new security credentials...\n');

// Generate new APP_KEYS (Strapi needs 4 keys)
const appKeys = Array.from({ length: 4 }, () => 
  crypto.randomBytes(16).toString('base64')
).join(',');

// Generate new secrets
const jwtSecret = crypto.randomUUID();
const apiTokenSalt = crypto.randomBytes(16).toString('hex');
const adminJwtSecret = crypto.randomBytes(16).toString('hex');
const transferTokenSalt = crypto.randomBytes(16).toString('base64');

console.log('📋 NEW PRODUCTION ENVIRONMENT VARIABLES:');
console.log('Copy these to your .env.production file:\n');

console.log('HOST=0.0.0.0');
console.log('PORT=1337');
console.log(`APP_KEYS=${appKeys}`);
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`API_TOKEN_SALT=${apiTokenSalt}`);
console.log(`ADMIN_JWT_SECRET=${adminJwtSecret}`);
console.log(`TRANSFER_TOKEN_SALT=${transferTokenSalt}`);
console.log('');
console.log('# 🚨 GET NEW DATABASE_URL FROM RENDER DASHBOARD');
console.log('DATABASE_URL=postgres://username:password@host/database');
console.log('');
console.log('RENDER_EXTERNAL_URL=https://possue2-backend.onrender.com');
console.log('SITEMAP_HOSTNAME=https://possue2-backend.onrender.com');
console.log('');
console.log('⚠️  CRITICAL: You still need to:');
console.log('1. Rotate DATABASE_URL in Render Dashboard');
console.log('2. Update these environment variables in Render');
console.log('3. Restart your Render service');