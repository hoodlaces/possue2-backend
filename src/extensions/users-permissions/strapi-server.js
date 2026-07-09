const authRateLimit = require('../../middlewares/auth-rate-limit');
const customAuthController = require('./controllers/auth');

// Runs a rate-limit middleware and reports whether it let the request through.
// Needed because these routes only ever actually invoke the LAST function
// pushed onto route.config.middlewares (verified live in production: a
// separate rate-limit middleware pushed before the hijack function never
// executes, while the hijack itself always does) - so the rate-limit check
// has to run inline, inside the same final function, rather than as its own
// earlier array entry.
async function checkRateLimit(limiterMiddleware, ctx) {
  let allowed = false;
  await limiterMiddleware(ctx, async () => {
    allowed = true;
  });
  return allowed;
}

module.exports = (plugin) => {
  console.log('🔧 USERS-PERMISSIONS EXTENSION LOADING...');

  // Modify routes to use our custom controller via middleware hijacking
  const routes = plugin.routes['content-api'].routes;

  routes.forEach(route => {
    if (route.path === '/auth/local/register') {
      console.log('🎯 Hijacking registration route with middleware');

      route.config = route.config || {};
      route.config.middlewares = route.config.middlewares || [];

      route.config.middlewares.push(async (ctx) => {
        console.log('🎯 MIDDLEWARE HIJACK: Running custom registration controller');

        const allowed = await checkRateLimit(authRateLimit.registration(), ctx);
        if (!allowed) return;

        await customAuthController.register(ctx);
        return;
      });
    }

    if (route.path === '/auth/email-confirmation') {
      route.config = route.config || {};
      route.config.middlewares = route.config.middlewares || [];

      route.config.middlewares.push(async (ctx) => {
        const allowed = await checkRateLimit(authRateLimit.emailConfirmation(), ctx);
        if (!allowed) return;

        await customAuthController.emailConfirmation(ctx);
        return;
      });
    }

    if (route.path === '/auth/forgot-password') {
      console.log('🎯 Hijacking forgot password route with middleware');
      route.config = route.config || {};
      route.config.middlewares = route.config.middlewares || [];

      route.config.middlewares.push(async (ctx) => {
        console.log('🎯 MIDDLEWARE HIJACK: Running custom forgot password controller');

        // Keyed by the target email, not IP - Render's proxy chain doesn't
        // expose a stable client IP (verified live), and this is also the
        // more meaningful thing to limit (stops spamming one address).
        const allowed = await checkRateLimit(
          authRateLimit.generic({
            max: 5,
            windowMs: 15 * 60 * 1000,
            prefix: 'forgot-password',
            getKey: (c) => (c.request.body?.email || '').toLowerCase(),
          }),
          ctx
        );
        if (!allowed) return;

        await customAuthController.forgotPassword(ctx);
        return;
      });
    }

    if (route.path === '/auth/reset-password') {
      console.log('🎯 Hijacking reset password route with middleware');
      route.config = route.config || {};
      route.config.middlewares = route.config.middlewares || [];

      route.config.middlewares.push(async (ctx) => {
        console.log('🎯 MIDDLEWARE HIJACK: Running custom reset password controller');

        // Keyed by the reset code itself (not IP, for the same reason as
        // forgot-password above) - limits guesses against a specific token.
        const allowed = await checkRateLimit(
          authRateLimit.generic({
            max: 10,
            windowMs: 15 * 60 * 1000,
            prefix: 'reset-password',
            getKey: (c) => c.request.body?.code,
          }),
          ctx
        );
        if (!allowed) return;

        await customAuthController.resetPassword(ctx);
        return;
      });
    }

    if (route.path === '/auth/local' && route.method === 'POST') {
      console.log('🎯 Adding rate limiting to login route (no controller hijack)');
      route.config = route.config || {};
      route.config.middlewares = route.config.middlewares || [];

      // This one IS the last (only) pushed function, so the plain
      // (ctx, next) => ... form works and calling next() correctly lets
      // Strapi's default login controller run afterward. Keyed by the
      // submitted identifier (email/username), not IP - see note above.
      route.config.middlewares.push((ctx, next) =>
        authRateLimit.generic({
          max: 10,
          windowMs: 15 * 60 * 1000,
          prefix: 'login',
          getKey: (c) => (c.request.body?.identifier || '').toLowerCase(),
        })(ctx, next)
      );
    }
  });

  console.log('✅ Routes hijacked with middleware');

  return plugin;
};
