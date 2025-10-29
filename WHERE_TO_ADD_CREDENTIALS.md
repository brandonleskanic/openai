# 🎯 WHERE TO ADD AZURE OPENAI CREDENTIALS

## Quick Answer

**File Location:** `/Users/brandonleskanic/code/openai/server/.env`

This file already exists and is ready for your credentials!

---

## 🔐 What Goes Where

### Azure OpenAI Credentials

```plaintext
📁 /Users/brandonleskanic/code/openai/
  └─ server/
     └─ .env  ← ADD ALL CREDENTIALS HERE
```

---

## 📝 Step-by-Step Instructions

### 1. Open the .env file
```bash
cd /Users/brandonleskanic/code/openai/server
open .env   # or use your text editor
```

### 2. Add Your Azure OpenAI Credentials

**Paste these lines and replace with your actual values:**

```env
# ===========================================
# Azure OpenAI Configuration
# ===========================================
USE_AZURE_OPENAI=true

# Get these from Azure Portal → Your Azure OpenAI Resource → Keys and Endpoint
AZURE_OPENAI_API_KEY=your-32-character-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-10-01-preview

# Get these from Azure OpenAI Studio → Deployments
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT=text-embedding-3-small
AZURE_OPENAI_COMPLETION_DEPLOYMENT=gpt-35-turbo
```

### 3. (Optional) Add Azure AI Search

```env
# ===========================================
# Azure AI Search Configuration
# ===========================================
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_SEARCH_API_KEY=your-64-character-admin-key-here
AZURE_SEARCH_INDEX_NAME=my-documents-index
```

### 4. (Optional) Add Azure AI Foundry / ML

```env
# ===========================================
# Azure AI Foundry / Machine Learning
# ===========================================
AZURE_ML_WORKSPACE_NAME=your-ml-workspace
AZURE_ML_ENDPOINT=https://your-workspace.eastus.inference.ml.azure.com
AZURE_SUBSCRIPTION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_RESOURCE_GROUP=your-resource-group
AZURE_LOCATION=eastus
```

### 5. Save and Restart

```bash
# Restart your server to load new credentials
cd /Users/brandonleskanic/code/openai
npm run dev
```

---

## 🔍 Where to Find Your Azure Credentials

### Azure OpenAI API Key & Endpoint

1. **Go to:** https://portal.azure.com
2. **Navigate to:** Your Azure OpenAI resource
3. **Click:** "Keys and Endpoint" (left sidebar)
4. **Copy:**
   - KEY 1 → `AZURE_OPENAI_API_KEY`
   - Endpoint → `AZURE_OPENAI_ENDPOINT`

### Azure OpenAI Deployment Names

1. **Go to:** https://oai.azure.com (Azure OpenAI Studio)
2. **Click:** "Deployments"
3. **Copy your deployment names** (case-sensitive!)
   - Example: `gpt-4`, `gpt-35-turbo`, `text-embedding-ada-002`

### Azure AI Search Credentials

1. **Go to:** https://portal.azure.com
2. **Navigate to:** Your Azure AI Search resource
3. **Click:** "Keys" (left sidebar)
4. **Copy:**
   - URL → `AZURE_SEARCH_ENDPOINT`
   - Primary admin key → `AZURE_SEARCH_API_KEY`

### Azure ML / AI Foundry

1. **Go to:** https://ml.azure.com or https://ai.azure.com
2. **Select your workspace**
3. **Click:** Settings → View all properties
4. **Copy:** Workspace name, Endpoint, Subscription ID

---

## ✅ Verification Checklist

After adding credentials, verify:

- [ ] File saved: `/Users/brandonleskanic/code/openai/server/.env`
- [ ] No quotes around values (unless value contains spaces)
- [ ] No trailing slashes on URLs
- [ ] Deployment names match exactly (case-sensitive)
- [ ] No spaces before or after `=` sign
- [ ] Server restarted after changes

---

## 🎨 Example: Complete .env File

```env
# ===========================================
# Azure OpenAI Configuration
# ===========================================
USE_AZURE_OPENAI=true
AZURE_OPENAI_API_KEY=abc123def456ghi789jkl012mno345pq
AZURE_OPENAI_ENDPOINT=https://my-company-openai.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-10-01-preview
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT=text-embedding-ada-002

# ===========================================
# Azure AI Search
# ===========================================
AZURE_SEARCH_ENDPOINT=https://my-search-service.search.windows.net
AZURE_SEARCH_API_KEY=A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6
AZURE_SEARCH_INDEX_NAME=production-documents

# ===========================================
# Server Configuration
# ===========================================
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

---

## 🔒 Security Note

✅ Your `.env` file is already in `.gitignore` - it won't be committed
✅ Never share your `.env` file or API keys
✅ Use different keys for development and production
✅ Store production keys in Azure Key Vault

---

## 🚀 Alternative: Your Preferred Location

Based on your setup rules, you prefer `~/secrets/`. Here's how:

```bash
# Create secrets directory for this project
mkdir -p ~/secrets/openai

# Move .env to secrets directory
mv /Users/brandonleskanic/code/openai/server/.env ~/secrets/openai/.env

# Create symlink from project to secrets
cd /Users/brandonleskanic/code/openai/server
ln -sf ~/secrets/openai/.env .env

# Now edit the file in your preferred location
open ~/secrets/openai/.env
```

**Benefits:**
- ✅ All secrets in one centralized location
- ✅ Easier backup and management
- ✅ Clear separation from code

---

## 📚 More Help

- **Detailed Guide:** See [CREDENTIALS.md](CREDENTIALS.md) for comprehensive instructions
- **Quick Start:** See [QUICKSTART.md](QUICKSTART.md) for getting started
- **Full Documentation:** See [README.md](README.md)

---

**Ready to go? Add your credentials to `/server/.env` and start building! 🚀**

