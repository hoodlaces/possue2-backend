module.exports = ({ env }) => {
  // Check if we're explicitly in production mode with DATABASE_URL
  if (env('DATABASE_URL') && (env('NODE_ENV') === 'production' || process.env.NODE_ENV === 'production')) {
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

  // Default to development configuration (local database)
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
