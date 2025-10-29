# 🚀 Quick Start Guide

Get up and running with the Azure AI Search + OpenAI Chat Application in 5 minutes!

## Prerequisites Checklist

Before starting, make sure you have:

- [ ] **Node.js 18+** installed ([Download](https://nodejs.org/))
- [ ] **API Keys** - Choose one or both:
  - **Option A:** Standard OpenAI API Key ([Get one here](https://platform.openai.com/account/api-keys))
  - **Option B:** Azure OpenAI Service ([Azure Portal](https://portal.azure.com/))
- [ ] **Azure AI Search Service** (Optional, for RAG/Vector Search)
  - [ ] Search service endpoint (e.g., `https://your-service.search.windows.net`)
  - [ ] Admin API key
  - [ ] Index name (can be any name, will be created automatically)

## 🏃‍♂️ Quick Setup (2 minutes)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd azure-openai-chat-frontend
npm run setup
```

### 2. Configure Environment

Edit `server/.env` with your credentials:

**For Standard OpenAI:**

```env
USE_AZURE_OPENAI=false
OPENAI_API_KEY=sk-your-openai-key-here
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_SEARCH_API_KEY=your-azure-admin-key
AZURE_SEARCH_INDEX_NAME=my-chat-index
```

**For Azure OpenAI:**

```env
USE_AZURE_OPENAI=true
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT=text-embedding-ada-002
```

📖 **See [CREDENTIALS.md](CREDENTIALS.md) for detailed setup instructions**

### 3. Start the Application

```bash
npm run dev
```

🎉 **That's it!** Open <http://localhost:3000> and start chatting!

## 📚 First Steps

### Upload Your First Document

1. Click **Documents** in the sidebar
2. Drag & drop a PDF or TXT file
3. Wait for processing to complete (usually 10-30 seconds)

### Start Chatting

1. Click **Chat** in the sidebar
2. Ask something like: "What does this document talk about?"
3. Get AI-powered answers with source citations!

## 🔧 Troubleshooting

### "Missing environment variables"

- Make sure you copied the values correctly to `server/.env`
- Restart the server after changing environment variables

### "OpenAI API Error"

- Check your API key is valid and has credits
- Verify the key starts with `sk-`

### "Azure connection failed"

- Verify your endpoint URL is correct
- Make sure you're using the **admin** API key, not query key
- Check your Azure Search service is running

### Files won't upload

- Only PDF and TXT files under 10MB are supported
- Check browser console for detailed error messages

## 🎯 What's Next?

- **Explore Search Settings**: Try different search modes in the header
- **Multiple Documents**: Upload more documents to build your knowledge base
- **Chat Sessions**: Create multiple chat sessions for different topics
- **API Integration**: Use the REST API endpoints for custom integrations

## 💡 Pro Tips

1. **Better Results**: Upload documents with clear, well-structured text
2. **Chunking**: Large documents are automatically split into searchable chunks
3. **Categories**: Documents are auto-categorized for better organization
4. **Hybrid Search**: Enable for better keyword + semantic search results

## 🆘 Need Help?

- 📖 **Full Documentation**: See [README.md](README.md)
- 🐛 **Issues**: Check the troubleshooting section
- 💬 **API Docs**: All endpoints documented in README
- 🔍 **Azure Setup**: Refer to the original OpenAI Cookbook

---

**Happy document chatting! 🚀📄💬**
