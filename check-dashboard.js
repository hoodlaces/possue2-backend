const http = require('http');

console.log('Checking Strapi dashboard...\n');

// Check if dashboard HTML loads
http.get('http://localhost:1337/dashboard/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('1. Dashboard HTML status:', res.statusCode);
    console.log('   - Has <div id="strapi">:', data.includes('<div id="strapi">') ? 'YES' : 'NO');
    console.log('   - Has app.js script:', data.includes('.strapi/client/app.js') ? 'YES' : 'NO');
    console.log('   - Has vite client:', data.includes('@vite/client') ? 'YES' : 'NO');
  });
});

// Check admin init endpoint
http.get('http://localhost:1337/admin/init', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\n2. Admin init status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('   - Response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('   - Error parsing:', e.message);
    }
  });
});

// Check main app.js
http.get('http://localhost:1337/dashboard/.strapi/client/app.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\n3. App.js status:', res.statusCode);
    console.log('   - Size:', data.length, 'bytes');
    console.log('   - Has renderAdmin:', data.includes('renderAdmin') ? 'YES' : 'NO');
    console.log('   - Has plugins:', data.includes('plugins:') ? 'YES' : 'NO');
  });
});

// Check Vite client
http.get('http://localhost:1337/dashboard/@vite/client', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\n4. Vite client status:', res.statusCode);
    console.log('   - Size:', data.length, 'bytes');
    console.log('   - Is valid JS:', data.startsWith('import') ? 'YES' : 'NO');
  });
});

// Check for console errors by loading a test page
setTimeout(() => {
  console.log('\n5. Summary:');
  console.log('   - Dashboard URL: http://localhost:1337/dashboard/');
  console.log('   - If page is blank, check browser console (F12) for errors');
  console.log('   - Common issues: Ad blockers, browser extensions, CORS');
}, 2000);