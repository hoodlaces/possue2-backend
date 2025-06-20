'use strict';

/**
 * subject router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const defaultRouter = createCoreRouter('api::subject.subject');

const customRoutes = {
  routes: [
    {
      method: 'GET',
      path: '/subjects/seo',
      handler: 'api::subject.subject.findSEO',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/subjects/:id/breadcrumbs',
      handler: 'api::subject.subject.findWithBreadcrumbs',
      config: {
        auth: false,
      },
    },
  ],
};

module.exports = {
  routes: [...defaultRouter.routes, ...customRoutes.routes],
};
