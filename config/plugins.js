module.exports = ({ env }) => ({
  // Removed CKEditor plugin - not compatible with Strapi v5
  // Removed import-export-entries plugin - not compatible with Strapi v5
  "sitemap": {
    enabled: true,
    config: {
      autoGenerate: true,
      allowedFields: ["title", "slug", "updatedAt", "createdAt"],
      contentTypes: {
        "api::subject.subject": {
          priority: 0.8,
          changefreq: "weekly",
        },
        "api::essay.essay": {
          priority: 0.7,
          changefreq: "monthly",
        },
        "api::answer.answer": {
          priority: 0.6,
          changefreq: "monthly",
        },
      },
      hostname: env("SITEMAP_HOSTNAME", "https://possue.com"),
      includeHomepage: true,
    },
  },
});
