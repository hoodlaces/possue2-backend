/**
 * Reusable email template utilities based on the email-confirmation.html design
 * Ensures consistent styling across all emails in the Possue platform
 */

/**
 * Generate a professional email template with consistent Possue branding
 * @param {Object} options - Email template options
 * @param {string} options.title - Email title (appears in subject and header)
 * @param {string} options.heading - Main heading text
 * @param {string} options.content - Main email content (HTML)
 * @param {string} options.buttonText - Call-to-action button text (optional)
 * @param {string} options.buttonUrl - Call-to-action button URL (optional)
 * @param {string} options.buttonColor - Button background color (default: #3498db)
 * @param {string} options.footerText - Custom footer text (optional)
 * @returns {string} Complete HTML email template
 */
function generateEmailTemplate({
  title,
  heading,
  content,
  buttonText = null,
  buttonUrl = null,
  buttonColor = '#3498db',
  footerText = null
}) {
  const currentYear = new Date().getFullYear();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Possue</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #7f8c8d;
            font-size: 16px;
        }
        .action-button {
            display: inline-block;
            padding: 15px 30px;
            background-color: ${buttonColor};
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
        }
        .action-button:hover {
            opacity: 0.9;
        }
        .info-box {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 3px;
            font-size: 14px;
            font-weight: bold;
            text-transform: capitalize;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #7f8c8d;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Possue</div>
            <div class="subtitle">Legal Education Platform</div>
        </div>
        
        <h2>${heading}</h2>
        
        ${content}
        
        ${buttonText && buttonUrl ? `
        <div style="text-align: center;">
            <a href="${buttonUrl}" class="action-button">${buttonText}</a>
        </div>
        ` : ''}
        
        <div class="footer">
            ${footerText ? `<p>${footerText}</p>` : '<p>Thank you for being part of the Possue Legal Education Platform</p>'}
            <p>If you have any questions, please contact us at <a href="mailto:support@possue.com">support@possue.com</a></p>
            <p>&copy; ${currentYear} Possue. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate status badge HTML with appropriate color
 * @param {string} status - Status value
 * @param {string} customColor - Custom color (optional)
 * @returns {string} Status badge HTML
 */
function generateStatusBadge(status, customColor = null) {
  const statusColors = {
    'under-review': '#17a2b8',
    'approved': '#28a745',
    'rejected': '#dc3545',
    'needs-revision': '#ffc107',
    'published': '#28a745',
    'draft': '#6c757d'
  };
  
  const color = customColor || statusColors[status] || '#6c757d';
  const displayText = status.replace('-', ' ');
  
  return `<span class="status-badge" style="background-color: ${color}; color: white;">${displayText}</span>`;
}

/**
 * Generate info box HTML for displaying structured information
 * @param {string} title - Box title
 * @param {string} content - Box content (HTML)
 * @param {string} backgroundColor - Background color (optional)
 * @returns {string} Info box HTML
 */
function generateInfoBox(title, content, backgroundColor = '#f8f9fa') {
  return `
    <div class="info-box" style="background-color: ${backgroundColor};">
      ${title ? `<h3 style="margin-top: 0;">${title}</h3>` : ''}
      ${content}
    </div>
  `;
}

module.exports = {
  generateEmailTemplate,
  generateStatusBadge,
  generateInfoBox
};