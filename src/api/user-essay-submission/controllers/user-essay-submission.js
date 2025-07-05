'use strict';

/**
 * user-essay-submission controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::user-essay-submission.user-essay-submission', ({ strapi }) => ({
  /**
   * Create a new essay submission
   */
  async create(ctx) {
    try {
      // Extract user information from context
      const { user } = ctx.state;
      
      if (!user) {
        return ctx.unauthorized('Authentication required');
      }
      
      // Validate required fields
      const { title, exam_session } = ctx.request.body.data;
      
      if (!title || !exam_session) {
        return ctx.badRequest('Missing required fields: title and exam_session');
      }
      
      // Prepare submission data (create as draft = pending)
      const submissionData = {
        ...ctx.request.body.data,
        user: user.id,
        view_count: 0,
        publishedAt: null // Keep as draft (pending status)
      };
      
      // Create the submission
      const entity = await strapi.entityService.create('api::user-essay-submission.user-essay-submission', {
        data: submissionData,
        populate: ['user', 'file']
      });
      
      // Return success response
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      
      return this.transformResponse(sanitizedEntity);
      
    } catch (error) {
      console.error('Submission creation error:', error);
      return ctx.internalServerError('Failed to create submission');
    }
  },

  /**
   * Get user's own submissions
   */
  async findOwn(ctx) {
    try {
      const { user } = ctx.state;
      
      if (!user) {
        return ctx.unauthorized('Authentication required');
      }
      
      // Find submissions by user (both draft and published)
      const entities = await strapi.entityService.findMany('api::user-essay-submission.user-essay-submission', {
        filters: {
          user: user.id
        },
        populate: ['user', 'file'],
        publicationState: 'preview', // Show both draft and published
        sort: { createdAt: 'desc' }
      });
      
      const sanitizedEntities = await this.sanitizeOutput(entities, ctx);
      
      return this.transformResponse(sanitizedEntities);
      
    } catch (error) {
      console.error('Find own submissions error:', error);
      return ctx.internalServerError('Failed to fetch submissions');
    }
  },

  /**
   * Admin-only: Approve submission (publish it)
   */
  async approve(ctx) {
    try {
      const { id } = ctx.params;
      
      // Verify admin permissions
      if (!ctx.state.user || ctx.state.user.role?.name !== 'Admin') {
        return ctx.forbidden('Admin access required');
      }
      
      // Publish the submission (approve it)
      const entity = await strapi.entityService.update('api::user-essay-submission.user-essay-submission', id, {
        data: {
          publishedAt: new Date(),
          rejection_reason: null // Clear any previous rejection
        },
        populate: ['user', 'file']
      });
      
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      
      return this.transformResponse(sanitizedEntity);
      
    } catch (error) {
      console.error('Approve submission error:', error);
      return ctx.internalServerError('Failed to approve submission');
    }
  },

  /**
   * Admin-only: Reject submission
   */
  async reject(ctx) {
    try {
      const { id } = ctx.params;
      const { rejection_reason } = ctx.request.body;
      
      // Verify admin permissions
      if (!ctx.state.user || ctx.state.user.role?.name !== 'Admin') {
        return ctx.forbidden('Admin access required');
      }
      
      // Reject the submission (keep as draft with rejection reason)
      const entity = await strapi.entityService.update('api::user-essay-submission.user-essay-submission', id, {
        data: {
          publishedAt: null, // Keep as draft
          rejection_reason: rejection_reason || 'Submission rejected'
        },
        populate: ['user', 'file']
      });
      
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      
      return this.transformResponse(sanitizedEntity);
      
    } catch (error) {
      console.error('Reject submission error:', error);
      return ctx.internalServerError('Failed to reject submission');
    }
  },

  /**
   * Admin-only: Get pending submissions (drafts without rejection)
   */
  async findPending(ctx) {
    try {
      // Verify admin permissions
      if (!ctx.state.user || ctx.state.user.role?.name !== 'Admin') {
        return ctx.forbidden('Admin access required');
      }
      
      const { page = 1, pageSize = 25 } = ctx.query;
      
      const entities = await strapi.entityService.findMany('api::user-essay-submission.user-essay-submission', {
        filters: {
          publishedAt: { $null: true },
          rejection_reason: { $null: true }
        },
        populate: ['user', 'file'],
        publicationState: 'preview',
        sort: { createdAt: 'desc' },
        start: (page - 1) * pageSize,
        limit: pageSize
      });
      
      const total = await strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
        filters: {
          publishedAt: { $null: true },
          rejection_reason: { $null: true }
        },
        publicationState: 'preview'
      });
      
      const sanitizedEntities = await this.sanitizeOutput(entities, ctx);
      
      return this.transformResponse(sanitizedEntities, {
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          pageCount: Math.ceil(total / pageSize),
          total
        }
      });
      
    } catch (error) {
      console.error('Find pending submissions error:', error);
      return ctx.internalServerError('Failed to fetch pending submissions');
    }
  },

  /**
   * Public: Get approved submissions (published only)
   */
  async findApproved(ctx) {
    try {
      const { page = 1, pageSize = 10 } = ctx.query;
      
      const entities = await strapi.entityService.findMany('api::user-essay-submission.user-essay-submission', {
        filters: {}, // No additional filters needed - publicationState handles it
        populate: ['user', 'file'],
        publicationState: 'live', // Only published submissions
        sort: { publishedAt: 'desc' },
        start: (page - 1) * pageSize,
        limit: pageSize
      });
      
      const total = await strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
        publicationState: 'live'
      });
      
      const sanitizedEntities = await this.sanitizeOutput(entities, ctx);
      
      return this.transformResponse(sanitizedEntities, {
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          pageCount: Math.ceil(total / pageSize),
          total
        }
      });
      
    } catch (error) {
      console.error('Find approved submissions error:', error);
      return ctx.internalServerError('Failed to fetch approved submissions');
    }
  },

  /**
   * Increment view count for a submission
   */
  async incrementViewCount(ctx) {
    try {
      const { id } = ctx.params;
      
      const entity = await strapi.entityService.findOne('api::user-essay-submission.user-essay-submission', id, {
        publicationState: 'preview'
      });
      
      if (!entity) {
        return ctx.notFound('Submission not found');
      }
      
      const updatedEntity = await strapi.entityService.update('api::user-essay-submission.user-essay-submission', id, {
        data: {
          view_count: (entity.view_count || 0) + 1
        }
      });
      
      return ctx.send({ view_count: updatedEntity.view_count });
      
    } catch (error) {
      console.error('Increment view count error:', error);
      return ctx.internalServerError('Failed to increment view count');
    }
  },

  /**
   * Admin-only: Get submission statistics
   */
  async getStatistics(ctx) {
    try {
      // Verify admin permissions
      if (!ctx.state.user || ctx.state.user.role?.name !== 'Admin') {
        return ctx.forbidden('Admin access required');
      }
      
      const totalSubmissions = await strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
        publicationState: 'preview'
      });
      const pendingSubmissions = await strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
        filters: { 
          publishedAt: { $null: true },
          rejection_reason: { $null: true }
        },
        publicationState: 'preview'
      });
      const approvedSubmissions = await strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
        publicationState: 'live'
      });
      const rejectedSubmissions = await strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
        filters: { 
          rejection_reason: { $notNull: true }
        },
        publicationState: 'preview'
      });
      
      const statistics = {
        total: totalSubmissions,
        pending: pendingSubmissions,
        approved: approvedSubmissions,
        rejected: rejectedSubmissions
      };
      
      return ctx.send(statistics);
      
    } catch (error) {
      console.error('Get statistics error:', error);
      return ctx.internalServerError('Failed to fetch statistics');
    }
  }
}));