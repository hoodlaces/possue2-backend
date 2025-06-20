module.exports = ({ env }) => {
  // In production, use DATABASE_URL, otherwise use individual connection params
  if (env('NODE_ENV') === 'production' && env('DATABASE_URL')) {
    return {
      connection: {
        client: 'postgres',
        connection: env('DATABASE_URL'),
        acquireConnectionTimeout: 60000,
        pool: {
          min: 2,
          max: 10,
        },
      },
    };
  }

  // Development configuration (local database)
  return {
    connection: {
      client: 'postgres',
      connection: {
        host: env('DATABASE_HOST', '127.0.0.1'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi-marketplace-v5'),
        user: env('DATABASE_USERNAME', 'postgres'),
        password: env('DATABASE_PASSWORD', '1212'),
        ssl: env.bool('DATABASE_SSL', false),
      },
    },
  };
};
