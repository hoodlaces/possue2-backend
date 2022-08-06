const { parse } = require("pg-connection-string");

module.exports = ({ env }) => ({
  connection: {
    client: "postgres",
    connection: {
      host: env("DATABASE_HOST", "dpg-cbnfg29a6gds3kmf1qn0-a"),
      port: env.int("DATABASE_PORT", 5432),
      database: env("DATABASE_NAME", "possue2"),
      user: env("DATABASE_USERNAME", "possue"),
      password: env("DATABASE_PASSWORD", "zY5Bx6s2D752UcM6oxIqnFIB6cD5JOqV"),
    },
    debug: false,
  },
});
