'use strict';

/**
 * essay router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const defaultRouter = createCoreRouter('api::essay.essay');

const customRoutes = {
  routes: [
    {
      method: 'GET',
      path: '/essays/seo',
      handler: 'api::essay.essay.findSEO',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/essays/:id/breadcrumbs',
      handler: 'api::essay.essay.findWithBreadcrumbs',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/essays/by-subject/:subjectSlug',
      handler: 'api::essay.essay.findBySubject',
      config: {
        auth: false,
      },
    },
  ],
};

module.exports = {
  routes: [...defaultRouter.routes, ...customRoutes.routes],
};
