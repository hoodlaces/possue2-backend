'use strict';

/**
 * answer router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const defaultRouter = createCoreRouter('api::answer.answer');

const customRoutes = {
  routes: [
    {
      method: 'GET',
      path: '/answers/seo',
      handler: 'api::answer.answer.findSEO',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/answers/:id/breadcrumbs',
      handler: 'api::answer.answer.findWithBreadcrumbs',
      config: {
        auth: false,
      },
    },
  ],
};

module.exports = {
  routes: [...defaultRouter.routes, ...customRoutes.routes],
};
