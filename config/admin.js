module.exports = ({ env }) => ({
  auth: {
    secret: env("ADMIN_JWT_SECRET", "d333441781a6b074fb3183904a37f8d8"),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  url: "/dashboard", // localhost:1337/dashboard
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    nps: false,
    promoteEE: false,
  },
});
