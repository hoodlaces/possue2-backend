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
      
      // Get client IP and user agent for security tracking
      const ipAddress = ctx.request.ip || ctx.request.socket.remoteAddress;
      const userAgent = ctx.request.header['user-agent'];
      
      // Validate required fields
      const { title, content, submitterName, submitterEmail, submitterYear, agreedToTerms, publishingConsent } = ctx.request.body.data;
      
      if (!title || !content || !submitterName || !submitterEmail || !submitterYear) {
        return ctx.badRequest('Missing required fields');
      }
      
      if (!agreedToTerms || !publishingConsent) {
        return ctx.badRequest('You must agree to terms and publishing consent');
      }
      
      // Prepare submission data
      const submissionData = {
        ...ctx.request.body.data,
        status: 'pending',
        submissionDate: new Date(),
        ipAddress,
        userAgent,
        publishedAt: null // Keep as draft until approved
      };
      
      // Create the submission
      const entity = await strapi.entityService.create('api::user-essay-submission.user-essay-submission', {
        data: submissionData,
        populate: ['subject', 'attachments']
      });
      
      // Send notification email to admins (optional)
      try {
        await strapi.service('api::user-essay-submission.user-essay-submission').notifyAdmins(entity);
      } catch (emailError) {
        console.warn('Failed to send admin notification:', emailError.message);
      }
      
      // Return success response without sensitive data
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
      
      // Find submissions by email (since we don't have user relations)
      const entities = await strapi.entityService.findMany('api::user-essay-submission.user-essay-submission', {
        filters: {
          submitterEmail: user.email
        },
        populate: ['subject', 'attachments'],
        sort: { submissionDate: 'desc' }
      });
      
      const sanitizedEntities = await this.sanitizeOutput(entities, ctx);
      
      return this.transformResponse(sanitizedEntities);
      
    } catch (error) {
      console.error('Find own submissions error:', error);
      return ctx.internalServerError('Failed to fetch submissions');
    }
  },

  /**
   * Admin-only: Update submission status
   */
  async updateStatus(ctx) {
    try {
      const { id } = ctx.params;
      const { status, moderationNotes, rejectionReason, rejectionDetails } = ctx.request.body;
      
      // Verify admin permissions
      if (!ctx.state.user || !ctx.state.user.isAdmin) {
        return ctx.forbidden('Admin access required');
      }
      
      // Validate status
      const validStatuses = ['pending', 'under-review', 'approved', 'rejected', 'needs-revision'];
      if (!validStatuses.includes(status)) {
        return ctx.badRequest('Invalid status');
      }
      
      // Prepare update data
      const updateData = {
        status,
        reviewedBy: ctx.state.user.id,
        reviewedAt: new Date()
      };
      
      if (moderationNotes) updateData.moderationNotes = moderationNotes;
      if (rejectionReason) updateData.rejectionReason = rejectionReason;
      if (rejectionDetails) updateData.rejectionDetails = rejectionDetails;
      
      // If approved, publish the submission
      if (status === 'approved') {
        updateData.publishedAt = new Date();
      }
      
      const entity = await strapi.entityService.update('api::user-essay-submission.user-essay-submission', id, {
        data: updateData,
        populate: ['subject', 'attachments', 'reviewedBy']
      });
      
      // Send notification email to submitter
      try {
        await strapi.service('api::user-essay-submission.user-essay-submission').notifySubmitter(entity);
      } catch (emailError) {
        console.warn('Failed to send submitter notification:', emailError.message);
      }
      
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      
      return this.transformResponse(sanitizedEntity);
      
    } catch (error) {
      console.error('Status update error:', error);
      return ctx.internalServerError('Failed to update status');
    }
  },

  /**
   * Admin-only: Get submissions by status
   */
  async findByStatus(ctx) {
    try {
      // Verify admin permissions
      if (!ctx.state.user || !ctx.state.user.isAdmin) {
        return ctx.forbidden('Admin access required');
      }
      
      const { status } = ctx.params;
      const { page = 1, pageSize = 25 } = ctx.query;
      
      const entities = await strapi.entityService.findMany('api::user-essay-submission.user-essay-submission', {
        filters: {
          status: status || 'pending'
        },
        populate: ['subject', 'attachments', 'reviewedBy'],
        sort: { submissionDate: 'desc' },
        start: (page - 1) * pageSize,
        limit: pageSize
      });
      
      const total = await strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
        filters: {
          status: status || 'pending'
        }
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
      return ctx.internalServerError('Failed to fetch submissions');
    }
  },

  /**
   * Public: Get approved submissions for display
   */
  async findApproved(ctx) {
    try {
      const { page = 1, pageSize = 10, subject } = ctx.query;
      
      const filters = {
        status: 'approved',
        publishedAt: {
          $notNull: true
        }
      };
      
      if (subject) {
        filters.subject = subject;
      }
      
      const entities = await strapi.entityService.findMany('api::user-essay-submission.user-essay-submission', {
        filters,
        populate: ['subject'],
        publicationState: 'live',
        sort: { publishedAt: 'desc' },
        start: (page - 1) * pageSize,
        limit: pageSize
      });
      
      const total = await strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
        filters,
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
   * Admin-only: Get submission statistics
   */
  async getStatistics(ctx) {
    try {
      // Verify admin permissions
      if (!ctx.state.user || !ctx.state.user.isAdmin) {
        return ctx.forbidden('Admin access required');
      }
      
      const statistics = await strapi.service('api::user-essay-submission.user-essay-submission').getStatistics();
      
      return ctx.send(statistics);
      
    } catch (error) {
      console.error('Get statistics error:', error);
      return ctx.internalServerError('Failed to fetch statistics');
    }
  }
}));