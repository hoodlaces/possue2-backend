'use strict';

/**
 *  essay controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::essay.essay', ({ strapi }) => ({
  // Custom endpoint for SEO data
  async findSEO(ctx) {
    const { query } = ctx;
    
    const essays = await strapi.entityService.findMany('api::essay.essay', {
      ...query,
      populate: {
        seo: {
          populate: {
            metaSocial: true,
          },
        },
        subjects: {
          select: ['title', 'slug'],
        },
        answer: {
          select: ['title', 'slug'],
        },
      },
    });

    return essays;
  },

  // Custom endpoint for breadcrumb data
  async findWithBreadcrumbs(ctx) {
    const { id } = ctx.params;
    
    const essay = await strapi.entityService.findOne('api::essay.essay', id, {
      populate: {
        subjects: {
          select: ['title', 'slug'],
        },
        answer: {
          select: ['title', 'slug'],
        },
        seo: {
          populate: {
            metaSocial: true,
          },
        },
      },
    });

    if (!essay) {
      return ctx.notFound('Essay not found');
    }

    // Build breadcrumb structure
    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Essays', url: '/essays' },
    ];

    // Add subject to breadcrumb if available
    if (essay.subjects && essay.subjects.length > 0) {
      const subject = essay.subjects[0];
      breadcrumbs.push(
        { name: 'Subjects', url: '/subjects' },
        { name: subject.title, url: `/subjects/${subject.slug}` }
      );
    }

    breadcrumbs.push({ name: essay.title, url: `/essays/${essay.slug}` });

    return {
      ...essay,
      breadcrumbs,
    };
  },

  // Find essays by subject for related content
  async findBySubject(ctx) {
    const { subjectSlug } = ctx.params;
    
    const subject = await strapi.entityService.findMany('api::subject.subject', {
      filters: { slug: subjectSlug },
      limit: 1,
    });

    if (!subject.length) {
      return ctx.notFound('Subject not found');
    }

    const essays = await strapi.entityService.findMany('api::essay.essay', {
      filters: {
        subjects: {
          id: subject[0].id,
        },
      },
      populate: {
        subjects: {
          select: ['title', 'slug'],
        },
        answer: {
          select: ['title', 'slug'],
        },
      },
    });

    return essays;
  },
}));
