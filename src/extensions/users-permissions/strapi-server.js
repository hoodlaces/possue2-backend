const crypto = require('crypto');
const authRateLimit = require('../../middlewares/auth-rate-limit');

module.exports = (plugin) => {
  // Add rate limiting middleware to routes
  const originalRoutes = plugin.routes['content-api'].routes;
  
  // Find and enhance auth routes with rate limiting
  originalRoutes.forEach(route => {
    if (route.path === '/auth/local/register') {
      route.config = route.config || {};
      route.config.middlewares = route.config.middlewares || [];
      route.config.middlewares.push((ctx, next) => authRateLimit.registration()(ctx, next));
    }
    
    if (route.path === '/auth/email-confirmation') {
      route.config = route.config || {};
      route.config.middlewares = route.config.middlewares || [];
      route.config.middlewares.push((ctx, next) => authRateLimit.emailConfirmation()(ctx, next));
    }
  });

  // Override registration and email confirmation methods
  
  // Custom registration with enhanced logging and token management
  plugin.controllers.auth.register = async (ctx) => {
    const { email, username, password } = ctx.request.body;

    strapi.log.info('=== CUSTOM REGISTRATION START ===');
    strapi.log.info(`Email: ${email}, Username: ${username}`);

    try {
      // Validate required fields
      if (!email || !username || !password) {
        strapi.log.error('Missing required fields for registration');
        return ctx.badRequest('Email, username, and password are required');
      }

      // Check if email already exists
      const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email }
      });

      if (existingUser) {
        strapi.log.error(`Registration failed: Email ${email} already exists`);
        return ctx.badRequest('Email is already taken');
      }

      // Check if username already exists
      const existingUsername = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { username }
      });

      if (existingUsername) {
        strapi.log.error(`Registration failed: Username ${username} already exists`);
        return ctx.badRequest('Username is already taken');
      }

      // Get default role (authenticated)
      const defaultRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' }
      });

      if (!defaultRole) {
        strapi.log.error('Default authenticated role not found');
        return ctx.internalServerError('Registration configuration error');
      }

      // Generate confirmation token and expiry
      const confirmationToken = crypto.randomBytes(32).toString('hex');
      const expiryHours = strapi.config.get('plugin.users-permissions.confirmationTokenExpiry', 24);
      const confirmationTokenExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

      strapi.log.info(`Generated confirmation token (expires in ${expiryHours}h): ${confirmationToken.substring(0, 10)}...`);

      // Create user with confirmation token
      const userData = {
        email,
        username,
        password,
        confirmed: false,
        confirmationToken: confirmationToken,
        confirmationTokenExpiry: confirmationTokenExpiry,
        role: defaultRole.id,
        provider: 'local'
      };

      strapi.log.info('Creating user in database...');
      const user = await strapi.db.query('plugin::users-permissions.user').create({
        data: userData
      });

      strapi.log.info(`User created successfully with ID: ${user.id}`);

      // Send confirmation email or provide development bypass
      const isDevelopment = process.env.NODE_ENV === 'development' || process.env.EMAIL_BYPASS_DEVELOPMENT === 'true';
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const confirmationUrl = `${clientUrl}/email-confirmation-redirection?confirmation=${confirmationToken}`;
      
      if (isDevelopment) {
        strapi.log.warn('🔧 DEVELOPMENT MODE: Email verification bypass enabled');
        strapi.log.warn(`📧 Confirmation URL: ${confirmationUrl}`);
        strapi.log.warn('🚨 This should NEVER happen in production!');
        
        // In development, provide the confirmation URL in the response
        const sanitizedUser = await strapi.plugin('users-permissions').service('user').sanitize(user, ctx);
        
        return ctx.send({
          user: sanitizedUser,
          message: 'Registration successful. Development mode: Check server logs for confirmation URL.',
          developmentOnly: {
            confirmationUrl: confirmationUrl,
            confirmationToken: confirmationToken
          }
        });
      }
      
      strapi.log.info('Sending confirmation email...');
      
      try {
        // Load email template content
        const fs = require('fs');
        const path = require('path');
        const templatePath = path.join(strapi.dirs.app.src, 'extensions', 'users-permissions', 'email-templates', 'email-confirmation.html');
        
        // Check if template file exists
        if (!fs.existsSync(templatePath)) {
          throw new Error(`Email template not found at: ${templatePath}`);
        }
        
        let emailTemplate = fs.readFileSync(templatePath, 'utf8');
        
        // Replace template variables
        emailTemplate = emailTemplate.replace(/<%= CLIENT_URL %>/g, clientUrl);
        emailTemplate = emailTemplate.replace(/<%= CODE %>/g, confirmationToken);
        
        strapi.log.info(`Sending email to ${email} with confirmation URL: ${confirmationUrl.substring(0, 50)}...`);
        
        await strapi.plugin('email').service('email').send({
          to: email,
          from: process.env.SENDGRID_FROM_EMAIL,
          subject: 'Please confirm your email address - Possue',
          html: emailTemplate
        });

        strapi.log.info(`✅ Confirmation email sent successfully to ${email}`);
        
      } catch (emailError) {
        strapi.log.error('❌ Failed to send confirmation email:', emailError);
        strapi.log.error('Email error details:', {
          apiKey: process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET',
          fromEmail: process.env.SENDGRID_FROM_EMAIL,
          toEmail: email,
          error: emailError.message || emailError
        });
        
        // Delete the user if email sending fails
        await strapi.db.query('plugin::users-permissions.user').delete({
          where: { id: user.id }
        });
        
        return ctx.internalServerError('Registration failed: Could not send confirmation email');
      }

      // Sanitize user data for response
      const sanitizedUser = await strapi.plugin('users-permissions').service('user').sanitize(user, ctx);

      strapi.log.info('=== CUSTOM REGISTRATION SUCCESS ===');
      
      return ctx.send({
        user: sanitizedUser,
        message: 'Registration successful. Please check your email to confirm your account.'
      });

    } catch (error) {
      strapi.log.error('=== REGISTRATION ERROR ===');
      strapi.log.error('Error:', error);
      
      return ctx.internalServerError('Registration failed');
    }
  };

  plugin.controllers.auth.emailConfirmation = async (ctx) => {
    const { confirmation: confirmationToken } = ctx.query;

    strapi.log.info('=== CUSTOM EMAIL CONFIRMATION START ===');
    strapi.log.info(`Token: ${confirmationToken ? confirmationToken.substring(0, 10) + '...' : 'undefined'}`);

    if (!confirmationToken) {
      strapi.log.error('No confirmation token provided');
      return ctx.badRequest('Confirmation token is required');
    }

    try {
      // Find user by confirmation token directly (bypass built-in service to avoid redirect)
      strapi.log.info('Finding user by confirmation token...');
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { confirmationToken }
      });

      if (!user) {
        strapi.log.error('User not found with confirmation token');
        return ctx.badRequest('Invalid or expired confirmation token');
      }

      strapi.log.info(`Found user: ${user.email}, confirmed: ${user.confirmed}`);

      // Check token expiry
      if (user.confirmationTokenExpiry && new Date() > new Date(user.confirmationTokenExpiry)) {
        strapi.log.error(`Token expired for user ${user.email}`);
        
        // Clear expired token
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: {
            confirmationToken: null,
            confirmationTokenExpiry: null,
          },
        });
        
        return ctx.badRequest('Confirmation token has expired. Please request a new confirmation email.');
      }

      // Check if user is already confirmed
      if (user.confirmed) {
        strapi.log.info('User already confirmed, generating JWT...');
        // Generate JWT for already confirmed user
        const jwt = strapi.plugin('users-permissions').service('jwt').issue({
          id: user.id,
        });

        const sanitizedUser = await strapi.plugin('users-permissions').service('user').sanitize(user, ctx);

        strapi.log.info('Returning JWT for already confirmed user');
        return ctx.send({
          jwt,
          user: sanitizedUser,
          message: 'Email is already confirmed. You are now logged in.'
        });
      }

      // Confirm the user (update confirmed status, clear confirmation token, and set verification timestamp)
      strapi.log.info('Confirming user...');
      const confirmedUser = await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: {
          confirmed: true,
          confirmationToken: null,
          confirmationTokenExpiry: null,
          emailVerifiedAt: new Date(),
        },
      });

      strapi.log.info('User confirmed successfully, generating JWT...');

      // Generate JWT token
      const jwt = strapi.plugin('users-permissions').service('jwt').issue({
        id: confirmedUser.id,
      });

      // Sanitize user data
      const sanitizedUser = await strapi.plugin('users-permissions').service('user').sanitize(confirmedUser, ctx);

      // Prepare response
      const response = {
        jwt,
        user: sanitizedUser,
        message: 'Email confirmed successfully. You are now logged in.'
      };

      strapi.log.info(`✅ User ${confirmedUser.email} confirmed and auto-logged in`);
      strapi.log.info('=== CUSTOM EMAIL CONFIRMATION SUCCESS ===');

      // Return JSON response (no redirect)
      return ctx.send(response);

    } catch (error) {
      strapi.log.error('=== EMAIL CONFIRMATION ERROR ===');
      strapi.log.error('Error:', error);
      
      return ctx.badRequest('Email confirmation failed');
    }
  };
  
  return plugin;
};