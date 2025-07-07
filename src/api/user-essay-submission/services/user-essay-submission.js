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
    const { generateEmailTemplate, generateInfoBox } = require('../../../utils/email-template');
    
    const submissionDetails = `
      <p><strong>Submitter:</strong> ${submission.submitterName}</p>
      <p><strong>Email:</strong> ${submission.submitterEmail}</p>
      <p><strong>Year:</strong> ${this.formatSubmitterYear(submission.submitterYear)}</p>
      <p><strong>Law School:</strong> ${submission.lawSchool || 'Not specified'}</p>
      <p><strong>Type:</strong> ${submission.submissionType}</p>
      <p><strong>Subject:</strong> ${submission.subject?.title || 'Not specified'}</p>
      <p><strong>Submitted:</strong> ${new Date(submission.submissionDate).toLocaleString()}</p>
    `;
    
    const contentPreview = `
      <h4>Content Preview:</h4>
      <div style="background: #fff; border: 1px solid #dee2e6; padding: 15px; border-radius: 3px; margin-top: 10px;">
        ${submission.content.substring(0, 500)}${submission.content.length > 500 ? '...' : ''}
      </div>
    `;
    
    const emailContent = `
      <p>A new essay submission has been received and is ready for review.</p>
      
      ${generateInfoBox(submission.title, submissionDetails)}
      
      ${contentPreview}
    `;
    
    return generateEmailTemplate({
      title: 'New Essay Submission',
      heading: 'New Essay Submission Received',
      content: emailContent,
      buttonText: 'Review Submission',
      buttonUrl: `${process.env.ADMIN_URL || 'http://localhost:1337'}/admin/content-manager/collection-types/api::user-essay-submission.user-essay-submission`,
      footerText: 'This is an automated notification from Possue Legal Education Platform'
    });
  },

  /**
   * Generate submitter notification email HTML
   */
  generateSubmitterNotificationEmail(submission) {
    const { generateEmailTemplate, generateInfoBox, generateStatusBadge } = require('../../../utils/email-template');
    
    const statusMessages = {
      'under-review': 'Your submission is currently under review by our editorial team. We will notify you once the review is complete.',
      'approved': 'Congratulations! Your submission has been approved and will be published on our platform.',
      'rejected': 'Unfortunately, your submission was not approved for publication at this time.',
      'needs-revision': 'Your submission requires some revisions before it can be approved. Please review the feedback below and submit a revised version.'
    };
    
    const statusColors = {
      'under-review': '#17a2b8',
      'approved': '#28a745',
      'rejected': '#dc3545',
      'needs-revision': '#ffc107'
    };
    
    const submissionInfo = `
      <p><strong>Submitted on:</strong> ${new Date(submission.submissionDate).toLocaleDateString()}</p>
      <p><strong>Status:</strong> ${generateStatusBadge(submission.status, statusColors[submission.status])}</p>
    `;
    
    let additionalContent = `<p>${statusMessages[submission.status]}</p>`;
    
    if (submission.moderationNotes) {
      additionalContent += generateInfoBox('Review Notes', `<p>${submission.moderationNotes}</p>`, '#e3f2fd');
    }
    
    if (submission.rejectionDetails) {
      additionalContent += generateInfoBox('Feedback', `<p>${submission.rejectionDetails}</p>`, '#ffebee');
    }
    
    const emailContent = `
      ${generateInfoBox(submission.title, submissionInfo)}
      ${additionalContent}
    `;
    
    return generateEmailTemplate({
      title: 'Submission Status Update',
      heading: 'Essay Submission Status Update',
      content: emailContent,
      buttonText: submission.status === 'needs-revision' ? 'Submit Revision' : null,
      buttonUrl: submission.status === 'needs-revision' ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/submit-essay` : null,
      footerText: 'Thank you for contributing to Possue Legal Education Platform'
    });
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
  },

  /**
   * Format submitter year for display
   */
  formatSubmitterYear(year) {
    const yearMap = {
      'FirstYear': '1L',
      'SecondYear': '2L', 
      'ThirdYear': '3L',
      'Graduate': 'Graduate',
      'Attorney': 'Attorney',
      'Other': 'Other'
    };
    return yearMap[year] || year;
  }
}));