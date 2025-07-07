// This file is imported by strapi-server.js to override the default auth controller
// We only override the emailConfirmation method while keeping other methods intact

module.exports = (plugin) => {
  // Return the existing auth controller - the actual override happens in strapi-server.js
  return plugin.controllers.auth;
};