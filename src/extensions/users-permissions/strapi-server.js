const authRateLimit = require('../../middlewares/auth-rate-limit');
const customAuthController = require('./controllers/auth');

module.exports = (plugin) => {
  console.log('🔧 USERS-PERMISSIONS EXTENSION LOADING...');

  // CRITICAL FIX: Directly replace route handlers instead of trying to override controllers
  const routes = plugin.routes['content-api'].routes;

  routes.forEach(route => {
    if (route.path === '/auth/local/register') {
      console.log('🎯 Overriding registration route handler directly');

      // Add rate limiting
      route.config = route.config || {};
      route.config.middlewares = route.config.middlewares || [];
      route.config.middlewares.push((ctx, next) => authRateLimit.registration()(ctx, next));

      // CRITICAL: Replace the handler function directly
      const originalHandler = route.handler;
      route.handler = async (ctx) => {
        console.log('🎯 CUSTOM REGISTRATION HANDLER CALLED VIA ROUTE');
        return customAuthController.register(ctx);
      };
    }

    if (route.path === '/auth/email-confirmation') {
      route.config = route.config || {};
      route.config.middlewares = route.config.middlewares || [];
      route.config.middlewares.push((ctx, next) => authRateLimit.emailConfirmation()(ctx, next));

      route.handler = async (ctx) => {
        return customAuthController.emailConfirmation(ctx);
      };
    }
  });

  console.log('✅ Route handlers overridden directly');

  return plugin;
};
