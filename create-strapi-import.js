const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the exported data
const subjects = JSON.parse(fs.readFileSync('./exports/subjects.json', 'utf8'));
const essays = JSON.parse(fs.readFileSync('./exports/essays.json', 'utf8'));
const answers = JSON.parse(fs.readFileSync('./exports/answers.json', 'utf8'));

// Create import directory structure
const importDir = './strapi-import';
const contentDir = `${importDir}/app/api`;

// Clean and create directories
if (fs.existsSync(importDir)) {
  execSync(`rm -rf ${importDir}`);
}
fs.mkdirSync(importDir, { recursive: true });
fs.mkdirSync(`${contentDir}/subject/content`, { recursive: true });
fs.mkdirSync(`${contentDir}/essay/content`, { recursive: true });
fs.mkdirSync(`${contentDir}/answer/content`, { recursive: true });

// Create metadata file
const metadata = {
  createdAt: new Date().toISOString(),
  strapi: {
    version: "5.16.0"
  }
};
fs.writeFileSync(`${importDir}/metadata.json`, JSON.stringify(metadata, null, 2));

// Transform and write subjects
const transformedSubjects = subjects.data.map(subject => ({
  id: subject.id,
  document_id: subject.attributes.uuid || `subject-${subject.id}`,
  title: subject.attributes.title,
  description: subject.attributes.description,
  created_at: subject.attributes.createdAt,
  updated_at: subject.attributes.updatedAt,
  published_at: subject.attributes.publishedAt,
  locale: 'en'
}));

fs.writeFileSync(
  `${contentDir}/subject/content/entries.json`, 
  JSON.stringify(transformedSubjects, null, 2)
);

// Transform and write essays
const transformedEssays = essays.data.map(essay => ({
  id: essay.id,
  document_id: essay.attributes.uuid || `essay-${essay.id}`,
  title: essay.attributes.title,
  content: essay.attributes.content,
  created_at: essay.attributes.createdAt,
  updated_at: essay.attributes.updatedAt,
  published_at: essay.attributes.publishedAt,
  locale: 'en'
}));

fs.writeFileSync(
  `${contentDir}/essay/content/entries.json`, 
  JSON.stringify(transformedEssays, null, 2)
);

// Transform and write answers
const transformedAnswers = answers.data.map(answer => ({
  id: answer.id,
  document_id: answer.attributes.uuid || `answer-${answer.id}`,
  content: answer.attributes.content,
  created_at: answer.attributes.createdAt,
  updated_at: answer.attributes.updatedAt,
  published_at: answer.attributes.publishedAt,
  locale: 'en'
}));

fs.writeFileSync(
  `${contentDir}/answer/content/entries.json`, 
  JSON.stringify(transformedAnswers, null, 2)
);

// Create tar file
console.log('Creating tar file...');
execSync(`cd ${importDir} && tar -czf ../strapi-export.tar.gz .`);

console.log('✅ Created strapi-export.tar.gz');
console.log(`📊 Contents: ${transformedSubjects.length} subjects, ${transformedEssays.length} essays, ${transformedAnswers.length} answers`);