'use strict';

/**
 * `is-admin` policy
 */

module.exports = (policyContext, config, { strapi }) => {
  return async (ctx, next) => {
    const { user } = ctx.state;
    
    // Check if user exists and is an admin
    if (user && (user.isAdmin || user.role?.type === 'admin')) {
      return await next();
    }

    return ctx.forbidden('Admin access required');
  };
};