#!/usr/bin/env node

/**
 * Bulk SEO Generation Script for Possue Legal Education
 * Automatically generates SEO metadata for all essays without existing SEO data
 */

'use strict';

// Load environment variables from .env file
require('dotenv').config();

// Using PostgreSQL directly with pg client
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'possue2_db_v5',
  user: process.env.DATABASE_USERNAME || 'possue2_db_v5_user',
  password: process.env.DATABASE_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

// Validate required environment variables
if (!process.env.DATABASE_PASSWORD) {
  console.error('❌ DATABASE_PASSWORD environment variable is required');
  process.exit(1);
}

/**
 * Generate SEO-optimized meta title
 */
function generateMetaTitle(essay) {
  const baseTitle = essay.title;
  const yearMonth = `${essay.month} ${essay.year}`;
  
  // Truncate to fit within 60 characters
  const maxLength = 60;
  const suffix = ` | CA Bar Exam ${yearMonth}`;
  const maxTitleLength = maxLength - suffix.length;
  
  let title = baseTitle;
  if (title.length > maxTitleLength) {
    title = title.substring(0, maxTitleLength - 3) + '...';
  }
  
  return title + suffix;
}

/**
 * Generate SEO-optimized meta description
 */
function generateMetaDescription(essay, subjects = []) {
  const yearMonth = `${essay.month} ${essay.year}`;
  const subjectText = subjects.length > 0 ? subjects.map(s => s.title).join(', ') : 'Legal Practice';
  
  let description = `California Bar Exam question from ${yearMonth} covering ${subjectText}. `;
  
  // Extract first sentence or 100 characters from content
  if (essay.content) {
    const cleanContent = essay.content.replace(/<[^>]*>/g, '').trim();
    const firstSentence = cleanContent.split('.')[0];
    const excerpt = firstSentence.length > 80 ? 
      cleanContent.substring(0, 80) + '...' : 
      firstSentence + '.';
    description += excerpt;
  } else {
    description += `Practice question for bar exam preparation and legal education.`;
  }
  
  // Ensure description is between 50-160 characters
  if (description.length < 50) {
    description += ` Essential for California bar exam prep and legal education.`;
  }
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }
  
  return description;
}

/**
 * Generate keywords based on essay content and metadata
 */
function generateKeywords(essay, subjects = []) {
  const baseKeywords = [
    'California Bar Exam',
    `${essay.month} ${essay.year}`,
    'bar exam preparation',
    'legal education',
    'law school',
    'California State Bar'
  ];
  
  // Add subject-specific keywords
  subjects.forEach(subject => {
    baseKeywords.push(subject.title);
    baseKeywords.push(`${subject.title} law`);
  });
  
  // Add practice area if available
  if (essay.practiceArea) {
    baseKeywords.push(essay.practiceArea);
  }
  
  return baseKeywords.join(', ');
}

/**
 * Generate structured data for the essay
 */
function generateStructuredData(essay, subjects = []) {
  const baseUrl = process.env.SITEMAP_HOSTNAME || 'https://possue.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: essay.title,
    description: generateMetaDescription(essay, subjects),
    url: `${baseUrl}/essays/${essay.slug}`,
    datePublished: essay.created_at,
    dateModified: essay.updated_at,
    author: {
      '@type': 'Organization',
      name: 'California State Bar',
      url: 'https://www.calbar.ca.gov'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Possue Legal Education',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/essays/${essay.slug}`
    },
    articleSection: subjects.length > 0 ? subjects[0].title : 'California Bar Exam',
    keywords: generateKeywords(essay, subjects),
    about: {
      '@type': 'Thing',
      name: `California Bar Exam ${essay.month} ${essay.year}`,
      description: `Official California Bar Examination question from ${essay.month} ${essay.year}`
    },
    educationalUse: 'bar-exam-prep',
    educationalLevel: 'professional',
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: ['student', 'professional']
    },
    inLanguage: 'en-US',
    isAccessibleForFree: true
  };
}

