module.exports = (plugin) => {
  // Override only the emailConfirmation method, keep other methods intact
  
  plugin.controllers.auth.emailConfirmation = async (ctx) => {
    const { confirmation: confirmationToken } = ctx.query;

    strapi.log.info('=== CUSTOM EMAIL CONFIRMATION START ===');
    strapi.log.info(`Token: ${confirmationToken ? confirmationToken.substring(0, 10) + '...' : 'undefined'}`);

    if (!confirmationToken) {
      strapi.log.error('No confirmation token provided');
      return ctx.badRequest('Confirmation token is required');
    }

    try {
      // Find user by confirmation token directly (bypass built-in service to avoid redirect)
      strapi.log.info('Finding user by confirmation token...');
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { confirmationToken }
      });

      if (!user) {
        strapi.log.error('User not found with confirmation token');
        return ctx.badRequest('Invalid or expired confirmation token');
      }

      strapi.log.info(`Found user: ${user.email}, confirmed: ${user.confirmed}`);

      // Check if user is already confirmed
      if (user.confirmed) {
        strapi.log.info('User already confirmed, generating JWT...');
        // Generate JWT for already confirmed user
        const jwt = strapi.plugin('users-permissions').service('jwt').issue({
          id: user.id,
        });

        const sanitizedUser = await strapi.plugin('users-permissions').service('user').sanitize(user, ctx);

        strapi.log.info('Returning JWT for already confirmed user');
        return ctx.send({
          jwt,
          user: sanitizedUser,
          message: 'Email is already confirmed. You are now logged in.'
        });
      }

      // Confirm the user (update confirmed status and clear confirmation token)
      strapi.log.info('Confirming user...');
      const confirmedUser = await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: {
          confirmed: true,
          confirmationToken: null,
        },
      });

      strapi.log.info('User confirmed successfully, generating JWT...');

      // Generate JWT token
      const jwt = strapi.plugin('users-permissions').service('jwt').issue({
        id: confirmedUser.id,
      });

      // Sanitize user data
      const sanitizedUser = await strapi.plugin('users-permissions').service('user').sanitize(confirmedUser, ctx);

      // Prepare response
      const response = {
        jwt,
        user: sanitizedUser,
        message: 'Email confirmed successfully. You are now logged in.'
      };

      strapi.log.info(`✅ User ${confirmedUser.email} confirmed and auto-logged in`);
      strapi.log.info('=== CUSTOM EMAIL CONFIRMATION SUCCESS ===');

      // Return JSON response (no redirect)
      return ctx.send(response);

    } catch (error) {
      strapi.log.error('=== EMAIL CONFIRMATION ERROR ===');
      strapi.log.error('Error:', error);
      
      return ctx.badRequest('Email confirmation failed');
    }
  };
  
  return plugin;
};