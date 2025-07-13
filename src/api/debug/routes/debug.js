'use strict';

/**
 * Debug routes for email verification system
 */

const authRateLimit = require('../../../middlewares/auth-rate-limit');

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/debug/verification/status/:email',
      handler: 'debug.verificationStatus',
      config: {
        policies: [],
        middlewares: [(ctx, next) => authRateLimit.generic({ max: 20, prefix: 'debug' })(ctx, next)],
      },
    },
    {
      method: 'GET',
      path: '/debug/verification/stats',
      handler: 'debug.verificationStats',
      config: {
        policies: [],
        middlewares: [(ctx, next) => authRateLimit.generic({ max: 10, prefix: 'stats' })(ctx, next)],
      },
    },
    {
      method: 'POST',
      path: '/debug/verification/resend',
      handler: 'debug.resendVerification',
      config: {
        policies: [],
        middlewares: [(ctx, next) => authRateLimit.resendEmail()(ctx, next)],
      },
    },
    {
      method: 'POST',
      path: '/debug/verification/cleanup',
      handler: 'debug.cleanupExpiredTokens',
      config: {
        policies: [],
        middlewares: [(ctx, next) => authRateLimit.generic({ max: 5, prefix: 'cleanup' })(ctx, next)],
      },
    },
  ],
};