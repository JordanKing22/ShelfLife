#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 ShelfLife Environment Setup');
console.log('===============================\n');

const envPath = path.join(__dirname, '.env');
const examplePath = path.join(__dirname, 'env.example');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  console.log('If you need to update it, edit the .env file directly or delete it and run this script again.\n');
  process.exit(0);
}

// Check if env.example exists
if (!fs.existsSync(examplePath)) {
  console.error('❌ env.example file not found');
  console.error('Please make sure you have the env.example file in the project root.\n');
  process.exit(1);
}

try {
  // Copy env.example to .env
  fs.copyFileSync(examplePath, envPath);
  console.log('✅ Created .env file from template');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Edit the .env file with your actual API keys and credentials');
  console.log('2. Get MongoDB URI from https://www.mongodb.com/atlas');
  console.log('3. Get Veryfi API keys from https://www.veryfi.com/');
  console.log('4. Get Gemini API key from https://aistudio.google.com/');
  console.log('\n⚠️  Never commit the .env file to version control!');
  console.log('The .env file is already in .gitignore to protect your secrets.\n');
  
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
} 