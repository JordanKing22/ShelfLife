import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Environment Variables Check');
console.log('==============================\n');

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found');
  console.log('Run: npm run setup');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

console.log('📄 .env file contents (sanitized):');
console.log('==================================');

let mongoUriFound = false;
let mongoUriValid = false;
let veryfiClientFound = false;
let veryfiApiKeyFound = false;
let geminiApiKeyFound = false;

for (const line of lines) {
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=');
  
  if (key === 'MONGODB_URI') {
    mongoUriFound = true;
    if (value.startsWith('mongodb://') || value.startsWith('mongodb+srv://')) {
      mongoUriValid = true;
      console.log(`✅ ${key}=${value.substring(0, 15)}...`);
    } else {
      console.log(`❌ ${key}=${value.substring(0, 20)}... (INVALID FORMAT)`);
    }
  } else if (key === 'VERYFI_CLIENT_ID') {
    veryfiClientFound = !!value && value !== 'your_veryfi_client_id_here';
    console.log(`${veryfiClientFound ? '✅' : '❌'} ${key}=${veryfiClientFound ? '[SET]' : '[NOT SET]'}`);
  } else if (key === 'VERYFI_API_KEY') {
    veryfiApiKeyFound = !!value && value !== 'your_veryfi_api_key_here';
    console.log(`${veryfiApiKeyFound ? '✅' : '❌'} ${key}=${veryfiApiKeyFound ? '[SET]' : '[NOT SET]'}`);
  } else if (key === 'VITE_GEMINI_API_KEY') {
    geminiApiKeyFound = !!value && value !== 'your_gemini_api_key_here';
    console.log(`${geminiApiKeyFound ? '✅' : '❌'} ${key}=${geminiApiKeyFound ? '[SET]' : '[NOT SET]'}`);
  } else {
    console.log(`ℹ️  ${key}=${value}`);
  }
}

console.log('\n🎯 Summary:');
console.log('===========');

if (mongoUriFound && mongoUriValid) {
  console.log('✅ MongoDB: Ready');
} else if (mongoUriFound && !mongoUriValid) {
  console.log('❌ MongoDB: Invalid format - must start with "mongodb://" or "mongodb+srv://"');
} else {
  console.log('❌ MongoDB: Not configured');
}

console.log(`${veryfiClientFound && veryfiApiKeyFound ? '✅' : '❌'} Veryfi: ${veryfiClientFound && veryfiApiKeyFound ? 'Ready' : 'Not configured'}`);
console.log(`${geminiApiKeyFound ? '✅' : '❌'} Gemini: ${geminiApiKeyFound ? 'Ready' : 'Not configured'}`);

if (!mongoUriFound || !mongoUriValid) {
  console.log('\n💡 To fix MongoDB connection:');
  console.log('1. Go to MongoDB Atlas (https://cloud.mongodb.com/)');
  console.log('2. Click "Connect" on your cluster');
  console.log('3. Choose "Connect your application"');
  console.log('4. Copy the connection string');
  console.log('5. Replace MONGODB_URI in your .env file');
  console.log('   Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/...');
} 