/**
 * Create SEO component for an essay
 */
async function createSEOComponent(essay, subjects = []) {
  const metaTitle = generateMetaTitle(essay);
  const metaDescription = generateMetaDescription(essay, subjects);
  const keywords = generateKeywords(essay, subjects);
  const structuredData = generateStructuredData(essay, subjects);
  
  // Insert into components_shared_seos table
  const seoResult = await pool.query(`
    INSERT INTO components_shared_seos (
      meta_title, 
      meta_description, 
      keywords, 
      meta_robots, 
      structured_data,
      educational_use,
      educational_level,
      practice_area,
      jurisdiction,
      canonical_url
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id
  `, [
    metaTitle,
    metaDescription,
    keywords,
    'index, follow',
    JSON.stringify(structuredData),
    'bar-exam-prep',
    'law-student',
    subjects.length > 0 ? subjects[0].title : null,
    'California',
    `https://possue.com/essays/${essay.slug}`
  ]);
  
  const seoId = seoResult.rows[0].id;
  
  // Link SEO component to essay in the linking table
  await pool.query(`
    INSERT INTO essays_cmps (entity_id, cmp_id, component_type, field, "order")
    VALUES ($1, $2, $3, $4, $5)
  `, [essay.id, seoId, 'shared.seo', 'seo', 1]);
  
  return seoId;
}

/**
 * Get essays without SEO data
 */
async function getEssaysWithoutSEO() {
  const result = await pool.query(`
    SELECT e.id, e.title, e.content, e.slug, e.month, e.year, e.created_at, e.updated_at
    FROM essays e
    LEFT JOIN essays_cmps seo_link ON e.id = seo_link.entity_id 
      AND seo_link.component_type = 'shared.seo' 
      AND seo_link.field = 'seo'
    WHERE e.published_at IS NOT NULL 
      AND seo_link.entity_id IS NULL
    ORDER BY e.year DESC, e.month, e.title
  `);
  
  return result.rows;
}

/**
 * Get subjects for an essay
 */
async function getEssaySubjects(essayId) {
  const result = await pool.query(`
    SELECT s.id, s.title, s.slug
    FROM subjects s
    JOIN essays_subjects_lnk esl ON s.id = esl.subject_id
    WHERE esl.essay_id = $1
  `, [essayId]);
  
  return result.rows;
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting Bulk SEO Generation for Possue Legal Education');
  console.log('=' .repeat(60));
  
  try {
    // Get essays without SEO data
    const essays = await getEssaysWithoutSEO();
    console.log(`📊 Found ${essays.length} essays without SEO data`);
    
    if (essays.length === 0) {
      console.log('✅ All essays already have SEO data!');
      return;
    }
    
    let processed = 0;
    let errors = 0;
    
    for (const essay of essays) {
      try {
        console.log(`📝 Processing: ${essay.title} (${essay.month} ${essay.year})`);
        
        // Get subjects for this essay
        const subjects = await getEssaySubjects(essay.id);
        
        // Create SEO component
        const seoId = await createSEOComponent(essay, subjects);
        
        processed++;
        console.log(`   ✅ Created SEO component ${seoId} for essay ${essay.id}`);
        
        // Add a small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errors++;
        console.error(`   ❌ Error processing essay ${essay.id}: ${error.message}`);
      }
    }
    
    console.log('\\n' + '='.repeat(60));
    console.log(`🎉 Bulk SEO Generation Complete!`);
    console.log(`✅ Successfully processed: ${processed} essays`);
    console.log(`❌ Errors: ${errors} essays`);
    console.log(`📈 SEO coverage: ${Math.round((processed / essays.length) * 100)}%`);
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  generateMetaTitle,
  generateMetaDescription,
  generateKeywords,
  generateStructuredData,
  createSEOComponent
};