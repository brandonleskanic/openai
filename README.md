# Azure AI Search + OpenAI Chat Application

A comprehensive full-stack application that combines Azure AI Search with OpenAI's GPT models to create an intelligent document search and chat system. Upload documents, automatically process and index them, then chat with an AI assistant that can search through your knowledge base to provide contextual answers.

## 🚀 Features

### Frontend (React + TypeScript)

- **Modern Chat Interface**: Real-time messaging with typing indicators and message history
- **Document Management**: Drag-and-drop file upload with progress tracking
- **Search Configuration**: Configurable hybrid search, vector search, and result filtering
- **Session Management**: Multiple chat sessions with persistent history
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### Backend (Node.js + Express + TypeScript)

- **OpenAI Integration**: GPT-4 chat completions and text embeddings
- **Azure AI Search**: Vector similarity search with hybrid capabilities
- **Document Processing**: Automatic PDF/TXT parsing, chunking, and categorization
- **RESTful API**: Comprehensive API endpoints for all functionality
- **Error Handling**: Robust error handling and logging

### Key Integrations

- **OpenAI API**: Text embeddings (text-embedding-3-small) and chat completions (GPT-4)
- **Azure AI Search**: Vector database with HNSW algorithm for similarity search
- **Document Processing**: PDF parsing, text chunking, and automatic categorization
- **File Upload**: Secure file handling with validation and progress tracking

## 📋 Prerequisites

Before running this application, ensure you have:

