const authRateLimit = require('../../middlewares/auth-rate-limit');
const customAuthController = require('./controllers/auth');

module.exports = (plugin) => {
  console.log('🔧 USERS-PERMISSIONS EXTENSION LOADING...');

  // Modify routes to use our custom controller via middleware hijacking
  const routes = plugin.routes['content-api'].routes;

  routes.forEach(route => {
    if (route.path === '/auth/local/register') {
      console.log('🎯 Hijacking registration route with middleware');

      route.config = route.config || {};
      route.config.middlewares = route.config.middlewares || [];

      // Add rate limiting FIRST
      route.config.middlewares.push((ctx, next) => authRateLimit.registration()(ctx, next));

      // Then add HIJACK middleware that runs our controller and prevents default
      route.config.middlewares.push(async (ctx, next) => {
        console.log('🎯 MIDDLEWARE HIJACK: Running custom registration controller');

        // Run our custom controller
        await customAuthController.register(ctx);

        // Don't call next() - this prevents the default controller from running
        // Our controller already sent the response via ctx.send()
        return;
      });
    }

    if (route.path === '/auth/email-confirmation') {
      route.config = route.config || {};
      route.config.middlewares = route.config.middlewares || [];
      route.config.middlewares.push((ctx, next) => authRateLimit.emailConfirmation()(ctx, next));

      route.config.middlewares.push(async (ctx) => {
        await customAuthController.emailConfirmation(ctx);
        return;
      });
    }

    if (route.path === '/auth/forgot-password') {
      console.log('🎯 Hijacking forgot password route with middleware');
      route.config = route.config || {};
      route.config.middlewares = route.config.middlewares || [];

      // Add rate limiting FIRST (Strapi's built-in plugin::users-permissions.rateLimit
      // keys on ctx.request.body.email, but our controllers don't require that field
      // name, so it never engages here - this is a working substitute)
      route.config.middlewares.push((ctx, next) => authRateLimit.generic({ max: 5, windowMs: 15 * 60 * 1000, prefix: 'forgot-password' })(ctx, next));

      route.config.middlewares.push(async (ctx) => {
        console.log('🎯 MIDDLEWARE HIJACK: Running custom forgot password controller');
        await customAuthController.forgotPassword(ctx);
        return;
      });
    }

    if (route.path === '/auth/reset-password') {
      console.log('🎯 Hijacking reset password route with middleware');
      route.config = route.config || {};
      route.config.middlewares = route.config.middlewares || [];

      route.config.middlewares.push((ctx, next) => authRateLimit.generic({ max: 10, windowMs: 15 * 60 * 1000, prefix: 'reset-password' })(ctx, next));

      route.config.middlewares.push(async (ctx) => {
        console.log('🎯 MIDDLEWARE HIJACK: Running custom reset password controller');
        await customAuthController.resetPassword(ctx);
        return;
      });
    }

    if (route.path === '/auth/local' && route.method === 'POST') {
      console.log('🎯 Adding rate limiting to login route (no controller hijack)');
      route.config = route.config || {};
      route.config.middlewares = route.config.middlewares || [];

      // Strapi's own default rate limiter is wired to this route but verified
      // (live, production) to never actually trigger - it keys on
      // ctx.request.body.email, while this app's login uses `identifier`.
      // Add a working IP-based limiter alongside it; default login controller
      // still runs after this via next().
      route.config.middlewares.push((ctx, next) => authRateLimit.generic({ max: 10, windowMs: 15 * 60 * 1000, prefix: 'login' })(ctx, next));
    }
  });

  console.log('✅ Routes hijacked with middleware');

  return plugin;
};
