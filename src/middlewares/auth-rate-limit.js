'use strict';

/**
 * Rate limiting middleware for authentication endpoints
 * Protects against brute force attacks and spam registrations
 */

// In-memory store for simple rate limiting (consider Redis for production)
const attempts = new Map();

// Clean up old entries every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [key, data] of attempts.entries()) {
    if (data.firstAttempt < oneHourAgo) {
      attempts.delete(key);
    }
  }
}, 60 * 60 * 1000);

const authRateLimit = {
  // Registration rate limiting: 5 attempts per hour per IP
  registration: (options = {}) => {
    return (ctx, next) => {
      const ip = ctx.request.ip || ctx.request.socket.remoteAddress;
      const key = `reg_${ip}`;
      const now = Date.now();
      const windowMs = options.windowMs || 60 * 60 * 1000; // 1 hour
      const maxAttempts = options.max || 5;

      const record = attempts.get(key) || { count: 0, firstAttempt: now };

      // Reset if window has passed
      if (now - record.firstAttempt > windowMs) {
        record.count = 0;
        record.firstAttempt = now;
      }

      record.count++;
      attempts.set(key, record);

      if (record.count > maxAttempts) {
        strapi.log.warn(`Registration rate limit exceeded for IP: ${ip}`);
        return ctx.tooManyRequests('Too many registration attempts. Please try again later.');
      }

      strapi.log.info(`Registration attempt ${record.count}/${maxAttempts} from IP: ${ip}`);
      return next();
    };
  },

  // Email confirmation rate limiting: 10 attempts per hour per IP
  emailConfirmation: (options = {}) => {
    return (ctx, next) => {
      const ip = ctx.request.ip || ctx.request.socket.remoteAddress;
      const key = `conf_${ip}`;
      const now = Date.now();
      const windowMs = options.windowMs || 60 * 60 * 1000; // 1 hour
      const maxAttempts = options.max || 10;

      const record = attempts.get(key) || { count: 0, firstAttempt: now };

      // Reset if window has passed
      if (now - record.firstAttempt > windowMs) {
        record.count = 0;
        record.firstAttempt = now;
      }

      record.count++;
      attempts.set(key, record);

      if (record.count > maxAttempts) {
        strapi.log.warn(`Email confirmation rate limit exceeded for IP: ${ip}`);
        return ctx.tooManyRequests('Too many confirmation attempts. Please try again later.');
      }

      strapi.log.info(`Email confirmation attempt ${record.count}/${maxAttempts} from IP: ${ip}`);
      return next();
    };
  },

  // Resend email rate limiting: 3 attempts per hour per email
  resendEmail: (options = {}) => {
    return (ctx, next) => {
      const email = ctx.request.body?.email || ctx.params?.email;
      if (!email) {
        return next();
      }

      const key = `resend_${email}`;
      const now = Date.now();
      const windowMs = options.windowMs || 60 * 60 * 1000; // 1 hour
      const maxAttempts = options.max || 3;

      const record = attempts.get(key) || { count: 0, firstAttempt: now };

      // Reset if window has passed
      if (now - record.firstAttempt > windowMs) {
        record.count = 0;
        record.firstAttempt = now;
      }

      record.count++;
      attempts.set(key, record);

      if (record.count > maxAttempts) {
        strapi.log.warn(`Resend email rate limit exceeded for email: ${email}`);
        return ctx.tooManyRequests('Too many email resend attempts. Please try again later.');
      }

      strapi.log.info(`Resend email attempt ${record.count}/${maxAttempts} for: ${email}`);
      return next();
    };
  },

  // Generic rate limiter
  generic: (options = {}) => {
    const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    const maxAttempts = options.max || 100;
    const prefix = options.prefix || 'generic';

    return (ctx, next) => {
      const ip = ctx.request.ip || ctx.request.socket.remoteAddress;
      const key = `${prefix}_${ip}`;
      const now = Date.now();

      const record = attempts.get(key) || { count: 0, firstAttempt: now };

      // Reset if window has passed
      if (now - record.firstAttempt > windowMs) {
        record.count = 0;
        record.firstAttempt = now;
      }

      record.count++;
      attempts.set(key, record);

      if (record.count > maxAttempts) {
        strapi.log.warn(`Rate limit exceeded for ${prefix} from IP: ${ip}`);
        return ctx.tooManyRequests('Rate limit exceeded. Please try again later.');
      }

      return next();
    };
  }
};

module.exports = authRateLimit;