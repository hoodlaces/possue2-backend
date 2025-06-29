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

    // Generate structured data using SEO helper
    const seoHelper = strapi.service('api::subject.seo-helper');
    const subject = essay.subjects && essay.subjects.length > 0 ? essay.subjects[0] : null;
    const essayStructuredData = seoHelper.generateEssaySchema(essay, subject);
    const breadcrumbStructuredData = seoHelper.generateBreadcrumbSchema(breadcrumbs);

    return {
      ...essay,
      breadcrumbs,
      structuredData: {
        essay: essayStructuredData,
        breadcrumbs: breadcrumbStructuredData,
      },
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
        seo: {
          populate: {
            metaSocial: true,
          },
        },
      },
      sort: ['year:desc', 'month:desc'],
      publicationState: 'live'
    });

    // Generate structured data for the subject page
    const seoHelper = strapi.service('api::subject.seo-helper');
    const subjectSchema = seoHelper.generateSubjectSchema(subject[0], essays);
    const faqSchema = seoHelper.generateFAQSchema(subject[0], essays.slice(0, 10));
    const combinedSchema = seoHelper.combineSchemas(subjectSchema, faqSchema);

    return {
      subject: subject[0],
      essays: essays,
      structuredData: combinedSchema,
      seo: {
        canonical: `https://possue.com/subjects/${subjectSlug}`,
        robots: 'index, follow',
        totalEssays: essays.length
      }
    };
  },

  // Bulk SEO generation endpoint for admin use
  async generateBulkSEO(ctx) {
    // Only allow this for authenticated admin users
    if (!ctx.state.user || !ctx.state.user.isActive) {
      return ctx.forbidden('Admin access required');
    }

    try {
      // Get essays without SEO components
      const essaysWithoutSEO = await strapi.db.query('api::essay.essay').findMany({
        where: {
          publishedAt: { $notNull: true }
        },
        populate: {
          seo: true,
          subjects: {
            select: ['id', 'title', 'slug']
          }
        }
      });

      // Filter essays that don't have SEO data
      const essaysNeedingSEO = essaysWithoutSEO.filter(essay => !essay.seo || essay.seo.length === 0);

      if (essaysNeedingSEO.length === 0) {
        return {
          success: true,
          message: 'All essays already have SEO data',
          processed: 0
        };
      }

      let processed = 0;
      const errors = [];

      // Process in batches of 10
      const batchSize = 10;
      for (let i = 0; i < essaysNeedingSEO.length; i += batchSize) {
        const batch = essaysNeedingSEO.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (essay) => {
          try {
            const seoHelper = strapi.service('api::subject.seo-helper');
            
            // Generate SEO metadata
            const metaTitle = essay.title.length > 55 ? 
              essay.title.substring(0, 52) + '...' : 
              essay.title + ' | CA Bar Exam';
            
            const metaDescription = essay.content ? 
              essay.content.replace(/<[^>]*>/g, '').substring(0, 155) + '...' :
              `California Bar Exam question from ${essay.month} ${essay.year}. Essential preparation material for bar exam candidates.`;
            
            const keywords = [
              'California Bar Exam',
              essay.month,
              essay.year,
              'bar exam preparation',
              'legal education'
            ].concat(essay.subjects?.map(s => s.title) || []).join(', ');

            const structuredData = seoHelper.generateEssaySchema(essay, essay.subjects?.[0]);

            // Create SEO component
            const seoComponent = await strapi.entityService.create('shared.seo', {
              data: {
                metaTitle,
                metaDescription,
                keywords,
                metaRobots: 'index, follow',
                structuredData,
                educationalUse: 'bar-exam-prep',
                educationalLevel: 'law-student',
                practiceArea: essay.subjects?.[0]?.title,
                jurisdiction: 'California',
                canonicalURL: `https://possue.com/essays/${essay.slug}`
              }
            });

            // Link SEO component to essay
            await strapi.entityService.update('api::essay.essay', essay.id, {
              data: {
                seo: [seoComponent.id]
              }
            });

            processed++;
            
          } catch (error) {
            errors.push({
              essayId: essay.id,
              title: essay.title,
              error: error.message
            });
          }
        }));

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return {
        success: true,
        message: `Generated SEO for ${processed} essays`,
        processed,
        total: essaysNeedingSEO.length,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      strapi.log.error('Bulk SEO generation error:', error);
      return ctx.badRequest('Failed to generate SEO data: ' + error.message);
    }
  },

  // Get SEO analytics and health check
  async seoStatus(ctx) {
    try {
      const totalEssays = await strapi.db.query('api::essay.essay').count({
        where: { publishedAt: { $notNull: true } }
      });

      const essaysWithSEO = await strapi.db.query('api::essay.essay').count({
        where: { 
          publishedAt: { $notNull: true },
          seo: { $notNull: true }
        }
      });

      const coverage = totalEssays > 0 ? (essaysWithSEO / totalEssays * 100).toFixed(2) : 0;

      return {
        seoHealth: {
          totalPublishedEssays: totalEssays,
          essaysWithSEO: essaysWithSEO,
          essaysWithoutSEO: totalEssays - essaysWithSEO,
          coverage: `${coverage}%`,
          status: coverage >= 95 ? 'excellent' : coverage >= 80 ? 'good' : coverage >= 50 ? 'fair' : 'poor'
        },
        recommendations: coverage < 100 ? [
          'Run bulk SEO generation for missing essays',
          'Review and optimize meta descriptions',
          'Add structured data for better search visibility'
        ] : [
          'SEO implementation is complete',
          'Monitor performance and update as needed'
        ]
      };

    } catch (error) {
      return ctx.badRequest('Failed to get SEO status: ' + error.message);
    }
  },
}));
