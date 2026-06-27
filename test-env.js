const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const line = envFile.split('\n').find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY='));
if (line) {
  let val = line.substring('FIREBASE_SERVICE_ACCOUNT_KEY='.length);
  // Remove wrapping quotes if present
  if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
  try {
    const parsed = JSON.parse(val);
    console.log("Valid JSON. Private key starts with:", parsed.private_key.substring(0, 35));
  } catch(e) {
    console.error("Invalid JSON:", e.message);
  }
} else {
  console.log("Key not found");
}
