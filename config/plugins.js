module.exports = ({ env }) => ({
  // Removed CKEditor plugin - not compatible with Strapi v5
  // Removed import-export-entries plugin - not compatible with Strapi v5
  "strapi-5-sitemap-plugin": {
    enabled: true,
    config: {
      contentTypes: {
        "api::subject.subject": {
          priority: 0.8,
          changefreq: "weekly",
          fields: ["title", "slug", "updatedAt"],
        },
        "api::essay.essay": {
          priority: 0.7,
          changefreq: "monthly", 
          fields: ["title", "slug", "updatedAt", "month", "year"],
        },
        "api::answer.answer": {
          priority: 0.6,
          changefreq: "monthly",
          fields: ["title", "slug", "updatedAt"],
        },
      },
      hostname: env("SITEMAP_HOSTNAME", "https://possue2-backend.onrender.com"),
      includeHomepage: true,
      excludeDrafts: true,
    },
  },
});
