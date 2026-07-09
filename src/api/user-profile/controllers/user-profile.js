'use strict';

/**
 * user-profile controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const UID = 'api::user-profile.user-profile';

function isOwnerOrAdmin(entity, user) {
  const isOwner = entity.user && entity.user.id === user.id;
  const isAdmin = user.isAdmin || user.role?.type === 'admin';
  return isOwner || isAdmin;
}

module.exports = createCoreController(UID, ({ strapi }) => ({
  // Profiles are strictly private - no public sharing concept
  async find(ctx) {
    const { user } = ctx.state;
    if (!user) return ctx.unauthorized('Authentication required');

    ctx.query = {
      ...ctx.query,
      filters: {
        ...ctx.query.filters,
        user: user.id,
      },
    };

    return await super.find(ctx);
  },

  async findOne(ctx) {
    const { user } = ctx.state;
    if (!user) return ctx.unauthorized('Authentication required');

    const entity = await strapi.documents(UID).findOne({ documentId: ctx.params.id, populate: ['user'] });
    if (!entity) return ctx.notFound();

    if (!isOwnerOrAdmin(entity, user)) {
      return ctx.forbidden('You do not have access to this profile');
    }

    return await super.findOne(ctx);
  },

  async create(ctx) {
    const { user } = ctx.state;
    if (!user) return ctx.unauthorized('Authentication required');

    // Force ownership to the requester regardless of what the client sent
    ctx.request.body.data = {
      ...ctx.request.body.data,
      user: user.id,
    };

    return await super.create(ctx);
  },

  async update(ctx) {
    const { user } = ctx.state;
    if (!user) return ctx.unauthorized('Authentication required');

    const entity = await strapi.documents(UID).findOne({ documentId: ctx.params.id, populate: ['user'] });
    if (!entity) return ctx.notFound();

    if (!isOwnerOrAdmin(entity, user)) {
      return ctx.forbidden('You do not have access to this profile');
    }

    // Prevent reassigning ownership via the request body
    if (ctx.request.body.data) {
      delete ctx.request.body.data.user;
    }

    return await super.update(ctx);
  },

  async delete(ctx) {
    const { user } = ctx.state;
    if (!user) return ctx.unauthorized('Authentication required');

    const entity = await strapi.documents(UID).findOne({ documentId: ctx.params.id, populate: ['user'] });
    if (!entity) return ctx.notFound();

    if (!isOwnerOrAdmin(entity, user)) {
      return ctx.forbidden('You do not have access to this profile');
    }

    return await super.delete(ctx);
  },
}));
