'use strict';

/**
 * practice-session controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::practice-session.practice-session', ({ strapi }) => ({
  
  // Override create to ensure proper user association
  async create(ctx) {
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    // Add user to the request body
    ctx.request.body.data = {
      ...ctx.request.body.data,
      user: user.id
    };

    // Validate required fields
    const { sessionId, essayTitle, wordCount, timeSpent, completedAt } = ctx.request.body.data;
    
    if (!sessionId || !essayTitle || wordCount === undefined || timeSpent === undefined || !completedAt) {
      return ctx.badRequest('Missing required fields: sessionId, essayTitle, wordCount, timeSpent, completedAt');
    }

    // Check for duplicate session for this user
    const existingSession = await strapi.entityService.findMany('api::practice-session.practice-session', {
      filters: {
        sessionId: sessionId,
        user: user.id
      },
      limit: 1
    });

    if (existingSession.length > 0) {
      return ctx.conflict('Practice session already exists for this user');
    }

    // Call the default create method
    const response = await super.create(ctx);
    
    // Log the creation for debugging
    strapi.log.info(`Practice session created for user ${user.id}: ${sessionId}`);
    
    return response;
  },

  // Override find to only return sessions for the authenticated user
  async find(ctx) {
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    // Add user filter to the query
    ctx.query = {
      ...ctx.query,
      filters: {
        ...ctx.query.filters,
        user: user.id
      }
    };

    return await super.find(ctx);
  },

  // Custom endpoint for syncing multiple sessions
  async syncSessions(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const { sessions } = ctx.request.body;

    if (!Array.isArray(sessions)) {
      return ctx.badRequest('Sessions must be an array');
    }

    // Per-session outcomes (status keyed to the caller's own sessionId) so
    // the client can tell exactly which of its local sessions were
    // persisted, rather than only getting aggregate counts.
    const items = [];
    let created = 0, skipped = 0, errorCount = 0;

    for (const sessionData of sessions) {
      const { sessionId, essayTitle, wordCount, timeSpent, completedAt } = sessionData;

      try {
        // Validate required fields
        if (!sessionId || !essayTitle || wordCount === undefined || timeSpent === undefined || !completedAt) {
          items.push({ sessionId: sessionId || null, status: 'error', error: 'Missing required fields' });
          errorCount++;
          continue;
        }

        // Check if session already exists
        const existingSession = await strapi.entityService.findMany('api::practice-session.practice-session', {
          filters: {
            sessionId: sessionId,
            user: user.id
          },
          limit: 1
        });

        if (existingSession.length > 0) {
          items.push({ sessionId, status: 'exists', id: existingSession[0].id });
          skipped++;
          continue;
        }

        // Create the session
        const entity = await strapi.entityService.create('api::practice-session.practice-session', {
          data: {
            sessionId,
            essayTitle,
            wordCount,
            timeSpent,
            completedAt,
            sessionData: sessionData.sessionData || null,
            user: user.id,
            publishedAt: new Date()
          }
        });

        items.push({ sessionId, status: 'created', id: entity.id });
        created++;

      } catch (error) {
        items.push({ sessionId: sessionId || null, status: 'error', error: error.message });
        errorCount++;
      }
    }

    strapi.log.info(`Sync completed for user ${user.id}: ${created} created, ${skipped} skipped, ${errorCount} errors`);

    return ctx.send({
      message: 'Sync completed',
      results: { created, skipped, errors: errorCount },
      sessions: items
    });
  },

  // Custom endpoint for leaderboard data (public, unauthenticated - must never expose PII)
  async leaderboard(ctx) {
    const { limit = 10, minWordCount = 300, period = 'all-time' } = ctx.query;
    const safeLimit = Math.min(parseInt(limit, 10) || 10, 100);
    const safeMinWordCount = parseInt(minWordCount, 10) || 300;

    const filters = {
      wordCount: { $gte: safeMinWordCount },
    };

    if (period === 'weekly') {
      filters.completedAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (period === 'monthly') {
      const now = new Date();
      filters.completedAt = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    }

    try {
      // Aggregate via Strapi's relation layer rather than raw SQL against
      // assumed column names - the `user` relation is stored in a separate
      // link table (practice_sessions_user_lnk), not a user_id column on
      // practice_sessions, which is what made the previous raw SQL version
      // of this query fail with "column ps.user_id does not exist" on
      // every call.
      const sessions = await strapi.entityService.findMany('api::practice-session.practice-session', {
        filters,
        populate: ['user'],
        publicationState: 'live',
        fields: ['wordCount', 'timeSpent', 'completedAt'],
        limit: 10000,
      });

      const byUser = new Map();
      for (const session of sessions) {
        const user = session.user;
        if (!user || user.blocked) continue;

        const entry = byUser.get(user.id) || {
          user_id: user.id,
          username: user.username,
          session_count: 0,
          total_words: 0,
          total_time: 0,
          last_session: null,
        };

        entry.session_count += 1;
        entry.total_words += session.wordCount || 0;
        entry.total_time += session.timeSpent || 0;
        if (!entry.last_session || new Date(session.completedAt) > new Date(entry.last_session)) {
          entry.last_session = session.completedAt;
        }

        byUser.set(user.id, entry);
      }

      const leaderboard = Array.from(byUser.values())
        .sort((a, b) => b.session_count - a.session_count || b.total_words - a.total_words)
        .slice(0, safeLimit);

      return ctx.send({
        leaderboard,
        criteria: {
          minWordCount: safeMinWordCount,
          limit: safeLimit,
          period
        }
      });

    } catch (error) {
      strapi.log.error('Leaderboard query error:', error);
      return ctx.internalServerError('Failed to fetch leaderboard data');
    }
  }

}));