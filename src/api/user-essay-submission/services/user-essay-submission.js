'use strict';

/**
 * user-essay-submission service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::user-essay-submission.user-essay-submission', ({ strapi }) => ({
  /**
   * Send notification to admins about new submission
   */
  async notifyAdmins(submission) {
    try {
      // Get all admin users
      const admins = await strapi.query('admin::user').findMany({
        where: {
          isActive: true
        }
      });
      
      if (!admins.length) {
        console.warn('No admin users found for notification');
        return;
      }
      
      // Prepare email data
      const emailData = {
        to: admins.map(admin => admin.email),
        subject: `New Essay Submission: ${submission.title}`,
        html: this.generateAdminNotificationEmail(submission)
      };
      
      // Send email using Strapi's email plugin (if configured)
      if (strapi.plugins.email) {
        await strapi.plugins.email.services.email.send(emailData);
      } else {
        console.warn('Email plugin not configured - admin notification not sent');
      }
      
    } catch (error) {
      console.error('Failed to notify admins:', error);
      throw error;
    }
  },

  /**
   * Send notification to submitter about status change
   */
  async notifySubmitter(submission) {
    try {
      const emailData = {
        to: submission.submitterEmail,
        subject: `Submission Status Update: ${submission.title}`,
        html: this.generateSubmitterNotificationEmail(submission)
      };
      
      if (strapi.plugins.email) {
        await strapi.plugins.email.services.email.send(emailData);
      } else {
        console.warn('Email plugin not configured - submitter notification not sent');
      }
      
    } catch (error) {
      console.error('Failed to notify submitter:', error);
      throw error;
    }
  },

  /**
   * Generate admin notification email HTML
   */
  generateAdminNotificationEmail(submission) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">New Essay Submission</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${submission.title}</h3>
          <p><strong>Submitter:</strong> ${submission.submitterName}</p>
          <p><strong>Email:</strong> ${submission.submitterEmail}</p>
          <p><strong>Year:</strong> ${submission.submitterYear}</p>
          <p><strong>Law School:</strong> ${submission.lawSchool || 'Not specified'}</p>
          <p><strong>Type:</strong> ${submission.submissionType}</p>
          <p><strong>Subject:</strong> ${submission.subject?.title || 'Not specified'}</p>
          <p><strong>Submitted:</strong> ${new Date(submission.submissionDate).toLocaleString()}</p>
        </div>
        
        <div style="margin: 20px 0;">
          <h4>Content Preview:</h4>
          <div style="background: #fff; border: 1px solid #dee2e6; padding: 15px; border-radius: 3px;">
            ${submission.content.substring(0, 500)}${submission.content.length > 500 ? '...' : ''}
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.ADMIN_URL || 'http://localhost:1337'}/admin/content-manager/collection-types/api::user-essay-submission.user-essay-submission" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Review Submission
          </a>
        </div>
        
        <p style="color: #6c757d; font-size: 12px; text-align: center;">
          This is an automated notification from Possue Legal Education Platform
        </p>
      </div>
    `;
  },

  /**
   * Generate submitter notification email HTML
   */
  generateSubmitterNotificationEmail(submission) {
    const statusMessages = {
      'under-review': 'Your submission is currently under review by our editorial team.',
      'approved': 'Congratulations! Your submission has been approved and will be published.',
      'rejected': 'Unfortunately, your submission was not approved for publication.',
      'needs-revision': 'Your submission requires some revisions before it can be approved.'
    };
    
    const statusColors = {
      'under-review': '#17a2b8',
      'approved': '#28a745',
      'rejected': '#dc3545',
      'needs-revision': '#ffc107'
    };
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Submission Status Update</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${submission.title}</h3>
          <p><strong>Submitted on:</strong> ${new Date(submission.submissionDate).toLocaleDateString()}</p>
          <p><strong>Status:</strong> 
            <span style="background: ${statusColors[submission.status]}; color: white; padding: 4px 8px; border-radius: 3px; text-transform: capitalize;">
              ${submission.status.replace('-', ' ')}
            </span>
          </p>
        </div>
        
        <div style="margin: 20px 0;">
          <p>${statusMessages[submission.status]}</p>
          
          ${submission.moderationNotes ? `
            <div style="background: #e9ecef; padding: 15px; border-radius: 3px; margin: 15px 0;">
              <h4 style="margin-top: 0;">Review Notes:</h4>
              <p>${submission.moderationNotes}</p>
            </div>
          ` : ''}
          
          ${submission.rejectionDetails ? `
            <div style="background: #f8d7da; padding: 15px; border-radius: 3px; margin: 15px 0;">
              <h4 style="margin-top: 0;">Feedback:</h4>
              <p>${submission.rejectionDetails}</p>
            </div>
          ` : ''}
        </div>
        
        ${submission.status === 'needs-revision' ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/submit-essay" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Submit Revision
            </a>
          </div>
        ` : ''}
        
        <p style="color: #6c757d; font-size: 12px; text-align: center;">
          Thank you for contributing to Possue Legal Education Platform
        </p>
      </div>
    `;
  },

  /**
   * Get submission statistics for admin dashboard
   */
  async getStatistics() {
    try {
      const [
        totalSubmissions,
        pendingCount,
        underReviewCount,
        approvedCount,
        rejectedCount,
        recentSubmissions
      ] = await Promise.all([
        strapi.entityService.count('api::user-essay-submission.user-essay-submission'),
        strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
          filters: { status: 'pending' }
        }),
        strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
          filters: { status: 'under-review' }
        }),
        strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
          filters: { status: 'approved' }
        }),
        strapi.entityService.count('api::user-essay-submission.user-essay-submission', {
          filters: { status: 'rejected' }
        }),
        strapi.entityService.findMany('api::user-essay-submission.user-essay-submission', {
          limit: 10,
          sort: { submissionDate: 'desc' },
          populate: ['subject']
        })
      ]);
      
      return {
        totalSubmissions,
        statusCounts: {
          pending: pendingCount,
          underReview: underReviewCount,
          approved: approvedCount,
          rejected: rejectedCount
        },
        recentSubmissions
      };
      
    } catch (error) {
      console.error('Failed to get statistics:', error);
      throw error;
    }
  },

  /**
   * Validate submission data
   */
  validateSubmission(data) {
    const errors = [];
    
    if (!data.title || data.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters long');
    }
    
    if (!data.content || data.content.trim().length < 50) {
      errors.push('Content must be at least 50 characters long');
    }
    
    if (!data.submitterName || data.submitterName.trim().length < 2) {
      errors.push('Submitter name must be at least 2 characters long');
    }
    
    if (!data.submitterEmail || !this.validateEmail(data.submitterEmail)) {
      errors.push('Valid email address is required');
    }
    
    if (!data.agreedToTerms) {
      errors.push('You must agree to the terms and conditions');
    }
    
    if (!data.publishingConsent) {
      errors.push('Publishing consent is required');
    }
    
    return errors;
  },

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}));