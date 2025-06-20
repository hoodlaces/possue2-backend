'use strict';

/**
 *  subject controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::subject.subject', ({ strapi }) => ({
  // Custom endpoint for SEO data
  async findSEO(ctx) {
    const { query } = ctx;
    
    const subjects = await strapi.entityService.findMany('api::subject.subject', {
      ...query,
      populate: {
        seo: {
          populate: {
            metaSocial: true,
          },
        },
        essays: {
          select: ['title', 'slug', 'year', 'month'],
        },
      },
    });

    return subjects;
  },

  // Custom endpoint for breadcrumb data
  async findWithBreadcrumbs(ctx) {
    const { id } = ctx.params;
    
    const subject = await strapi.entityService.findOne('api::subject.subject', id, {
      populate: {
        essays: {
          select: ['title', 'slug', 'year', 'month'],
          populate: {
            answer: {
              select: ['title', 'slug'],
            },
          },
        },
        seo: {
          populate: {
            metaSocial: true,
          },
        },
      },
    });

    if (!subject) {
      return ctx.notFound('Subject not found');
    }

    // Add breadcrumb structure
    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Subjects', url: '/subjects' },
      { name: subject.title, url: `/subjects/${subject.slug}` },
    ];

    // Generate structured data using SEO helper
    const seoHelper = strapi.service('api::subject.seo-helper');
    const subjectStructuredData = seoHelper.generateSubjectStructuredData(subject);
    const breadcrumbStructuredData = seoHelper.generateBreadcrumbStructuredData(breadcrumbs);
    const faqStructuredData = seoHelper.generateSubjectFAQStructuredData(subject, subject.essays);

    return {
      ...subject,
      breadcrumbs,
      structuredData: {
        subject: subjectStructuredData,
        breadcrumbs: breadcrumbStructuredData,
        faq: faqStructuredData,
      },
    };
  },
}));
