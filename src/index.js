'use strict';

async function setupPracticeSessionPermissions(strapi) {
  try {
    strapi.log.info('Setting up practice-session permissions...');
    
    // Get the authenticated user role
    const authenticatedRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    if (!authenticatedRole) {
      strapi.log.warn('Authenticated role not found, skipping permission setup');
      return;
    }

    // Define the permissions we need for practice-session
    const practiceSessionPermissions = [
      {
        action: 'api::practice-session.practice-session.find',
        enabled: true,
      },
      {
        action: 'api::practice-session.practice-session.findOne',
        enabled: true,
      },
      {
        action: 'api::practice-session.practice-session.create',
        enabled: true,
      },
      {
        action: 'api::practice-session.practice-session.syncSessions',
        enabled: true,
      }
    ];

    // Get existing permissions for this role
    const existingPermissions = await strapi
      .query('plugin::users-permissions.permission')
      .findMany({
        where: { role: authenticatedRole.id },
      });

    // Check and create missing permissions
    for (const permissionConfig of practiceSessionPermissions) {
      const existingPermission = existingPermissions.find(
        p => p.action === permissionConfig.action
      );

      if (!existingPermission) {
        await strapi.query('plugin::users-permissions.permission').create({
          data: {
            action: permissionConfig.action,
            enabled: permissionConfig.enabled,
            role: authenticatedRole.id,
          }
        });
        strapi.log.info(`Created permission: ${permissionConfig.action}`);
      } else if (existingPermission.enabled !== permissionConfig.enabled) {
        await strapi.query('plugin::users-permissions.permission').update({
          where: { id: existingPermission.id },
          data: { enabled: permissionConfig.enabled }
        });
        strapi.log.info(`Updated permission: ${permissionConfig.action}`);
      }
    }

    // Set up public permissions for leaderboard endpoint
    const publicRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (publicRole) {
      const leaderboardPermission = await strapi
        .query('plugin::users-permissions.permission')
        .findOne({
          where: { 
            role: publicRole.id,
            action: 'api::practice-session.practice-session.leaderboard'
          }
        });

      if (!leaderboardPermission) {
        await strapi.query('plugin::users-permissions.permission').create({
          data: {
            action: 'api::practice-session.practice-session.leaderboard',
            enabled: true,
            role: publicRole.id,
          }
        });
        strapi.log.info('Created public leaderboard permission');
      }
    }

    strapi.log.info('Practice-session permissions setup completed');
    
  } catch (error) {
    strapi.log.error('Error setting up practice-session permissions:', error);
  }
}

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    // Set up permissions for practice-session API
    await setupPracticeSessionPermissions(strapi);
  },
};
