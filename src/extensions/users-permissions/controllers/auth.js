'use strict';

const crypto = require('crypto');

module.exports = {
  // Custom registration with enhanced logging and token management
  register: async (ctx) => {
    const { email, username, password } = ctx.request.body;

    console.log('🎯 CUSTOM REGISTRATION CONTROLLER CALLED');
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

      // ENHANCED DEBUG LOGGING
      strapi.log.info('🔍 EMAIL VERIFICATION DEBUG INFO:');
      strapi.log.info(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
      strapi.log.info(`   EMAIL_BYPASS_DEVELOPMENT: ${process.env.EMAIL_BYPASS_DEVELOPMENT || 'undefined'}`);
      strapi.log.info(`   CLIENT_URL: ${process.env.CLIENT_URL || 'undefined'}`);
      strapi.log.info(`   isDevelopment: ${isDevelopment}`);
      strapi.log.info(`   SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? 'SET (length: ' + process.env.SENDGRID_API_KEY.length + ')' : 'NOT SET'}`);
      strapi.log.info(`   SENDGRID_FROM_EMAIL: ${process.env.SENDGRID_FROM_EMAIL || 'undefined'}`);
      strapi.log.info(`   confirmationUrl: ${confirmationUrl}`);

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

      strapi.log.info('📧 PRODUCTION MODE: Sending confirmation email via SendGrid...');

      try {
        // Load email template content
        const fs = require('fs');
        const path = require('path');
        const templatePath = path.join(strapi.dirs.app.src, 'extensions', 'users-permissions', 'email-templates', 'email-confirmation.html');

        strapi.log.info(`🔍 EMAIL TEMPLATE DEBUG:`);
        strapi.log.info(`   Template path: ${templatePath}`);

        // Check if template file exists
        if (!fs.existsSync(templatePath)) {
          strapi.log.error(`❌ Email template not found at: ${templatePath}`);
          throw new Error(`Email template not found at: ${templatePath}`);
        }

        strapi.log.info(`✅ Email template found, loading content...`);
        let emailTemplate = fs.readFileSync(templatePath, 'utf8');
        strapi.log.info(`✅ Email template loaded (${emailTemplate.length} characters)`);

        // Replace template variables
        emailTemplate = emailTemplate.replace(/<%= CLIENT_URL %>/g, clientUrl);
        emailTemplate = emailTemplate.replace(/<%= CODE %>/g, confirmationToken);

        strapi.log.info(`🔍 EMAIL SEND DEBUG:`);
        strapi.log.info(`   To: ${email}`);
        strapi.log.info(`   From: ${process.env.SENDGRID_FROM_EMAIL}`);
        strapi.log.info(`   Subject: Please confirm your email address - Possue`);
        strapi.log.info(`   Confirmation URL: ${confirmationUrl}`);

        await strapi.plugin('email').service('email').send({
          to: email,
          from: process.env.SENDGRID_FROM_EMAIL,
          subject: 'Please confirm your email address - Possue',
          html: emailTemplate
        });

        strapi.log.info(`✅ Confirmation email sent successfully to ${email}`);

      } catch (emailError) {
        strapi.log.error('❌ DETAILED EMAIL ERROR:');
        strapi.log.error(`   Error name: ${emailError.name}`);
        strapi.log.error(`   Error message: ${emailError.message}`);
        strapi.log.error(`   Error stack: ${emailError.stack}`);
        strapi.log.error(`   Full error object:`, emailError);
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

      // Sanitize user data for response (Strapi v5)
      const sanitizedUser = await strapi.contentAPI.sanitize.output(user, strapi.getModel('plugin::users-permissions.user'), { auth: ctx.state.auth });

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
  },

  emailConfirmation: async (ctx) => {
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

        const sanitizedUser = await strapi.contentAPI.sanitize.output(user, strapi.getModel('plugin::users-permissions.user'), { auth: ctx.state.auth });

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

      // Sanitize user data (Strapi v5)
      const sanitizedUser = await strapi.contentAPI.sanitize.output(confirmedUser, strapi.getModel('plugin::users-permissions.user'), { auth: ctx.state.auth });

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
  },

  // Custom send email confirmation method
  sendEmailConfirmation: async (ctx) => {
    const { email } = ctx.request.body;

    strapi.log.info('=== CUSTOM SEND EMAIL CONFIRMATION START ===');
    strapi.log.info(`Email: ${email ? email.substring(0, 3) + '***' : 'undefined'}`);

    try {
      // Validate email is provided
      if (!email) {
        strapi.log.error('No email provided');
        return ctx.badRequest('Email is required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        strapi.log.error('Invalid email format');
        return ctx.badRequest('Please enter a valid email address');
      }

      // Find user by email
      strapi.log.info('Finding user by email...');
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email }
      });

      if (!user) {
        strapi.log.error('User not found with email');
        return ctx.badRequest('No account found with this email address');
      }

      strapi.log.info(`Found user: ${user.email}, confirmed: ${user.confirmed}`);

      // Check if user is already confirmed
      if (user.confirmed) {
        strapi.log.info('User already confirmed');
        return ctx.badRequest('This email is already verified');
      }

      // Generate new confirmation token and expiry
      const confirmationToken = crypto.randomBytes(32).toString('hex');
      const expiryHours = strapi.config.get('plugin.users-permissions.confirmationTokenExpiry', 24);
      const confirmationTokenExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

      strapi.log.info(`Generated new confirmation token (expires in ${expiryHours}h): ${confirmationToken.substring(0, 10)}...`);

      // Update user with new confirmation token
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: {
          confirmationToken: confirmationToken,
          confirmationTokenExpiry: confirmationTokenExpiry,
        },
      });

      strapi.log.info('User updated with new confirmation token');

      // Send confirmation email
      const isDevelopment = process.env.NODE_ENV === 'development' || process.env.EMAIL_BYPASS_DEVELOPMENT === 'true';
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const confirmationUrl = `${clientUrl}/email-confirmation-redirection?confirmation=${confirmationToken}`;

      strapi.log.info('🔍 RESEND EMAIL DEBUG INFO:');
      strapi.log.info(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
      strapi.log.info(`   EMAIL_BYPASS_DEVELOPMENT: ${process.env.EMAIL_BYPASS_DEVELOPMENT || 'undefined'}`);
      strapi.log.info(`   CLIENT_URL: ${process.env.CLIENT_URL || 'undefined'}`);
      strapi.log.info(`   isDevelopment: ${isDevelopment}`);
      strapi.log.info(`   confirmationUrl: ${confirmationUrl}`);

      if (isDevelopment) {
        strapi.log.warn('🔧 DEVELOPMENT MODE: Email verification bypass enabled for resend');
        strapi.log.warn(`📧 Resend Confirmation URL: ${confirmationUrl}`);
        strapi.log.warn('🚨 This should NEVER happen in production!');

        return ctx.send({
          message: 'Development mode: Check server logs for confirmation URL.',
          developmentOnly: {
            confirmationUrl: confirmationUrl,
            confirmationToken: confirmationToken
          }
        });
      }

      strapi.log.info('📧 PRODUCTION MODE: Sending resend confirmation email via SendGrid...');

      try {
        // Load email template content
        const fs = require('fs');
        const path = require('path');
        const templatePath = path.join(strapi.dirs.app.src, 'extensions', 'users-permissions', 'email-templates', 'email-confirmation.html');

        strapi.log.info(`🔍 RESEND EMAIL TEMPLATE DEBUG:`);
        strapi.log.info(`   Template path: ${templatePath}`);

        // Check if template file exists
        if (!fs.existsSync(templatePath)) {
          strapi.log.error(`❌ Email template not found at: ${templatePath}`);
          throw new Error(`Email template not found at: ${templatePath}`);
        }

        strapi.log.info(`✅ Email template found, loading content...`);
        let emailTemplate = fs.readFileSync(templatePath, 'utf8');
        strapi.log.info(`✅ Email template loaded (${emailTemplate.length} characters)`);

        // Replace template variables
        emailTemplate = emailTemplate.replace(/<%= CLIENT_URL %>/g, clientUrl);
        emailTemplate = emailTemplate.replace(/<%= CODE %>/g, confirmationToken);

        strapi.log.info(`🔍 RESEND EMAIL SEND DEBUG:`);
        strapi.log.info(`   To: ${email}`);
        strapi.log.info(`   From: ${process.env.SENDGRID_FROM_EMAIL}`);
        strapi.log.info(`   Subject: Please confirm your email address - Possue`);
        strapi.log.info(`   Confirmation URL: ${confirmationUrl}`);

        await strapi.plugin('email').service('email').send({
          to: email,
          from: process.env.SENDGRID_FROM_EMAIL,
          subject: 'Please confirm your email address - Possue',
          html: emailTemplate
        });

        strapi.log.info(`✅ Resend confirmation email sent successfully to ${email}`);

      } catch (emailError) {
        strapi.log.error('❌ RESEND EMAIL ERROR:');
        strapi.log.error(`   Error name: ${emailError.name}`);
        strapi.log.error(`   Error message: ${emailError.message}`);
        strapi.log.error(`   Error stack: ${emailError.stack}`);
        strapi.log.error('Resend email error details:', {
          apiKey: process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET',
          fromEmail: process.env.SENDGRID_FROM_EMAIL,
          toEmail: email,
          error: emailError.message || emailError
        });

        return ctx.internalServerError('Failed to send confirmation email. Please try again later.');
      }

      strapi.log.info('=== CUSTOM SEND EMAIL CONFIRMATION SUCCESS ===');

      return ctx.send({
        message: 'Confirmation email sent successfully. Please check your inbox and spam folder.'
      });

    } catch (error) {
      strapi.log.error('=== SEND EMAIL CONFIRMATION ERROR ===');
      strapi.log.error('Error:', error);

      return ctx.internalServerError('Failed to resend confirmation email');
    }
  },

  // Custom forgot password handler
  forgotPassword: async (ctx) => {
    const { email } = ctx.request.body;

    strapi.log.info('=== CUSTOM FORGOT PASSWORD START ===');
    strapi.log.info(`Email: ${email ? email.substring(0, 3) + '***' : 'undefined'}`);

    try {
      // Validate email
      if (!email) {
        return ctx.badRequest('Please provide your email address');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return ctx.badRequest('Please enter a valid email address');
      }

      // Find user
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        // Security: Don't reveal if email exists
        return ctx.send({ ok: true });
      }

      // Generate reset token
      const crypto = require('crypto');
      const resetPasswordToken = crypto.randomBytes(32).toString('hex');

      // Update user with reset token
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: {
          resetPasswordToken,
        },
      });

      // Prepare reset URL with FRONTEND domain
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const resetUrl = `${clientUrl}/reset-password?code=${resetPasswordToken}`;

      strapi.log.info('🔍 PASSWORD RESET DEBUG:');
      strapi.log.info(`   CLIENT_URL: ${clientUrl}`);
      strapi.log.info(`   Reset URL: ${resetUrl}`);

      // Send email
      const fs = require('fs');
      const path = require('path');

      // Load reset password email template
      const templatePath = path.join(strapi.dirs.app.src, 'extensions', 'users-permissions', 'email-templates', 'reset-password.html');

      let emailTemplate;
      if (fs.existsSync(templatePath)) {
        emailTemplate = fs.readFileSync(templatePath, 'utf8');
        emailTemplate = emailTemplate.replace(/<%= URL %>/g, resetUrl);
        emailTemplate = emailTemplate.replace(/<%= USER %>/g, user.username || user.email);
      } else {
        // Fallback to simple template
        emailTemplate = `
          <h2>Reset Your Password</h2>
          <p>Hi ${user.username || user.email},</p>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
        `;
      }

      await strapi.plugin('email').service('email').send({
        to: user.email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'Reset your password - Possue',
        html: emailTemplate
      });

      strapi.log.info(`✅ Password reset email sent to ${email}`);

      return ctx.send({ ok: true });

    } catch (error) {
      strapi.log.error('=== FORGOT PASSWORD ERROR ===');
      strapi.log.error('Error:', error);
      return ctx.badRequest('Failed to send reset password email');
    }
  },

  // Custom reset password handler
  resetPassword: async (ctx) => {
    const { code, password, passwordConfirmation } = ctx.request.body;

    strapi.log.info('=== CUSTOM RESET PASSWORD START ===');

    try {
      if (!code || !password || !passwordConfirmation) {
        return ctx.badRequest('Code, password and password confirmation are required');
      }

      if (password !== passwordConfirmation) {
        return ctx.badRequest('Passwords do not match');
      }

      // Find user by reset token
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { resetPasswordToken: code }
      });

      if (!user) {
        return ctx.badRequest('Invalid or expired reset code');
      }

      // Update password and clear reset token
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: {
          password,
          resetPasswordToken: null,
        },
      });

      strapi.log.info(`✅ Password reset successful for user ${user.email}`);

      // Generate JWT for auto-login
      const jwt = strapi.plugin('users-permissions').service('jwt').issue({
        id: user.id,
      });

      const sanitizedUser = await strapi.contentAPI.sanitize.output(user, strapi.getModel('plugin::users-permissions.user'), { auth: ctx.state.auth });

      return ctx.send({
        jwt,
        user: sanitizedUser,
        message: 'Password reset successfully. You are now logged in.'
      });

    } catch (error) {
      strapi.log.error('=== RESET PASSWORD ERROR ===');
      strapi.log.error('Error:', error);
      return ctx.badRequest('Failed to reset password');
    }
  }
};
