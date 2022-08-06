module.exports = ({ env }) => ({
  // ...
  slugify: {
    enabled: true,
    config: {
      contentTypes: {
        subject: {
          field: "slug",
          references: "title",
        },
      },
    },
  },
  // ...
});
