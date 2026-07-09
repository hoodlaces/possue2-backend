'use strict';

/**
 * user-rule controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const UID = 'api::user-rule.user-rule';

function isOwnerOrAdmin(entity, user) {
  const isOwner = entity.user && entity.user.id === user.id;
  const isAdmin = user.isAdmin || user.role?.type === 'admin';
  return isOwner || isAdmin;
}

module.exports = createCoreController(UID, ({ strapi }) => ({
  // Own rules plus anything explicitly shared as public
  async find(ctx) {
    const { user } = ctx.state;
    if (!user) return ctx.unauthorized('Authentication required');

    ctx.query = {
      ...ctx.query,
      filters: {
        ...ctx.query.filters,
        $or: [{ user: user.id }, { isPublic: true }],
      },
    };

    return await super.find(ctx);
  },

  async findOne(ctx) {
    const { user } = ctx.state;
    if (!user) return ctx.unauthorized('Authentication required');

    const entity = await strapi.documents(UID).findOne({ documentId: ctx.params.id, populate: ['user'] });
    if (!entity) return ctx.notFound();

    if (!entity.isPublic && !isOwnerOrAdmin(entity, user)) {
      return ctx.forbidden('You do not have access to this rule');
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
      return ctx.forbidden('You do not have access to this rule');
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
      return ctx.forbidden('You do not have access to this rule');
    }

    return await super.delete(ctx);
  },
}));
