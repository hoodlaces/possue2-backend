'use strict';

/**
 * user-essay-submission router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const defaultRouter = createCoreRouter('api::user-essay-submission.user-essay-submission');

const customRoutes = {
  routes: [
    // Public routes
    {
      method: 'POST',
      path: '/user-essay-submissions',
      handler: 'user-essay-submission.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/user-essay-submissions/approved',
      handler: 'user-essay-submission.findApproved',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    
    // Authenticated user routes
    {
      method: 'GET',
      path: '/user-essay-submissions/my-submissions',
      handler: 'user-essay-submission.findOwn',
      config: {
        policies: ['global::is-authenticated'],
        middlewares: [],
      },
    },
    
    // Admin-only routes
    {
      method: 'PUT',
      path: '/user-essay-submissions/:id/status',
      handler: 'user-essay-submission.updateStatus',
      config: {
        policies: ['admin::is-owner'],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/user-essay-submissions/by-status/:status',
      handler: 'user-essay-submission.findByStatus',
      config: {
        policies: ['admin::is-owner'],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/user-essay-submissions/statistics',
      handler: 'user-essay-submission.getStatistics',
      config: {
        policies: ['admin::is-owner'],
        middlewares: [],
      },
    },
  ]
};

// Merge custom routes with default routes, but customize permissions
module.exports = {
  routes: [
    ...customRoutes.routes,
    // Override default routes with custom permissions
    {
      method: 'GET',
      path: '/user-essay-submissions',
      handler: 'user-essay-submission.find',
      config: {
        policies: ['admin::is-owner'], // Admin only for full list
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/user-essay-submissions/:id',
      handler: 'user-essay-submission.findOne',
      config: {
        policies: ['admin::is-owner'], // Admin only for individual items
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/user-essay-submissions/:id',
      handler: 'user-essay-submission.update',
      config: {
        policies: ['admin::is-owner'], // Admin only for updates
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/user-essay-submissions/:id',
      handler: 'user-essay-submission.delete',
      config: {
        policies: ['admin::is-owner'], // Admin only for deletion
        middlewares: [],
      },
    },
  ]
};