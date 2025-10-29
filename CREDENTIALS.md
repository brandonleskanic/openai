# 🔐 Credentials & Configuration Guide

This guide shows you where to add your Azure OpenAI and OpenAI API credentials and secrets.

## 📂 Location

**All credentials go in:** `/server/.env`

This file is **git-ignored** and will never be committed to your repository.

---

## 🚀 Quick Setup

1. **Copy the example file:**
   ```bash
   cd server
   cp env.example .env
   ```

2. **Edit `.env` file** with your actual credentials (see sections below)

3. **Restart your server** after changing any values

---

## 🔑 Getting Your Credentials

### 1️⃣ Standard OpenAI API

**Where to get it:** https://platform.openai.com/account/api-keys

**Add to `.env`:**
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
EMBEDDINGS_MODEL=text-embedding-3-small
CHAT_MODEL=gpt-4
```

**Best for:** Quick prototyping, personal projects

---

### 2️⃣ Azure OpenAI Service

**Where to get it:** https://portal.azure.com → Azure OpenAI Service

#### Step 1: Get API Key & Endpoint
1. Go to Azure Portal → Your Azure OpenAI Resource
2. Click **"Keys and Endpoint"** in left menu
3. Copy **KEY 1** and **Endpoint**

#### Step 2: Get Deployment Names
1. Go to **Azure OpenAI Studio**: https://oai.azure.com
2. Click **"Deployments"** → Note your deployment names
   - Example: `gpt-4`, `gpt-35-turbo`, `text-embedding-ada-002`

**Add to `.env`:**
```env
USE_AZURE_OPENAI=true

# Azure OpenAI Credentials
AZURE_OPENAI_API_KEY=abc123def456ghi789jkl012mno345pq
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-10-01-preview

# Your Deployment Names (from Azure OpenAI Studio)
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT=text-embedding-3-small
AZURE_OPENAI_COMPLETION_DEPLOYMENT=gpt-35-turbo
```

**Best for:** Enterprise, production environments, compliance requirements

---

### 3️⃣ Azure AI Search (Required for RAG/Vector Search)

**Where to get it:** https://portal.azure.com → Azure AI Search

#### Steps:
1. Go to your Azure AI Search resource
2. Click **"Keys"** in left menu
3. Copy **Primary admin key** and **URL**

**Add to `.env`:**
```env
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_SEARCH_API_KEY=your-64-character-admin-key
AZURE_SEARCH_INDEX_NAME=my-documents-index
```

**Note:** Index name can be anything - it will be created automatically if it doesn't exist.

---

### 4️⃣ Azure AI Foundry & ML Workspace (Optional)

**Where to get it:** https://ai.azure.com or https://ml.azure.com

**Add to `.env`:**
```env
AZURE_ML_WORKSPACE_NAME=your-ml-workspace
AZURE_ML_ENDPOINT=https://your-workspace.eastus.inference.ml.azure.com
AZURE_SUBSCRIPTION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_RESOURCE_GROUP=your-resource-group
AZURE_LOCATION=eastus
```

---

## 🎯 Configuration Scenarios

### Scenario 1: Using Standard OpenAI (Simplest)
```env
USE_AZURE_OPENAI=false
OPENAI_API_KEY=sk-proj-xxxxx
AZURE_SEARCH_ENDPOINT=https://your-service.search.windows.net
AZURE_SEARCH_API_KEY=xxxxx
AZURE_SEARCH_INDEX_NAME=my-index
```

### Scenario 2: Using Azure OpenAI (Enterprise)
```env
USE_AZURE_OPENAI=true
AZURE_OPENAI_API_KEY=xxxxx
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT=text-embedding-ada-002
AZURE_SEARCH_ENDPOINT=https://your-service.search.windows.net
AZURE_SEARCH_API_KEY=xxxxx
AZURE_SEARCH_INDEX_NAME=my-index
```

### Scenario 3: Hybrid (Azure for embeddings, OpenAI for chat)
```env
USE_AZURE_OPENAI=false
OPENAI_API_KEY=sk-proj-xxxxx
# You can still use Azure services alongside
AZURE_SEARCH_ENDPOINT=https://your-service.search.windows.net
AZURE_SEARCH_API_KEY=xxxxx
```

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Store `.env` file in `server/` directory
- ✅ Never commit `.env` to git (already in `.gitignore`)
- ✅ Use different keys for development and production
- ✅ Rotate keys regularly
- ✅ Store production secrets in Azure Key Vault or similar
- ✅ Use environment-specific files (`.env.development`, `.env.production`)

### ❌ DON'T:
- ❌ Hardcode API keys in source code
- ❌ Share keys in Slack, email, or public channels
- ❌ Use production keys in development
- ❌ Commit `.env` files to version control
- ❌ Use the same key across multiple projects

---

## 🛠️ Alternative: Using `~/secrets/` (Per Your Setup)

Based on your user rules, you prefer storing secrets in `~/secrets/`. Here's how:

**Option 1: Symlink**
```bash
# Store actual .env in ~/secrets/
mkdir -p ~/secrets/openai-project
cp server/.env ~/secrets/openai-project/.env

# Create symlink in project
cd server
ln -sf ~/secrets/openai-project/.env .env
```

**Option 2: Source from secrets**
```bash
# In server/.env
source ~/secrets/openai-project/.env
```

**Option 3: Load at runtime**
```javascript
// In server/src/server.ts (modify)
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

// Try loading from ~/secrets first
const secretsPath = path.join(os.homedir(), 'secrets', 'openai-project', '.env');
dotenv.config({ path: secretsPath });

// Fallback to local .env
dotenv.config();
```

---

## 🧪 Testing Your Credentials

### Test Azure OpenAI Connection:
```bash
cd server
npm run dev
# Open http://localhost:5000/api/health
```

### Test via curl:
```bash
# Test OpenAI
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Test Azure Search
curl http://localhost:5000/api/azure/test
```

---

## 🆘 Troubleshooting

### "Missing required environment variables"
- Ensure `.env` file exists in `server/` directory
- Check file permissions: `chmod 600 server/.env`
- Restart the server after editing

### "Invalid API Key"
- Verify key format:
  - OpenAI: starts with `sk-proj-` or `sk-`
  - Azure OpenAI: 32-character alphanumeric string
- Check for extra spaces or quotes

### "Endpoint not found"
- Azure endpoint must end with `.openai.azure.com` (no trailing slash)
- Search endpoint must end with `.search.windows.net`

### "Deployment not found"
- Deployment names are case-sensitive
- Must match exactly what's in Azure OpenAI Studio
- Common mistake: `gpt-4` vs `gpt4` vs `GPT-4`

---

## 📚 Additional Resources

- **OpenAI API Docs:** https://platform.openai.com/docs
- **Azure OpenAI Docs:** https://learn.microsoft.com/azure/ai-services/openai/
- **Azure AI Search Docs:** https://learn.microsoft.com/azure/search/
- **Azure AI Foundry:** https://learn.microsoft.com/azure/ai-studio/

---

**Need Help?** Check the main [README.md](README.md) or [QUICKSTART.md](QUICKSTART.md)

