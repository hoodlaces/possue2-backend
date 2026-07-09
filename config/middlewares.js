module.exports = ({ env }) => [
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: [
        env('CLIENT_URL', 'http://localhost:3000'),
        'https://possue.com',
        'https://www.possue.com',
        'http://localhost:3000',
      ],
      credentials: true,
    },
  },
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
