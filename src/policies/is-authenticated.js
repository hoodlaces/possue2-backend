'use strict';

/**
 * `is-authenticated` policy
 */

module.exports = (policyContext, config, { strapi }) => {
  return async (ctx, next) => {
    if (ctx.state.user) {
      // User is authenticated
      return await next();
    }

    return ctx.unauthorized('Authentication required');
  };
};