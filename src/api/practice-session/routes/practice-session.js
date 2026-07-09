'use strict';

/**
 * practice-session router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Root-caused live in production: `auth: { scope: [...] }` checks
// ability.can('find') / .can('create') etc. against the LITERAL string
// 'find'/'create' - but the actual permission action registered by the
// role/permissions system is the full namespaced string
// (api::practice-session.practice-session.find), never the bare word.
// This meant these three actions could never succeed for any real user,
// regardless of how correctly the Authenticated role's permissions were
// configured. Removed to match every other content type in this app,
// which rely on the standard role-based permission check instead.
module.exports = createCoreRouter('api::practice-session.practice-session');

// Note: Custom routes (sync and leaderboard) will be added via a separate routes file
// This avoids the router merging issue during Strapi startup