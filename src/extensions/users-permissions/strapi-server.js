module.exports = (plugin) => {
  // Override only the emailConfirmation method, keep other methods intact
  
  plugin.controllers.auth.emailConfirmation = async (ctx) => {
    const { confirmation: confirmationToken } = ctx.query;

    // Debug logging
    strapi.log.info('=== EMAIL CONFIRMATION DEBUG START ===');
    strapi.log.info(`Custom email confirmation controller called with token: ${confirmationToken ? confirmationToken.substring(0, 10) + '...' : 'undefined'}`);

    try {
      // Validate the confirmation token using Strapi's built-in method
      strapi.log.info('Calling Strapi confirmEmail service...');
      const result = await strapi
        .plugin('users-permissions')
        .service('user')
        .confirmEmail(confirmationToken);

      strapi.log.info('ConfirmEmail service result:', { 
        hasUser: !!result.user, 
        hasJwt: !!result.jwt,
        userEmail: result.user?.email,
        jwtLength: result.jwt?.length 
      });

      const { user, jwt } = result;

      if (!user) {
        strapi.log.error('No user returned from confirmEmail service');
        return ctx.badRequest('Invalid confirmation token');
      }

      // Sanitize user data
      strapi.log.info('Sanitizing user data...');
      const sanitizedUser = await strapi.plugin('users-permissions').service('user').sanitize(user, ctx);
      strapi.log.info('User sanitized successfully');

      // Prepare response
      const response = {
        jwt,
        user: sanitizedUser,
        message: 'Email confirmed successfully. You are now logged in.'
      };

      strapi.log.info('Sending auto-login response:', {
        hasJwt: !!response.jwt,
        hasUser: !!response.user,
        userEmail: response.user?.email,
        userName: response.user?.username
      });

      // Log the successful confirmation
      strapi.log.info(`✅ User ${user.email} confirmed email and logged in automatically`);
      strapi.log.info('=== EMAIL CONFIRMATION DEBUG END ===');

      // Return both user data and JWT token for automatic login
      return ctx.send(response);

    } catch (error) {
      strapi.log.error('=== EMAIL CONFIRMATION ERROR ===');
      strapi.log.error('Email confirmation error:', error);
      strapi.log.error('Error details:', {
        message: error.message,
        stack: error.stack,
        confirmationToken: confirmationToken ? confirmationToken.substring(0, 10) + '...' : 'undefined'
      });
      
      // Handle specific error types
      if (error.message === 'Invalid token') {
        strapi.log.error('Invalid token error - returning 400');
        return ctx.badRequest('Invalid or expired confirmation token');
      }
      
      if (error.message === 'Email is already confirmed') {
        strapi.log.error('Email already confirmed error - returning 400');
        return ctx.badRequest('Email is already confirmed');
      }

      strapi.log.error('Generic email confirmation failure - returning 400');
      return ctx.badRequest('Email confirmation failed');
    }
  };
  
  return plugin;
};