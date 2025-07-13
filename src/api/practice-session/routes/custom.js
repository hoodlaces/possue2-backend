'use strict';

/**
 * Custom routes for practice-session
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/practice-sessions/sync',
      handler: 'practice-session.syncSessions',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/practice-sessions/leaderboard',
      handler: 'practice-session.leaderboard',
      config: {
        auth: false, // Public endpoint for leaderboard
        policies: [],
        middlewares: [],
      },
    },
  ],
};