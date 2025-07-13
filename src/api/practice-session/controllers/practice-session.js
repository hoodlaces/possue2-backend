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

    const results = {
      created: 0,
      skipped: 0,
      errors: []
    };

    for (const sessionData of sessions) {
      try {
        const { sessionId, essayTitle, wordCount, timeSpent, completedAt } = sessionData;
        
        // Validate required fields
        if (!sessionId || !essayTitle || wordCount === undefined || timeSpent === undefined || !completedAt) {
          results.errors.push(`Invalid session data: ${JSON.stringify(sessionData)}`);
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
          results.skipped++;
          continue;
        }

        // Create the session
        await strapi.entityService.create('api::practice-session.practice-session', {
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

        results.created++;
        
      } catch (error) {
        results.errors.push(`Error processing session ${sessionData.sessionId}: ${error.message}`);
      }
    }

    strapi.log.info(`Sync completed for user ${user.id}: ${results.created} created, ${results.skipped} skipped, ${results.errors.length} errors`);
    
    return ctx.send({
      message: 'Sync completed',
      results
    });
  },

  // Custom endpoint for leaderboard data
  async leaderboard(ctx) {
    const { limit = 10, minWordCount = 500 } = ctx.query;
    
    try {
      // Use raw SQL query for better performance
      const knex = strapi.db.connection;
      
      const leaderboardData = await knex.raw(`
        SELECT 
          u.id as user_id,
          u.username,
          u.email,
          COUNT(ps.id) as session_count,
          COALESCE(SUM(ps.word_count), 0) as total_words,
          COALESCE(SUM(ps.time_spent), 0) as total_time,
          MAX(ps.completed_at) as last_session
        FROM up_users u
        LEFT JOIN practice_sessions ps ON u.id = ps.user_id 
          AND ps.word_count >= ?
          AND ps.published_at IS NOT NULL
        WHERE u.blocked = false
        GROUP BY u.id, u.username, u.email
        HAVING COUNT(ps.id) > 0
        ORDER BY session_count DESC, total_words DESC
        LIMIT ?
      `, [minWordCount, limit]);
      
      return ctx.send({
        leaderboard: leaderboardData.rows,
        criteria: {
          minWordCount,
          limit
        }
      });
      
    } catch (error) {
      strapi.log.error('Leaderboard query error:', error);
      return ctx.internalServerError('Failed to fetch leaderboard data');
    }
  }

}));