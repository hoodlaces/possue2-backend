'use strict';

/**
 * `is-admin` policy
 *
 * Same fix as is-authenticated.js: Strapi calls this function directly
 * and requires it to return `true`/`undefined` to allow, not a
 * returned (ctx, next) middleware - see that file for the full
 * root-cause explanation.
 */
const { ForbiddenError } = require('@strapi/utils').errors;

module.exports = (context) => {
  const { user } = context.state;

  if (user && (user.isAdmin || user.role?.type === 'admin')) {
    return true;
  }

  throw new ForbiddenError(`TESTMARKER-9f3a hasUser=${!!user} isAdmin=${user?.isAdmin} roleType=${user?.role?.type}`);
};