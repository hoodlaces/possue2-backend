'use strict';

/**
 * practice-session service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::practice-session.practice-session', ({ strapi }) => ({
  
  // Service method to get user statistics
  async getUserStats(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const sessions = await strapi.entityService.findMany('api::practice-session.practice-session', {
      filters: {
        user: userId,
        wordCount: { $gte: 500 } // Only count meaningful sessions
      },
      sort: { completedAt: 'desc' }
    });

    const stats = {
      totalSessions: sessions.length,
      totalWords: sessions.reduce((sum, session) => sum + session.wordCount, 0),
      totalTimeSpent: sessions.reduce((sum, session) => sum + session.timeSpent, 0),
      averageWordsPerSession: sessions.length > 0 ? Math.round(sessions.reduce((sum, session) => sum + session.wordCount, 0) / sessions.length) : 0,
      lastSessionDate: sessions.length > 0 ? sessions[0].completedAt : null,
      recentSessions: sessions.slice(0, 5) // Last 5 sessions
    };

    return stats;
  },

  // Service method to get leaderboard rankings
  async getLeaderboardRankings(options = {}) {
    const { limit = 50, minWordCount = 500, timeframe = null } = options;
    
    let filters = {
      wordCount: { $gte: minWordCount }
    };

    // Add timeframe filter if specified
    if (timeframe) {
      const cutoffDate = new Date();
      switch (timeframe) {
        case 'week':
          cutoffDate.setDate(cutoffDate.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(cutoffDate.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
          break;
      }
      filters.completedAt = { $gte: cutoffDate.toISOString() };
    }

    // Get all qualifying sessions with user data
    const sessions = await strapi.entityService.findMany('api::practice-session.practice-session', {
      filters,
      populate: {
        user: {
          fields: ['id', 'username', 'email']
        }
      }
    });

    // Group by user and calculate stats
    const userStats = {};
    sessions.forEach(session => {
      const userId = session.user.id;
      if (!userStats[userId]) {
        userStats[userId] = {
          user: session.user,
          sessionCount: 0,
          totalWords: 0,
          totalTimeSpent: 0,
          lastSession: null
        };
      }
      
      userStats[userId].sessionCount++;
      userStats[userId].totalWords += session.wordCount;
      userStats[userId].totalTimeSpent += session.timeSpent;
      
      if (!userStats[userId].lastSession || new Date(session.completedAt) > new Date(userStats[userId].lastSession)) {
        userStats[userId].lastSession = session.completedAt;
      }
    });

    // Convert to array and sort
    const rankings = Object.values(userStats)
      .sort((a, b) => {
        // Primary sort: session count (descending)
        if (b.sessionCount !== a.sessionCount) {
          return b.sessionCount - a.sessionCount;
        }
        // Secondary sort: total words (descending)
        return b.totalWords - a.totalWords;
      })
      .slice(0, limit)
      .map((stats, index) => ({
        rank: index + 1,
        ...stats,
        averageWordsPerSession: Math.round(stats.totalWords / stats.sessionCount)
      }));

    return rankings;
  },

  // Service method to validate session data
  validateSessionData(sessionData) {
    const required = ['sessionId', 'essayTitle', 'wordCount', 'timeSpent', 'completedAt'];
    const missing = required.filter(field => !sessionData[field] && sessionData[field] !== 0);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    if (sessionData.wordCount < 0) {
      throw new Error('Word count cannot be negative');
    }

    if (sessionData.timeSpent < 0) {
      throw new Error('Time spent cannot be negative');
    }

    if (sessionData.essayTitle.length > 500) {
      throw new Error('Essay title too long (max 500 characters)');
    }

    return true;
  },

  // Service method to clean up old sessions (optional maintenance)
  async cleanupOldSessions(daysOld = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deletedSessions = await strapi.entityService.deleteMany('api::practice-session.practice-session', {
      filters: {
        completedAt: { $lt: cutoffDate.toISOString() }
      }
    });

    strapi.log.info(`Cleaned up ${deletedSessions.count} practice sessions older than ${daysOld} days`);
    
    return deletedSessions.count;
  }

}));