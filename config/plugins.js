module.exports = ({ env }) => ({
  // Email provider configuration for Strapi v5
  email: {
    config: {
      provider: 'sendgrid',
      providerOptions: {
        apiKey: env('SENDGRID_API_KEY'),
      },
      settings: {
        defaultFrom: env('SENDGRID_FROM_EMAIL'),
        defaultFromName: env('SENDGRID_FROM_NAME'),
        defaultReplyTo: env('SENDGRID_FROM_EMAIL'),
        testAddress: env('SENDGRID_TEST_EMAIL'),
      },
    },
  },
  // Users-permissions plugin configuration for Strapi v5
  'users-permissions': {
    config: {
      register: {
        allowedFields: ['username', 'email', 'password'],
      },
      jwt: {
        expiresIn: '7d',
      },
      email: {
        confirmation: {
          // No redirect - let our custom controller return JSON for auto-login
        },
      },
    },
  },
  // Official CKEditor 5 plugin for Strapi v5 - Enhanced for robust blog editing
  "ckeditor": {
    enabled: true,
    config: {
      preset: "rich", // Available presets: "rich", "standard", "light", "toolbar"
      maxLength: 100000, // Increased for longer blog posts
      
      // Enhanced toolbar for blog editing
      toolbar: {
        items: [
          'heading', '|',
          'bold', 'italic', 'underline', 'strikethrough', '|',
          'fontSize', 'fontColor', 'fontBackgroundColor', '|',
          'alignment', '|',
          'numberedList', 'bulletedList', 'todoList', '|',
          'outdent', 'indent', '|',
          'link', 'blockQuote', 'insertTable', '|',
          'code', 'codeBlock', '|',
          'specialCharacters', 'horizontalLine', '|',
          'findAndReplace', '|',
          'undo', 'redo'
        ],
        shouldNotGroupWhenFull: true
      },
      
      // Enhanced heading options for blog structure
      heading: {
        options: [
          { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
          { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
          { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
          { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
          { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
          { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
          { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
        ]
      },
      
      // Enhanced table features for structured content
      table: {
        contentToolbar: [
          'tableColumn', 'tableRow', 'mergeTableCells',
          'tableProperties', 'tableCellProperties'
        ]
      },
      
      // Font size options for better typography
      fontSize: {
        options: [
          9, 10, 11, 12, 'default', 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72
        ]
      },
      
      // Enhanced link features
      link: {
        decorators: {
          openInNewTab: {
            mode: 'manual',
            label: 'Open in a new tab',
            attributes: {
              target: '_blank',
              rel: 'noopener noreferrer'
            }
          }
        }
      },
      
      // Better list features for blog content
      list: {
        properties: {
          styles: true,
          startIndex: true,
          reversed: true
        }
      },
      
      // Code block configuration for technical content
      codeBlock: {
        languages: [
          { language: 'plaintext', label: 'Plain text' },
          { language: 'c', label: 'C' },
          { language: 'cs', label: 'C#' },
          { language: 'cpp', label: 'C++' },
          { language: 'css', label: 'CSS' },
          { language: 'diff', label: 'Diff' },
          { language: 'html', label: 'HTML' },
          { language: 'java', label: 'Java' },
          { language: 'javascript', label: 'JavaScript' },
          { language: 'php', label: 'PHP' },
          { language: 'python', label: 'Python' },
          { language: 'ruby', label: 'Ruby' },
          { language: 'typescript', label: 'TypeScript' },
          { language: 'xml', label: 'XML' }
        ]
      },
      
      // Word count for blog posts
      wordCount: {
        onUpdate: function(stats) {
          // Word count will be displayed in the editor
        }
      }
    },
  },
  // Import Export plugin for selective content sync
  "strapi-import-export": {
    enabled: true,
    config: {
      // Configuration options for the import/export plugin
    },
  },
  "strapi-5-sitemap-plugin": {
    enabled: true,
    config: {
      contentTypes: {
        "api::subject.subject": {
          priority: 0.9,
          changefreq: "weekly",
          fields: ["title", "slug", "updatedAt", "description"],
          lastmod: "updatedAt",
          filter: (entry) => entry.publishedAt !== null,
        },
        "api::essay.essay": {
          priority: 0.8,
          changefreq: "monthly", 
          fields: ["title", "slug", "updatedAt", "month", "year"],
          lastmod: "updatedAt",
          filter: (entry) => entry.publishedAt !== null,
          transform: (entry) => ({
            ...entry,
            alternates: [
              {
                href: `https://possue.com/essays/${entry.slug}`,
                hreflang: 'en-US'
              }
            ]
          })
        },
        "api::answer.answer": {
          priority: 0.7,
          changefreq: "monthly",
          fields: ["title", "slug", "updatedAt"],
          lastmod: "updatedAt",
          filter: (entry) => entry.publishedAt !== null,
        },
      },
      hostname: env("SITEMAP_HOSTNAME", "https://possue.com"),
      includeHomepage: true,
      excludeDrafts: true,
      limit: 50000,
      gzip: true,
      xsl: true,
      // Custom static pages for legal education
      customEntries: [
        {
          url: "/subjects",
          changefreq: "weekly",
          priority: 0.9,
          lastmod: new Date().toISOString()
        },
        {
          url: "/about",
          changefreq: "monthly",
          priority: 0.5,
          lastmod: new Date().toISOString()
        },
        {
          url: "/contact",
          changefreq: "monthly",
          priority: 0.4,
          lastmod: new Date().toISOString()
        }
      ]
    },
  },
});
