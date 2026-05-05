const fs = require('fs');
const path = require('path');

// Paths
const envPath = path.resolve(__dirname, '../../ConnectHub/.env');
const targetPath = path.resolve(__dirname, '../src/environments/environment.ts');

// Priority: process.env > .env file > default
let googleClientId = process.env.GOOGLE_CLIENT_ID;
let apiUrl = process.env.API_URL;
let hubUrl = process.env.HUB_URL;

// If variables not in process.env, try reading from local .env
if ((!googleClientId || !apiUrl || !hubUrl) && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (!googleClientId) {
    const match = envContent.match(/^GOOGLE_CLIENT_ID=(.*)$/m);
    if (match) googleClientId = match[1].trim();
  }
  
  if (!apiUrl) {
    const match = envContent.match(/^API_URL=(.*)$/m);
    if (match) apiUrl = match[1].trim();
  }

  if (!hubUrl) {
    const match = envContent.match(/^HUB_URL=(.*)$/m);
    if (match) hubUrl = match[1].trim();
  }
}

// Fallbacks for local development
googleClientId = googleClientId || '288824054265-bbvt754hpo80e64gm9o5vj3o9o0umkl7.apps.googleusercontent.com';
apiUrl = apiUrl || 'http://localhost:8080/api';
hubUrl = hubUrl || 'http://localhost:8080/hubs';

console.log('Syncing environment variables:');
console.log(`- API_URL: ${apiUrl}`);
console.log(`- HUB_URL: ${hubUrl}`);
console.log(`- GOOGLE_CLIENT_ID: ${googleClientId ? googleClientId.substring(0, 5) + '...' : 'MISSING'}`);

// List of target files
const targetFiles = [
  path.resolve(__dirname, '../src/environments/environment.ts'),
  path.resolve(__dirname, '../src/environments/environment.prod.ts')
];

targetFiles.forEach(targetPath => {
  if (!fs.existsSync(targetPath)) {
    console.warn(` Info: Skipping missing file: ${path.basename(targetPath)}`);
    return;
  }

  let environmentContent = fs.readFileSync(targetPath, 'utf8');

  // Replace Values
  let updatedContent = environmentContent.replace(
    /apiUrl:\s*'.*'/g,
    `apiUrl: '${apiUrl}'`
  );
  updatedContent = updatedContent.replace(
    /hubUrl:\s*'.*'/g,
    `hubUrl: '${hubUrl}'`
  );
  updatedContent = updatedContent.replace(
    /googleClientId:\s*'.*'/g,
    `googleClientId: '${googleClientId}'`
  );

  if (environmentContent !== updatedContent) {
    fs.writeFileSync(targetPath, updatedContent, 'utf8');
    console.log(` Success: ${path.basename(targetPath)} synchronized!`);
  } else {
    console.log(` Info: ${path.basename(targetPath)} is already up to date.`);
  }
});
