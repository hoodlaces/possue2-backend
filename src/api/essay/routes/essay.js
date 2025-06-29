'use strict';

/**
 * essay router with enhanced SEO endpoints.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::essay.essay', {
  config: {
    find: { middlewares: [] },
    findOne: { middlewares: [] },
  }
});
