const authRateLimit = require('../../middlewares/auth-rate-limit');
const customAuthController = require('./controllers/auth');

module.exports = (plugin) => {
  console.log('🔧 USERS-PERMISSIONS EXTENSION LOADING...');

  // Add rate limiting middleware
  const routes = plugin.routes['content-api'].routes;

  routes.forEach(route => {
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

  // NUCLEAR OPTION: Use Object.defineProperty to intercept controller method calls
  console.log('🔧 Using defineProperty to force controller override...');

  Object.defineProperty(plugin.controllers.auth, 'register', {
    value: customAuthController.register,
    writable: true,
    enumerable: true,
    configurable: true
  });

  Object.defineProperty(plugin.controllers.auth, 'emailConfirmation', {
    value: customAuthController.emailConfirmation,
    writable: true,
    enumerable: true,
    configurable: true
  });

  Object.defineProperty(plugin.controllers.auth, 'sendEmailConfirmation', {
    value: customAuthController.sendEmailConfirmation,
    writable: true,
    enumerable: true,
    configurable: true
  });

  console.log('✅ Controllers defined with defineProperty');
  console.log('🔍 Verify: plugin.controllers.auth.register =', typeof plugin.controllers.auth.register);

  return plugin;
};
