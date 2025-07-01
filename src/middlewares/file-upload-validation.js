'use strict';

/**
 * `file-upload-validation` middleware
 */

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Only apply to user essay submission uploads
    if (ctx.request.url.includes('/user-essay-submissions') && ctx.request.method === 'POST') {
      
      // Check if there are any files in the request
      if (ctx.request.files) {
        const files = ctx.request.files;
        
        // Validate each file
        for (const fileKey in files) {
          const file = files[fileKey];
          
          // File size validation (10MB max)
          const maxSize = 10 * 1024 * 1024; // 10MB in bytes
          if (file.size > maxSize) {
            return ctx.badRequest(`File ${file.name} exceeds maximum size of 10MB`);
          }
          
          // File type validation
          const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif'
          ];
          
          if (!allowedTypes.includes(file.type)) {
            return ctx.badRequest(`File type ${file.type} is not allowed. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG, GIF`);
          }
          
          // File name validation (no special characters except . - _)
          const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
          if (!fileNameRegex.test(file.name)) {
            return ctx.badRequest(`File name contains invalid characters. Use only letters, numbers, dots, hyphens, and underscores.`);
          }
        }
      }
    }
    
    await next();
  };
};