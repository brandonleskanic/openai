#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Azure AI Search + OpenAI Chat Application\n');

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion < 18) {
  console.error('❌ Node.js version 18 or higher is required. Current version:', nodeVersion);
  process.exit(1);
}
console.log('✅ Node.js version check passed:', nodeVersion);

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Please run this script from the project root directory');
  process.exit(1);
}

try {
  // Install root dependencies
  console.log('\n📦 Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Install client dependencies
  console.log('\n📦 Installing client dependencies...');
  execSync('cd client && npm install', { stdio: 'inherit' });

  // Install server dependencies
  console.log('\n📦 Installing server dependencies...');
  execSync('cd server && npm install', { stdio: 'inherit' });

  // Create server .env file if it doesn't exist
  const envExamplePath = path.join('server', 'env.example');
  const envPath = path.join('server', '.env');

  if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
    console.log('\n📝 Creating server environment file...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created server/.env from env.example');
    console.log('⚠️  Please edit server/.env with your actual API keys and configuration');
  }

  // Create uploads directory
  const uploadsDir = path.join('server', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory');
  }

  console.log('\n🎉 Setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Edit server/.env with your API keys:');
  console.log('   - OPENAI_API_KEY: Get from https://platform.openai.com/account/api-keys');
  console.log('   - AZURE_SEARCH_ENDPOINT: Your Azure Search service endpoint');
  console.log('   - AZURE_SEARCH_API_KEY: Your Azure Search admin key');
  console.log('   - AZURE_SEARCH_INDEX_NAME: Name for your search index');
  console.log('\n2. Start the development server:');
  console.log('   npm run dev');
  console.log('\n3. Open http://localhost:3000 in your browser');
  console.log('\n📚 For detailed setup instructions, see README.md');

} catch (error) {
  console.error('\n❌ Setup failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('- Make sure you have Node.js 18+ installed');
  console.log('- Check your internet connection');
  console.log('- Try running: npm cache clean --force');
  console.log('- For help, see README.md or open an issue');
  process.exit(1);
}
