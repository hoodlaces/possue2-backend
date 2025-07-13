'use strict';

/**
 * practice-session router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::practice-session.practice-session', {
  config: {
    find: {
      auth: {
        scope: ['find']
      }
    },
    findOne: {
      auth: {
        scope: ['findOne']
      }
    },
    create: {
      auth: {
        scope: ['create']
      }
    }
  }
});

// Note: Custom routes (sync and leaderboard) will be added via a separate routes file
// This avoids the router merging issue during Strapi startup