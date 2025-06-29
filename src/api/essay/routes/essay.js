'use strict';

/**
 * essay router with enhanced SEO endpoints.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const defaultRouter = createCoreRouter('api::essay.essay');

const customRoutes = {
  routes: [
    // SEO-specific endpoints
    {
      method: 'GET',
      path: '/essays/seo',
      handler: 'essay.findSEO',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/essays/:id/breadcrumbs',
      handler: 'essay.findWithBreadcrumbs',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/essays/by-subject/:subjectSlug',
      handler: 'essay.findBySubject',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Admin-only SEO management endpoints
    {
      method: 'POST',
      path: '/essays/generate-seo',
      handler: 'essay.generateBulkSEO',
      config: {
        policies: ['admin::is-owner'],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/essays/seo-status',
      handler: 'essay.seoStatus',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ]
};

// Merge custom routes with default routes
module.exports = {
  routes: [
    ...defaultRouter.routes,
    ...customRoutes.routes
  ]
};
