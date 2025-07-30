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
      
      // Prepare submission data (create as draft with pending status)
      const submissionData = {
        ...ctx.request.body.data,
        user: user.id,
        view_count: 0,
        status: 'pending', // Set explicit status
        submissionDate: new Date(), // Track when submitted
        publishedAt: null // Keep as draft until approved
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
        populate: ['user', 'file', 'subject', 'reviewedBy', 'attachments'],
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
      
      // Verify admin permissions using consistent pattern
      const { user } = ctx.state;
      if (!user || (!user.isAdmin && user.role?.type !== 'admin')) {
        return ctx.forbidden('Admin access required');
      }
      
      // Approve the submission (both status and publish)
      const entity = await strapi.entityService.update('api::user-essay-submission.user-essay-submission', id, {
        data: {
          status: 'approved',
          publishedAt: new Date(), // Strapi's publication system
          reviewedBy: user.id,
          reviewedAt: new Date(),
          rejection_reason: null, // Clear any previous rejection
          rejectionReason: null,
          rejectionDetails: null
        },
        populate: ['user', 'file', 'reviewedBy']
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
      
      // Verify admin permissions using consistent pattern
      const { user } = ctx.state;
      if (!user || (!user.isAdmin && user.role?.type !== 'admin')) {
        return ctx.forbidden('Admin access required');
      }
      
      // Reject the submission (both status and keep as draft)
      const entity = await strapi.entityService.update('api::user-essay-submission.user-essay-submission', id, {
        data: {
          status: 'rejected',
          publishedAt: null, // Keep as draft (unpublished)
          reviewedBy: user.id,
          reviewedAt: new Date(),
          rejection_reason: rejection_reason || 'Submission rejected',
          rejectionReason: 'other',
          rejectionDetails: rejection_reason || 'Submission rejected'
        },
        populate: ['user', 'file', 'reviewedBy']
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
      // Verify admin permissions using consistent pattern
      const { user } = ctx.state;
      if (!user || (!user.isAdmin && user.role?.type !== 'admin')) {
        return ctx.forbidden('Admin access required');
      }
      
      const { page = 1, pageSize = 25 } = ctx.query;
      
      const entities = await strapi.entityService.findMany('api::user-essay-submission.user-essay-submission', {
        filters: {
          status: { $eq: 'pending' }
        },
        populate: ['user', 'file', 'subject'],
        publicationState: 'preview',
        sort: { createdAt: 'desc' },
        start: (page - 1) * pageSize,
        limit: pageSize
      });
      
      const total = await strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
        filters: {
          status: { $eq: 'pending' }
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
        filters: {
          status: { $eq: 'approved' }
        },
        populate: ['user', 'file', 'subject'],
        publicationState: 'live', // Only published submissions
        sort: { publishedAt: 'desc' },
        start: (page - 1) * pageSize,
        limit: pageSize
      });
      
      const total = await strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
        filters: {
          status: { $eq: 'approved' }
        },
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
      // Verify admin permissions using consistent pattern
      const { user } = ctx.state;
      if (!user || (!user.isAdmin && user.role?.type !== 'admin')) {
        return ctx.forbidden('Admin access required');
      }
      
      const totalSubmissions = await strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
        publicationState: 'preview'
      });
      const pendingSubmissions = await strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
        filters: { 
          status: { $eq: 'pending' }
        },
        publicationState: 'preview'
      });
      const underReviewSubmissions = await strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
        filters: { 
          status: { $eq: 'under-review' }
        },
        publicationState: 'preview'
      });
      const approvedSubmissions = await strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
        filters: { 
          status: { $eq: 'approved' }
        },
        publicationState: 'preview'
      });
      const rejectedSubmissions = await strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
        filters: { 
          status: { $eq: 'rejected' }
        },
        publicationState: 'preview'
      });
      const needsRevisionSubmissions = await strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
        filters: { 
          status: { $eq: 'needs-revision' }
        },
        publicationState: 'preview'
      });
      
      const statistics = {
        totalSubmissions: totalSubmissions,
        statusCounts: {
          pending: pendingSubmissions,
          underReview: underReviewSubmissions,
          approved: approvedSubmissions,
          rejected: rejectedSubmissions,
          needsRevision: needsRevisionSubmissions
        }
      };
      
      return ctx.send(statistics);
      
    } catch (error) {
      console.error('Get statistics error:', error);
      return ctx.internalServerError('Failed to fetch statistics');
    }
  },

  /**
   * Admin-only: Update submission status with moderation workflow
   */
  async updateStatus(ctx) {
    try {
      const { id } = ctx.params;
      const { status, moderationNotes, rejectionReason, rejectionDetails } = ctx.request.body;
      
      // Verify admin permissions using consistent pattern
      const { user } = ctx.state;
      if (!user || (!user.isAdmin && user.role?.type !== 'admin')) {
        return ctx.forbidden('Admin access required');
      }
      
      const updateData = {
        status: status,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      };
      
      if (moderationNotes) {
        updateData.moderationNotes = moderationNotes;
      }
      
      if (status === 'approved') {
        updateData.publishedAt = new Date();
        updateData.rejectionReason = null;
        updateData.rejectionDetails = null;
      } else if (status === 'rejected') {
        updateData.publishedAt = null;
        updateData.rejectionReason = rejectionReason;
        updateData.rejectionDetails = rejectionDetails;
      }
      
      const entity = await strapi.entityService.update('api::user-essay-submission.user-essay-submission', id, {
        data: updateData,
        populate: ['user', 'file', 'subject', 'reviewedBy']
      });
      
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      
      return this.transformResponse(sanitizedEntity);
      
    } catch (error) {
      console.error('Update status error:', error);
      return ctx.internalServerError('Failed to update submission status');
    }
  },

  /**
   * Admin-only: Find submissions by status
   */
  async findByStatus(ctx) {
    try {
      const { status } = ctx.params;
      const { page = 1, pageSize = 25 } = ctx.query;
      
      // Verify admin permissions using consistent pattern
      const { user } = ctx.state;
      if (!user || (!user.isAdmin && user.role?.type !== 'admin')) {
        return ctx.forbidden('Admin access required');
      }
      
      const filters = {};
      if (status && status !== 'all') {
        filters.status = { $eq: status };
      }
      
      const entities = await strapi.entityService.findMany('api::user-essay-submission.user-essay-submission', {
        filters,
        populate: ['user', 'file', 'subject', 'reviewedBy'],
        publicationState: 'preview',
        sort: { createdAt: 'desc' },
        start: (page - 1) * pageSize,
        limit: pageSize
      });
      
      const total = await strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
        filters,
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
      console.error('Find by status error:', error);
      return ctx.internalServerError('Failed to fetch submissions by status');
    }
  }
}));