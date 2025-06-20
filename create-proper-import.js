const fs = require('fs');
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// Read the exported live data
const subjects = JSON.parse(fs.readFileSync('./exports/subjects.json', 'utf8'));
const essays = JSON.parse(fs.readFileSync('./exports/essays.json', 'utf8'));
const answers = JSON.parse(fs.readFileSync('./exports/answers.json', 'utf8'));

// Create import directory
const importDir = './proper-import';
if (fs.existsSync(importDir)) {
  execSync(`rm -rf ${importDir}`);
}
fs.mkdirSync(importDir, { recursive: true });
fs.mkdirSync(`${importDir}/entities`, { recursive: true });
fs.mkdirSync(`${importDir}/schemas`, { recursive: true });
fs.mkdirSync(`${importDir}/links`, { recursive: true });
fs.mkdirSync(`${importDir}/configuration`, { recursive: true });

// Create metadata
const metadata = {
  createdAt: new Date().toISOString(),
  strapi: {
    version: "5.16.0"
  }
};
fs.writeFileSync(`${importDir}/metadata.json`, JSON.stringify(metadata, null, 2));

// Create entities JSONL file
const entitiesFile = `${importDir}/entities/entities_00001.jsonl`;
let entityLines = [];

// Add subjects
subjects.data.forEach(subject => {
  const entity = {
    type: "api::subject.subject",
    id: subject.id,
    data: {
      documentId: subject.attributes.uuid || uuidv4(),
      title: subject.attributes.title,
      description: subject.attributes.description,
      createdAt: subject.attributes.createdAt,
      updatedAt: subject.attributes.updatedAt,
      publishedAt: subject.attributes.publishedAt,
      locale: "en"
    }
  };
  entityLines.push(JSON.stringify(entity));
});

// Add essays
essays.data.forEach(essay => {
  const entity = {
    type: "api::essay.essay",
    id: essay.id,
    data: {
      documentId: essay.attributes.uuid || uuidv4(),
      title: essay.attributes.title,
      content: essay.attributes.content,
      createdAt: essay.attributes.createdAt,
      updatedAt: essay.attributes.updatedAt,
      publishedAt: essay.attributes.publishedAt,
      locale: "en"
    }
  };
  entityLines.push(JSON.stringify(entity));
});

// Add answers
answers.data.forEach(answer => {
  const entity = {
    type: "api::answer.answer",
    id: answer.id,
    data: {
      documentId: answer.attributes.uuid || uuidv4(),
      content: answer.attributes.content,
      createdAt: answer.attributes.createdAt,
      updatedAt: answer.attributes.updatedAt,
      publishedAt: answer.attributes.publishedAt,
      locale: "en"
    }
  };
  entityLines.push(JSON.stringify(entity));
});

// Write entities file
fs.writeFileSync(entitiesFile, entityLines.join('\n'));

// Copy schema, links, and configuration from the sample export
execSync(`cp temp-export/schemas/schemas_00001.jsonl ${importDir}/schemas/`);
execSync(`cp temp-export/links/links_00001.jsonl ${importDir}/links/`);
execSync(`cp temp-export/configuration/configuration_00001.jsonl ${importDir}/configuration/`);

// Create tar file
execSync(`cd ${importDir} && tar -czf ../live-data-import.tar.gz .`);

console.log('✅ Created live-data-import.tar.gz');
console.log(`📊 Contents: ${subjects.data.length} subjects, ${essays.data.length} essays, ${answers.data.length} answers`);
console.log(`📝 Total entities: ${entityLines.length}`);