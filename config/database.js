module.exports = ({ env }) => {
  // Check if we have DATABASE_URL set (production mode)
  if (env('DATABASE_URL')) {
    return {
      connection: {
        client: 'postgres',
        connection: {
          connectionString: env('DATABASE_URL'),
          ssl: env('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        },
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
        password: env('DATABASE_PASSWORD'),
        ssl: env.bool('DATABASE_SSL', false),
      },
    },
  };
};
