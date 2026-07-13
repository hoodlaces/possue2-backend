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

async function setupUserRulePermissions(strapi) {
  try {
    strapi.log.info('Setting up user-rule permissions...');
    
    // Get the authenticated user role
    const authenticatedRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    if (!authenticatedRole) {
      strapi.log.warn('Authenticated role not found, skipping user-rule permission setup');
      return;
    }

    // Define the permissions we need for user-rule
    const userRulePermissions = [
      {
        action: 'api::user-rule.user-rule.find',
        enabled: true,
      },
      {
        action: 'api::user-rule.user-rule.findOne',
        enabled: true,
      },
      {
        action: 'api::user-rule.user-rule.create',
        enabled: true,
      },
      {
        action: 'api::user-rule.user-rule.update',
        enabled: true,
      },
      {
        action: 'api::user-rule.user-rule.delete',
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
    for (const permissionConfig of userRulePermissions) {
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

    strapi.log.info('User-rule permissions setup completed');
    
  } catch (error) {
    strapi.log.error('Error setting up user-rule permissions:', error);
  }
}

async function setupBarJurisdictionPermissions(strapi) {
  try {
    strapi.log.info('Setting up bar-jurisdiction permissions...');
    
    // Get the authenticated user role
    const authenticatedRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    if (!authenticatedRole) {
      strapi.log.warn('Authenticated role not found, skipping bar-jurisdiction permission setup');
      return;
    }

    // Define the permissions we need for bar-jurisdiction
    const barJurisdictionPermissions = [
      {
        action: 'api::bar-jurisdiction.bar-jurisdiction.find',
        enabled: true,
      },
      {
        action: 'api::bar-jurisdiction.bar-jurisdiction.findOne',
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
    for (const permissionConfig of barJurisdictionPermissions) {
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

    // Set up public permissions for bar-jurisdiction endpoints
    const publicRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (publicRole) {
      const publicPermissions = [
        'api::bar-jurisdiction.bar-jurisdiction.find',
        'api::bar-jurisdiction.bar-jurisdiction.findOne'
      ];

      for (const action of publicPermissions) {
        const existingPermission = await strapi
          .query('plugin::users-permissions.permission')
          .findOne({
            where: { 
              role: publicRole.id,
              action: action
            }
          });

        if (!existingPermission) {
          await strapi.query('plugin::users-permissions.permission').create({
            data: {
              action: action,
              enabled: true,
              role: publicRole.id,
            }
          });
          strapi.log.info(`Created public permission: ${action}`);
        }
      }
    }

    strapi.log.info('Bar-jurisdiction permissions setup completed');
    
  } catch (error) {
    strapi.log.error('Error setting up bar-jurisdiction permissions:', error);
  }
}

async function setupDebugPermissions(strapi) {
  try {
    strapi.log.info('Setting up debug permissions...');

    const authenticatedRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    if (!authenticatedRole) {
      strapi.log.warn('Authenticated role not found, skipping debug permission setup');
      return;
    }

    // These routes are gated behind the is-admin policy, but Strapi only
    // lets a policy add restrictions ON TOP OF an already-granted base
    // permission - it can't grant access on its own. Confirmed live: zero
    // permission rows existed for any debug action for any role, so these
    // routes were unreachable even for is-admin-flagged accounts. Granting
    // the base permission here to Authenticated; is-admin still restricts
    // actual access to accounts with isAdmin=true.
    const debugPermissions = [
      { action: 'api::debug.debug.verificationStatus', enabled: true },
      { action: 'api::debug.debug.verificationStats', enabled: true },
      { action: 'api::debug.debug.resendVerification', enabled: true },
      { action: 'api::debug.debug.cleanupExpiredTokens', enabled: true },
    ];

    const existingPermissions = await strapi
      .query('plugin::users-permissions.permission')
      .findMany({ where: { role: authenticatedRole.id } });

    for (const permissionConfig of debugPermissions) {
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

    strapi.log.info('Debug permissions setup completed');

  } catch (error) {
    strapi.log.error('Error setting up debug permissions:', error);
  }
}

async function setupUserEssaySubmissionPermissions(strapi) {
  try {
    strapi.log.info('Setting up user-essay-submission permissions...');

    const authenticatedRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    if (!authenticatedRole) {
      strapi.log.warn('Authenticated role not found, skipping user-essay-submission permission setup');
      return;
    }

    // create/find/findOne/findApproved/findOwn/getStatistics/update already
    // had grants (set manually in the admin panel) - included here anyway
    // so this setup is fully idempotent and self-healing regardless of
    // current DB state, matching the pattern used elsewhere in this file.
    // approve/reject/findPending/updateStatus/findByStatus/delete are
    // gated behind is-admin, same reasoning as setupDebugPermissions above.
    const userEssaySubmissionPermissions = [
      { action: 'api::user-essay-submission.user-essay-submission.create', enabled: true },
      { action: 'api::user-essay-submission.user-essay-submission.find', enabled: true },
      { action: 'api::user-essay-submission.user-essay-submission.findOne', enabled: true },
      { action: 'api::user-essay-submission.user-essay-submission.findApproved', enabled: true },
      { action: 'api::user-essay-submission.user-essay-submission.findOwn', enabled: true },
      { action: 'api::user-essay-submission.user-essay-submission.getStatistics', enabled: true },
      { action: 'api::user-essay-submission.user-essay-submission.update', enabled: true },
      { action: 'api::user-essay-submission.user-essay-submission.approve', enabled: true },
      { action: 'api::user-essay-submission.user-essay-submission.reject', enabled: true },
      { action: 'api::user-essay-submission.user-essay-submission.findPending', enabled: true },
      { action: 'api::user-essay-submission.user-essay-submission.updateStatus', enabled: true },
      { action: 'api::user-essay-submission.user-essay-submission.findByStatus', enabled: true },
      { action: 'api::user-essay-submission.user-essay-submission.delete', enabled: true },
    ];

    const existingPermissions = await strapi
      .query('plugin::users-permissions.permission')
      .findMany({ where: { role: authenticatedRole.id } });

    for (const permissionConfig of userEssaySubmissionPermissions) {
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

    strapi.log.info('User-essay-submission permissions setup completed');

  } catch (error) {
    strapi.log.error('Error setting up user-essay-submission permissions:', error);
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

    // Set up permissions for user-rule API
    await setupUserRulePermissions(strapi);

    // Set up permissions for bar-jurisdiction API
    await setupBarJurisdictionPermissions(strapi);

    // Set up permissions for debug API
    await setupDebugPermissions(strapi);

    // Set up permissions for user-essay-submission API
    await setupUserEssaySubmissionPermissions(strapi);
  },
};