1. **Node.js** (v18 or higher)
2. **npm** or **yarn** package manager
3. **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/account/api-keys)
4. **Azure AI Search Service** with:
   - Search service endpoint
   - Admin API key
   - Index name (will be created if doesn't exist)

### Azure Setup

You'll need to set up Azure AI Search either through:

1. **Azure Portal**: Create a search service manually
2. **Programmatic Setup**: Use the provided Python scripts (from the original cookbook)

## 🛠 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd azure-openai-chat-frontend
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all project dependencies (client + server)
npm run install-all
```

### 3. Environment Configuration

#### Server Configuration

1. Copy the example environment file:

```bash
cp server/env.example server/.env
```

2. Edit `server/.env` with your actual values:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key
EMBEDDINGS_MODEL=text-embedding-3-small
CHAT_MODEL=gpt-4

# Azure AI Search Configuration
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_SEARCH_API_KEY=your-azure-search-admin-key
AZURE_SEARCH_INDEX_NAME=your-index-name

# Optional: Azure subscription details for programmatic setup
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_RESOURCE_GROUP=your-resource-group

# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

#### Client Configuration (Optional)

Create `client/.env` if you need to customize the API URL:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Azure Index Setup

The application will attempt to create the Azure Search index automatically on first run. If you prefer to set it up manually, use the index configuration from the server code or run the Python setup scripts from the original cookbook.

## 🚀 Running the Application

### Development Mode

Start both client and server in development mode:

```bash
npm run dev
```

This will start:

- **React client** at `http://localhost:3000`
- **Express server** at `http://localhost:5000`

### Individual Services

```bash
# Start only the server
npm run server

# Start only the client
npm run client
```

### Production Build

```bash
# Build the client
npm run build

# Start in production mode
cd server && npm start
```

## 📖 Usage Guide

### 1. Upload Documents

1. Navigate to the **Documents** tab
2. Drag and drop PDF or TXT files (max 10MB each)
3. Wait for processing to complete (files are automatically chunked and indexed)

### 2. Chat with Your Documents

1. Go to the **Chat** tab
2. Start a new conversation
3. Ask questions about your uploaded documents
4. The AI will search your knowledge base and provide contextual answers with source citations

### 3. Configure Search Settings

Use the header controls to adjust:

- **Search Type**: Content vs. Title search
- **Hybrid Search**: Enable/disable keyword + vector search
- **Result Count**: Number of relevant documents to retrieve

## 🔧 API Endpoints

### Chat Endpoints

- `POST /api/chat/message` - Send message and get AI response with context
- `POST /api/chat/search` - Search documents without AI response

### Document Management

- `POST /api/documents/upload` - Upload document files
- `POST /api/documents/process/:fileId` - Process uploaded document
- `GET /api/documents` - Get all documents
- `DELETE /api/documents/:documentId` - Delete document

### Azure AI Search

- `POST /api/azure/search` - Direct Azure search endpoint
- `GET /api/azure/index-info` - Get index information
- `GET /api/azure/test-connection` - Test Azure connection

### OpenAI

- `POST /api/openai/embedding` - Generate text embedding
- `POST /api/openai/chat` - Direct chat completion
- `GET /api/openai/test-connection` - Test OpenAI connection

### Health & Monitoring

- `GET /api/health` - Application health check
- `GET /api/health/detailed` - Detailed service status

## 🏗 Architecture

### Frontend Architecture

```
client/
├── src/
│   ├── components/          # React components
│   │   ├── ChatInterface.tsx
│   │   ├── DocumentUpload.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ...
│   ├── store/              # Zustand state management
│   │   ├── chatStore.ts
│   │   └── documentStore.ts
│   ├── services/           # API service layer
│   │   └── api.ts
│   └── App.tsx
```

### Backend Architecture

```
server/
├── src/
│   ├── routes/             # Express route handlers
│   │   ├── chat.ts
│   │   ├── documents.ts
│   │   ├── azure.ts
│   │   └── openai.ts
│   ├── services/           # Business logic services
│   │   ├── openai.ts
│   │   ├── azure.ts
│   │   └── documentProcessor.ts
│   ├── middleware/         # Express middleware
│   └── server.ts
```

### Data Flow

1. **Document Upload**: File → Processing → Chunking → Embedding → Azure Index
2. **Chat Query**: User Message → Embedding → Vector Search → Context → GPT Response
3. **Search**: Query → Embedding → Azure Search → Ranked Results

## 🔒 Security Features

- **Rate Limiting**: API rate limiting to prevent abuse
- **File Validation**: File type and size validation
- **CORS Protection**: Configured CORS policies
- **Helmet Security**: Security headers via Helmet.js
- **Environment Variables**: Sensitive data in environment variables
- **Input Validation**: Request validation and sanitization

## 🐛 Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure all required environment variables are set in `server/.env`
   - Check that the file is named `.env` not `env.example`

2. **Azure connection errors**
   - Verify your Azure Search endpoint and API key
   - Ensure the search service is running and accessible
   - Check that your Azure subscription has sufficient quota

3. **OpenAI API errors**
   - Verify your OpenAI API key is valid and has sufficient credits
   - Check rate limits if you're getting 429 errors

4. **File upload failures**
   - Ensure files are under 10MB
   - Only PDF and TXT files are supported
   - Check server logs for detailed error messages

### Debug Mode

Set `NODE_ENV=development` in your server environment to enable:

- Detailed error messages
- Request/response logging
- Stack traces in API responses

## 📊 Monitoring & Logging

### Health Checks

- `/api/health` - Basic health status
- `/api/health/detailed` - Comprehensive service status
- `/api/health/ready` - Kubernetes readiness probe
- `/api/health/live` - Kubernetes liveness probe

### Logging

The application uses structured logging with different levels:

- **Error**: System errors and exceptions
- **Warn**: Non-critical issues
- **Info**: General application flow
- **Debug**: Detailed debugging information (development only)

## 🚀 Deployment

### Docker Deployment (Recommended)

```dockerfile
# Example Dockerfile structure
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com
# ... other production values
```

### Azure Container Apps / App Service

The application is ready for deployment on:

- Azure Container Apps
- Azure App Service
- Docker containers
- Kubernetes clusters

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI Cookbook**: Based on the Azure AI Search integration examples
- **OpenAI**: For GPT-4 and embedding models
- **Microsoft Azure**: For Azure AI Search services
- **React Community**: For the excellent ecosystem of tools and libraries

## 📞 Support

For issues and questions:

1. Check the [troubleshooting section](#troubleshooting)
2. Review the [API documentation](#api-endpoints)
3. Open an issue on GitHub
4. Check the original [OpenAI Cookbook](https://cookbook.openai.com/) for additional examples

---

**Happy chatting with your documents! 🚀📚**
