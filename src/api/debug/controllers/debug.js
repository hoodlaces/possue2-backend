'use strict';

/**
 * Debug controller for email verification system
 * Provides endpoints for monitoring and debugging user verification
 */

module.exports = {
  /**
   * Get verification status for a specific user by email
   */
  async verificationStatus(ctx) {
    const { email } = ctx.params;

    if (!email) {
      return ctx.badRequest('Email parameter is required');
    }

    try {
      strapi.log.info(`Checking verification status for: ${email}`);

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email },
        select: ['id', 'email', 'username', 'confirmed', 'emailVerifiedAt', 'confirmationTokenExpiry', 'createdAt']
      });

      if (!user) {
        return ctx.notFound('User not found');
      }

      const isTokenExpired = user.confirmationTokenExpiry && new Date() > new Date(user.confirmationTokenExpiry);

      const status = {
        email: user.email,
        username: user.username,
        confirmed: user.confirmed,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        hasPendingToken: !user.confirmed && user.confirmationTokenExpiry,
        tokenExpired: isTokenExpired,
        tokenExpiresAt: user.confirmationTokenExpiry
      };

      return ctx.send({ status });

    } catch (error) {
      strapi.log.error('Error checking verification status:', error);
      return ctx.internalServerError('Failed to check verification status');
    }
  },

  /**
   * Get overall verification statistics
   */
  async verificationStats(ctx) {
    try {
      strapi.log.info('Generating verification statistics');

      // Get user statistics
      const totalUsers = await strapi.db.query('plugin::users-permissions.user').count({
        where: { provider: 'local' }
      });

      const confirmedUsers = await strapi.db.query('plugin::users-permissions.user').count({
        where: { confirmed: true, provider: 'local' }
      });

      const unconfirmedUsers = await strapi.db.query('plugin::users-permissions.user').count({
        where: { confirmed: false, provider: 'local' }
      });

      // Get users with pending tokens
      const usersWithTokens = await strapi.db.query('plugin::users-permissions.user').findMany({
        where: { 
          confirmed: false, 
          confirmationToken: { $ne: null },
          provider: 'local'
        },
        select: ['confirmationTokenExpiry']
      });

      const expiredTokens = usersWithTokens.filter(user => 
        user.confirmationTokenExpiry && new Date() > new Date(user.confirmationTokenExpiry)
      ).length;

      // Get recent registrations (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentRegistrations = await strapi.db.query('plugin::users-permissions.user').count({
        where: { 
          createdAt: { $gte: yesterday },
          provider: 'local'
        }
      });

      const stats = {
        totalUsers,
        confirmedUsers,
        unconfirmedUsers,
        pendingTokens: usersWithTokens.length,
        expiredTokens,
        recentRegistrations,
        confirmationRate: totalUsers > 0 ? ((confirmedUsers / totalUsers) * 100).toFixed(2) : 0
      };

      return ctx.send({ stats });

    } catch (error) {
      strapi.log.error('Error generating verification stats:', error);
      return ctx.internalServerError('Failed to generate verification stats');
    }
  },

  /**
   * Resend verification email for a user
   */
  async resendVerification(ctx) {
    const { email } = ctx.request.body;

    if (!email) {
      return ctx.badRequest('Email is required');
    }

    try {
      strapi.log.info(`Resending verification email for: ${email}`);

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email }
      });

      if (!user) {
        return ctx.notFound('User not found');
      }

      if (user.confirmed) {
        return ctx.badRequest('User is already confirmed');
      }

      // Generate new confirmation token
      const crypto = require('crypto');
      const confirmationToken = crypto.randomBytes(32).toString('hex');
      const expiryHours = process.env.CONFIRMATION_TOKEN_EXPIRY_HOURS || 24;
      const confirmationTokenExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

      // Update user with new token
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: {
          confirmationToken,
          confirmationTokenExpiry
        }
      });

      // Send email
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const confirmationUrl = `${clientUrl}/email-confirmation-redirection?confirmation=${confirmationToken}`;
      
      const fs = require('fs');
      const path = require('path');
      const templatePath = path.join(strapi.dirs.app.src, 'extensions', 'users-permissions', 'email-templates', 'email-confirmation.html');
      let emailTemplate = fs.readFileSync(templatePath, 'utf8');
      
      emailTemplate = emailTemplate.replace(/<%= CLIENT_URL %>/g, clientUrl);
      emailTemplate = emailTemplate.replace(/<%= CODE %>/g, confirmationToken);
      
      await strapi.plugin('email').service('email').send({
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'Please confirm your email address - Possue',
        html: emailTemplate
      });

      strapi.log.info(`✅ Verification email resent successfully to ${email}`);

      return ctx.send({ 
        message: 'Verification email sent successfully',
        tokenExpiresAt: confirmationTokenExpiry
      });

    } catch (error) {
      strapi.log.error('Error resending verification email:', error);
      return ctx.internalServerError('Failed to resend verification email');
    }
  },

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(ctx) {
    try {
      strapi.log.info('Cleaning up expired tokens');

      const expiredUsers = await strapi.db.query('plugin::users-permissions.user').findMany({
        where: {
          confirmed: false,
          confirmationToken: { $ne: null },
          confirmationTokenExpiry: { $lt: new Date() }
        },
        select: ['id', 'email']
      });

      const cleanedEmails = [];
      for (const user of expiredUsers) {
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: {
            confirmationToken: null,
            confirmationTokenExpiry: null
          }
        });
        cleanedEmails.push(user.email);
      }

      strapi.log.info(`✅ Cleaned up ${cleanedEmails.length} expired tokens`);

      return ctx.send({
        message: `Cleaned up ${cleanedEmails.length} expired tokens`,
        cleanedEmails
      });

    } catch (error) {
      strapi.log.error('Error cleaning up expired tokens:', error);
      return ctx.internalServerError('Failed to cleanup expired tokens');
    }
  }
};