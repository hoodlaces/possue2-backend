'use strict';

/**
 * user-rule service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::user-rule.user-rule');