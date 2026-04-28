const fs = require('fs');
const path = require('path');

// Paths
const envPath = path.resolve(__dirname, '../../ConnectHub/.env');
const targetPath = path.resolve(__dirname, '../src/environments/environment.ts');

if (!fs.existsSync(envPath)) {
  console.warn(' Warning: Backend .env file not found. Skipping secret sync.');
  process.exit(0);
}

// Read .env
const envContent = fs.readFileSync(envPath, 'utf8');
const googleClientIdMatch = envContent.match(/^GOOGLE_CLIENT_ID=(.*)$/m);

if (!googleClientIdMatch || !googleClientIdMatch[1]) {
  console.warn(' Warning: GOOGLE_CLIENT_ID not found in .env. Skipping secret sync.');
  process.exit(0);
}

const googleClientId = googleClientIdMatch[1].trim();

// Read environment.ts
if (!fs.existsSync(targetPath)) {
  console.error(' Error: Frontend environment.ts not found.');
  process.exit(1);
}

let environmentContent = fs.readFileSync(targetPath, 'utf8');

// Replace Placeholder
const updatedContent = environmentContent.replace(
  /googleClientId:\s*'.*'/g,
  `googleClientId: '${googleClientId}'`
);

if (environmentContent !== updatedContent) {
  fs.writeFileSync(targetPath, updatedContent, 'utf8');
  console.log(' Success: Google Client ID synchronized from backend .env!');
} else {
  console.log(' Info: Google Client ID is already up to date.');
}
