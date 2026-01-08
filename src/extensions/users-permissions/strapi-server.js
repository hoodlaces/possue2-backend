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

  // Strapi v5: Export controllers properly by merging with existing
  console.log('🔧 Merging custom auth controllers...');
  plugin.controllers.auth = {
    ...plugin.controllers.auth,
    ...customAuthController,
  };
  console.log('✅ Custom auth controller exported with methods:', Object.keys(customAuthController).join(', '));

  return plugin;
};
