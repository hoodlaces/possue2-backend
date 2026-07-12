'use strict';

/**
 * `is-authenticated` policy
 *
 * Root-caused live in production via a diagnostic log: Strapi's policy
 * middleware (@strapi/core services/server/policy.js) calls the exported
 * function directly as handler(context, config, {strapi}) and requires
 * the return value to be `true` or `undefined` to allow the request -
 * anything else (including a returned function) throws a generic
 * PolicyError. This file was previously written as a factory that
 * RETURNED a (ctx, next) middleware, which is a different, incompatible
 * convention - the factory ran, but its returned function was never
 * called, so every request failed with the same generic error
 * regardless of whether the user was actually authenticated.
 */
const { UnauthorizedError } = require('@strapi/utils').errors;

module.exports = (context) => {
  if (context.state.user) {
    return true;
  }

  throw new UnauthorizedError('Authentication required');
};