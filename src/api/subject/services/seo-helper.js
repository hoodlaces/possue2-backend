'use strict';

/**
 * SEO Helper Service for Legal Education Content
 */

module.exports = () => ({
  /**
   * Generate structured data for subjects
   */
  generateSubjectStructuredData(subject) {
    const baseUrl = process.env.SITEMAP_HOSTNAME || 'https://possue.com';
    
    return {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": subject.title,
      "description": subject.description,
      "url": `${baseUrl}/subjects/${subject.slug}`,
      "provider": {
        "@type": "Organization",
        "name": "Possue Bar Exam Prep",
        "url": baseUrl
      },
      "educationalCredentialAwarded": "Bar Exam Preparation",
      "audience": {
        "@type": "EducationalAudience",
        "educationalRole": "student"
      },
      "about": {
        "@type": "Thing",
        "name": "Legal Education"
      },
      "teaches": subject.title,
      "courseMode": "online",
      "isAccessibleForFree": true
    };
  },

  /**
   * Generate structured data for essays
   */
  generateEssayStructuredData(essay, subjects = []) {
    const baseUrl = process.env.SITEMAP_HOSTNAME || 'https://possue.com';
    
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": essay.title,
      "url": `${baseUrl}/essays/${essay.slug}`,
      "datePublished": essay.createdAt,
      "dateModified": essay.updatedAt,
      "author": {
        "@type": "Organization",
        "name": "Possue Bar Exam Prep"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Possue Bar Exam Prep",
        "url": baseUrl
      },
      "articleSection": "Legal Education",
      "about": subjects.map(subject => ({
        "@type": "Thing",
        "name": subject.title,
        "url": `${baseUrl}/subjects/${subject.slug}`
      })),
      "educationalUse": "bar-exam-prep",
      "audience": {
        "@type": "EducationalAudience",
        "educationalRole": "student"
      },
      "learningResourceType": "essay",
      "isAccessibleForFree": true
    };
  },

  /**
   * Generate structured data for answers
   */
  generateAnswerStructuredData(answer, relatedEssay = null) {
    const baseUrl = process.env.SITEMAP_HOSTNAME || 'https://possue.com';
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": ["Article", "Answer"],
      "headline": answer.title,
      "url": `${baseUrl}/answers/${answer.slug}`,
      "datePublished": answer.createdAt,
      "dateModified": answer.updatedAt,
      "author": {
        "@type": "Organization",
        "name": "Possue Bar Exam Prep"
      },
      "publisher": {
        "@type": "Organization", 
        "name": "Possue Bar Exam Prep",
        "url": baseUrl
      },
      "articleSection": "Legal Education",
      "educationalUse": "bar-exam-prep",
      "audience": {
        "@type": "EducationalAudience",
        "educationalRole": "student"
      },
      "learningResourceType": "answer",
      "isAccessibleForFree": true
    };

    if (relatedEssay) {
      structuredData.isPartOf = {
        "@type": "Article",
        "name": relatedEssay.title,
        "url": `${baseUrl}/essays/${relatedEssay.slug}`
      };
    }

    return structuredData;
  },

  /**
   * Generate FAQ structured data for subjects with essays
   */
  generateSubjectFAQStructuredData(subject, essays = []) {
    if (!essays.length) return null;

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": essays.map(essay => ({
        "@type": "Question",
        "name": essay.title,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": essay.title // This would be enhanced with actual answer content
        }
      }))
    };
  },

  /**
   * Generate breadcrumb structured data
   */
  generateBreadcrumbStructuredData(breadcrumbs) {
    const baseUrl = process.env.SITEMAP_HOSTNAME || 'https://possue.com';
    
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": `${baseUrl}${crumb.url}`
      }))
    };
  }
});