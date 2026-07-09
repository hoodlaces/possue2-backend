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
  // Registration rate limiting: 5 attempts per hour, keyed by the email
  // being registered (verified live in production: Render's proxy chain
  // does not expose a stable client IP - ctx.request.ip/socket.remoteAddress
  // vary per-request even for the exact same client with proxy:true set -
  // so any purely IP-keyed limiter is silently ineffective here; the
  // resendEmail limiter below already worked this way for the same reason)
  registration: (options = {}) => {
    return (ctx, next) => {
      const ip = ctx.request.ip || ctx.request.socket.remoteAddress;
      const identifier = (ctx.request.body?.email || ip || 'unknown').toLowerCase();
      const key = `reg_${identifier}`;
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
        strapi.log.warn(`Registration rate limit exceeded for: ${identifier}`);
        return ctx.tooManyRequests('Too many registration attempts. Please try again later.');
      }

      strapi.log.info(`Registration attempt ${record.count}/${maxAttempts} for: ${identifier}`);
      return next();
    };
  },

  // Email confirmation rate limiting: 10 attempts per hour, keyed by the
  // confirmation token being attempted (not IP - see note on generic()
  // below; ctx.request.ip is not stable in this app's Render deployment).
  emailConfirmation: (options = {}) => {
    return (ctx, next) => {
      const ip = ctx.request.ip || ctx.request.socket.remoteAddress;
      const identifier = ctx.query?.confirmation || ip || 'unknown';
      const key = `conf_${identifier}`;
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
        strapi.log.warn(`Email confirmation rate limit exceeded for: ${identifier}`);
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

  // Generic rate limiter. Defaults to keying by IP, but Render's proxy
  // chain does not expose a stable client IP (verified live: 3 consecutive
  // requests from the same client resolved to 3 different internal
  // 10.x addresses even with proxy:true set), so IP-keying alone is
  // silently ineffective here. Pass getKey(ctx) to key on something
  // stable instead - e.g. the email/identifier/token actually being
  // targeted, which is also the more meaningful thing to rate-limit.
  generic: (options = {}) => {
    const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    const maxAttempts = options.max || 100;
    const prefix = options.prefix || 'generic';
    const getKey = options.getKey || ((ctx) => ctx.request.ip || ctx.request.socket.remoteAddress);

    return (ctx, next) => {
      const identifier = getKey(ctx) || 'unknown';
      const key = `${prefix}_${identifier}`;
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
        strapi.log.warn(`Rate limit exceeded for ${prefix}: ${identifier}`);
        return ctx.tooManyRequests('Rate limit exceeded. Please try again later.');
      }

      return next();
    };
  }
};

module.exports = authRateLimit;