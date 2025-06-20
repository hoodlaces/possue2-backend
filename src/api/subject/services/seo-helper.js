'use strict';

/**
 * SEO Helper Service for Legal Education Content
 * Generates structured data (Schema.org) for better search engine visibility
 */

module.exports = () => ({
  /**
   * Generate Course schema for Subject content type
   */
  generateSubjectSchema(subject, essays = []) {
    const baseUrl = process.env.SITEMAP_HOSTNAME || 'https://possue2-backend.onrender.com';
    
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: subject.title,
      description: subject.description || `California Bar Exam preparation for ${subject.title}`,
      url: `${baseUrl}/subjects/${subject.slug}`,
      provider: {
        '@type': 'Organization',
        name: 'Possue Legal Education',
        url: baseUrl
      },
      educationalLevel: 'Professional',
      teaches: subject.title,
      courseCode: subject.slug,
      numberOfCredits: essays.length,
      timeRequired: `P${Math.ceil(essays.length / 4)}W`, // Estimated weeks based on essay count
      inLanguage: 'en-US',
      audience: {
        '@type': 'EducationalAudience',
        educationalRole: ['student', 'professional']
      },
      about: {
        '@type': 'Thing',
        name: `${subject.title} - California Bar Exam`,
        description: `Legal education content for ${subject.title} bar exam preparation`
      }
    };

    // Add FAQs if essays exist
    if (essays && essays.length > 0) {
      schema.mainEntity = {
        '@type': 'FAQPage',
        mainEntity: essays.slice(0, 5).map(essay => ({
          '@type': 'Question',
          name: essay.title,
          acceptedAnswer: {
            '@type': 'Answer',
            text: essay.content ? essay.content.substring(0, 200) + '...' : 'California Bar Exam question and analysis.'
          }
        }))
      };
    }

    return schema;
  },

  /**
   * Generate Article schema for Essay content type
   */
  generateEssaySchema(essay, subject = null) {
    const baseUrl = process.env.SITEMAP_HOSTNAME || 'https://possue2-backend.onrender.com';
    
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: essay.title,
      description: essay.content ? essay.content.substring(0, 160) : `California Bar Exam essay question from ${essay.month} ${essay.year}`,
      url: `${baseUrl}/essays/${essay.slug}`,
      datePublished: essay.createdAt,
      dateModified: essay.updatedAt,
      author: {
        '@type': 'Organization',
        name: 'California State Bar',
        url: 'https://www.calbar.ca.gov'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Possue Legal Education',
        url: baseUrl
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${baseUrl}/essays/${essay.slug}`
      },
      articleSection: subject ? subject.title : 'California Bar Exam',
      keywords: [
        'California Bar Exam',
        essay.month,
        essay.year,
        'legal education',
        'bar prep'
      ].concat(subject ? [subject.title] : []).join(', '),
      about: {
        '@type': 'Thing',
        name: `California Bar Exam ${essay.month} ${essay.year}`,
        description: 'Official California Bar Examination question'
      },
      educationalUse: 'bar-exam-prep',
      educationalLevel: 'professional',
      audience: {
        '@type': 'EducationalAudience',
        educationalRole: ['student', 'professional']
      }
    };

    return schema;
  },

  /**
   * Generate Article schema for Answer content type
   */
  generateAnswerSchema(answer, relatedEssay = null) {
    const baseUrl = process.env.SITEMAP_HOSTNAME || 'https://possue2-backend.onrender.com';
    
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: answer.title,
      description: answer.content ? answer.content.substring(0, 160) : `Sample answer for California Bar Exam question from ${answer.month} ${answer.year}`,
      url: `${baseUrl}/answers/${answer.slug}`,
      datePublished: answer.createdAt,
      dateModified: answer.updatedAt,
      author: {
        '@type': 'Organization',
        name: 'Possue Legal Education',
        url: baseUrl
      },
      publisher: {
        '@type': 'Organization',
        name: 'Possue Legal Education',
        url: baseUrl
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${baseUrl}/answers/${answer.slug}`
      },
      articleSection: 'Sample Answers',
      keywords: [
        'California Bar Exam',
        'sample answer',
        answer.month,
        answer.year,
        'legal education',
        'bar prep'
      ].join(', '),
      about: {
        '@type': 'Thing',
        name: `California Bar Exam Sample Answer ${answer.month} ${answer.year}`,
        description: 'Sample answer for California Bar Examination question'
      },
      educationalUse: 'bar-exam-prep',
      educationalLevel: 'professional',
      audience: {
        '@type': 'EducationalAudience',
        educationalRole: ['student', 'professional']
      }
    };

    // Add relationship to essay if available
    if (relatedEssay) {
      schema.isBasedOn = {
        '@type': 'Article',
        name: relatedEssay.title,
        url: `${baseUrl}/essays/${relatedEssay.slug}`
      };
    }

    return schema;
  },

  /**
   * Generate BreadcrumbList schema for navigation
   */
  generateBreadcrumbSchema(breadcrumbs) {
    const baseUrl = process.env.SITEMAP_HOSTNAME || 'https://possue2-backend.onrender.com';
    
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: `${baseUrl}${crumb.url}`
      }))
    };
  },

  /**
   * Generate FAQ schema for subjects with multiple essays
   */
  generateFAQSchema(subject, essays) {
    if (!essays || essays.length === 0) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: essays.map(essay => ({
        '@type': 'Question',
        name: essay.title,
        acceptedAnswer: {
          '@type': 'Answer',
          text: essay.content ? essay.content.substring(0, 300) + '...' : `California Bar Exam question for ${subject.title} from ${essay.month} ${essay.year}.`
        }
      }))
    };
  },

  /**
   * Generate Organization schema for the site
   */
  generateOrganizationSchema() {
    const baseUrl = process.env.SITEMAP_HOSTNAME || 'https://possue2-backend.onrender.com';
    
    return {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'Possue Legal Education',
      url: baseUrl,
      description: 'California Bar Exam preparation and legal education resources',
      sameAs: [
        // Add social media URLs when available
      ],
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'CA',
        addressCountry: 'US'
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'info@possue.com'
      }
    };
  },

  /**
   * Combine multiple schemas into JSON-LD format
   */
  combineSchemas(...schemas) {
    const validSchemas = schemas.filter(schema => schema !== null && schema !== undefined);
    
    if (validSchemas.length === 0) return null;
    if (validSchemas.length === 1) return validSchemas[0];
    
    return {
      '@context': 'https://schema.org',
      '@graph': validSchemas
    };
  }
});