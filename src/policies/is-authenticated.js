'use strict';

/**
 * `is-authenticated` policy
 */

module.exports = (policyContext, config, { strapi }) => {
  strapi.log.info('[DIAGNOSTIC] is-authenticated policy FACTORY called');
  return async (ctx, next) => {
    strapi.log.info(`[DIAGNOSTIC] is-authenticated policy INVOKED, has user: ${!!ctx.state.user}`);
    if (ctx.state.user) {
      // User is authenticated
      return await next();
    }

    return ctx.unauthorized('Authentication required');
  };
};