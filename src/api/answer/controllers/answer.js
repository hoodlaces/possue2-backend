'use strict';

/**
 *  answer controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::answer.answer', ({ strapi }) => ({
  // Custom endpoint for SEO data
  async findSEO(ctx) {
    const { query } = ctx;
    
    const answers = await strapi.entityService.findMany('api::answer.answer', {
      ...query,
      populate: {
        seo: {
          populate: {
            metaSocial: true,
          },
        },
      },
    });

    return answers;
  },

  // Custom endpoint for breadcrumb data
  async findWithBreadcrumbs(ctx) {
    const { id } = ctx.params;
    
    const answer = await strapi.entityService.findOne('api::answer.answer', id, {
      populate: {
        seo: {
          populate: {
            metaSocial: true,
          },
        },
      },
    });

    if (!answer) {
      return ctx.notFound('Answer not found');
    }

    // Find related essay
    const essay = await strapi.entityService.findMany('api::essay.essay', {
      filters: {
        answer: {
          id: answer.id,
        },
      },
      populate: {
        subjects: {
          select: ['title', 'slug'],
        },
      },
      limit: 1,
    });

    // Build breadcrumb structure
    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Answers', url: '/answers' },
    ];

    // Add essay and subject to breadcrumb if available
    if (essay.length > 0) {
      const essayData = essay[0];
      
      if (essayData.subjects && essayData.subjects.length > 0) {
        const subject = essayData.subjects[0];
        breadcrumbs.push(
          { name: 'Subjects', url: '/subjects' },
          { name: subject.title, url: `/subjects/${subject.slug}` }
        );
      }
      
      breadcrumbs.push(
        { name: 'Essays', url: '/essays' },
        { name: essayData.title, url: `/essays/${essayData.slug}` }
      );
    }

    breadcrumbs.push({ name: answer.title, url: `/answers/${answer.slug}` });

    return {
      ...answer,
      breadcrumbs,
      relatedEssay: essay.length > 0 ? essay[0] : null,
    };
  },
}));
