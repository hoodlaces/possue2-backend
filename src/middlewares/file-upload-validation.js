'use strict';

/**
 * `file-upload-validation` middleware
 * Enhanced security validation for file uploads with PDF signature validation
 */

module.exports = (config, { strapi }) => {
  /**
   * Validate PDF signature (magic number)
   * PDFs must start with "%PDF-1." followed by version
   */
  const validatePDFSignature = (buffer) => {
    if (!buffer || buffer.length < 8) {
      return false;
    }

    // PDF signature: %PDF-1.x where x is version (0-7)
    // Hex: 25 50 44 46 2D 31 2E
    const pdfSignature = [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E];

    // Check first 7 bytes
    for (let i = 0; i < pdfSignature.length; i++) {
      if (buffer[i] !== pdfSignature[i]) {
        return false;
      }
    }

    // Check version number (should be ASCII '0' to '7')
    const version = buffer[7];
    if (version < 0x30 || version > 0x37) {
      return false;
    }

    return true;
  };

  /**
   * Sanitize filename to prevent path traversal
   */
  const sanitizeFilename = (filename) => {
    if (!filename) return `file_${Date.now()}.pdf`;

    // Remove path components
    filename = filename.replace(/^.*[\\\/]/, '');

    // Remove path traversal attempts
    filename = filename.replace(/\.\./g, '');

    // Only allow safe characters
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Ensure .pdf extension
    if (!filename.toLowerCase().endsWith('.pdf')) {
      filename = filename.replace(/\.[^.]*$/, '.pdf');
    }

    return filename.substring(0, 255);
  };

  return async (ctx, next) => {
    // Only apply to user essay submission uploads
    if (ctx.request.url.includes('/user-essay-submissions') && ctx.request.method === 'POST') {

      // Check if there are any files in the request
      if (ctx.request.files) {
        const files = ctx.request.files;

        // Validate each file
        for (const fileKey in files) {
          const file = files[fileKey];

          // File size validation - STANDARDIZED: 50KB minimum, 10MB maximum
          const minSize = 50 * 1024;      // 50KB minimum
          const maxSize = 10 * 1024 * 1024; // 10MB maximum

          if (file.size < minSize) {
            return ctx.badRequest(`File ${file.name} is too small. Minimum size is 50KB to ensure meaningful content.`);
          }

          if (file.size > maxSize) {
            return ctx.badRequest(`File ${file.name} exceeds maximum size of 10MB`);
          }

          // File type validation - RESTRICTED: PDF only for security
          if (file.type !== 'application/pdf') {
            return ctx.badRequest(`Only PDF files are allowed. Received: ${file.type}`);
          }

          // Validate PDF signature (magic number check) to prevent MIME spoofing
          try {
            const fs = require('fs');
            const fileBuffer = fs.readFileSync(file.path);
            const isValidPDF = validatePDFSignature(fileBuffer);

            if (!isValidPDF) {
              return ctx.badRequest(`Invalid PDF file. The file does not have a valid PDF signature.`);
            }
          } catch (signatureError) {
            strapi.log.error('PDF signature validation error:', signatureError);
            return ctx.badRequest(`Unable to validate PDF file signature.`);
          }

          // File name validation - Enhanced security
          // Check for path traversal attempts
          if (file.name.includes('../') || file.name.includes('..\\')) {
            return ctx.badRequest(`File name contains invalid path: ${file.name}`);
          }

          // Check for absolute paths
          if (file.name.startsWith('/') || file.name.includes(':\\')) {
            return ctx.badRequest(`File name cannot be an absolute path.`);
          }

          // Check for null bytes
          if (file.name.includes('\0')) {
            return ctx.badRequest(`File name contains invalid characters.`);
          }

          // Sanitize filename
          file.name = sanitizeFilename(file.name);
        }
      }
    }

    await next();
  };
};