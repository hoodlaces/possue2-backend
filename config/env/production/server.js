module.exports = ({ env }) => ({
  url: env("RENDER_EXTERNAL_URL", ""),
  transfer: {
    remote: {
      enabled: true,
    },
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
