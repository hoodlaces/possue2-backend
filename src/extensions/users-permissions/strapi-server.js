const authRateLimit = require('../../middlewares/auth-rate-limit');
const customAuthController = require('./controllers/auth');

module.exports = (plugin) => {
  console.log('🔧 USERS-PERMISSIONS EXTENSION LOADING...');

  // Add rate limiting middleware to routes
  const originalRoutes = plugin.routes['content-api'].routes;

  // Find and enhance auth routes with rate limiting
  originalRoutes.forEach(route => {
    if (route.path === '/auth/local/register') {
      route.config = route.config || {};
      route.config.middlewares = route.config.middlewares || [];
      route.config.middlewares.push((ctx, next) => authRateLimit.registration()(ctx, next));
    }

    if (route.path === '/auth/email-confirmation') {
      route.config = route.config || {};
      route.config.middlewares = route.config.middlewares || [];
      route.config.middlewares.push((ctx, next) => authRateLimit.emailConfirmation()(ctx, next));
    }
  });

  // Strapi v5: Add methods to existing controller object (don't replace it!)
  console.log('🔧 Adding custom auth controller methods...');

  // Add each method individually to preserve the object reference
  plugin.controllers.auth.register = customAuthController.register;
  plugin.controllers.auth.emailConfirmation = customAuthController.emailConfirmation;
  plugin.controllers.auth.sendEmailConfirmation = customAuthController.sendEmailConfirmation;

  console.log('✅ Custom methods added to auth controller');

  return plugin;
};
