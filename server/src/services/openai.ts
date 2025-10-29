import OpenAI from 'openai';
import { encoding_for_model, get_encoding } from 'tiktoken';

export class OpenAIService {
  private client: OpenAI;
  private embeddingsModel: string;
  private chatModel: string;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.embeddingsModel = process.env.EMBEDDINGS_MODEL || 'text-embedding-3-small';
    this.chatModel = process.env.CHAT_MODEL || 'gpt-4';
  }

  async generateEmbedding(text: string): Promise<{
    embedding: number[];
    tokens: number;
  }> {
    try {
      const response = await this.client.embeddings.create({
        model: this.embeddingsModel,
        input: text,
      });

      return {
        embedding: response.data[0].embedding,
        tokens: response.usage.total_tokens,
      };
    } catch (error) {
      console.error('OpenAI embedding error:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async chatCompletion(data: {
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
    context?: string;
  }): Promise<{
    message: string;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
  }> {
    try {
      let messages = [...data.messages];

      // If context is provided, add it to the system message
      if (data.context) {
        const systemMessage = messages.find(m => m.role === 'system');
        if (systemMessage) {
          systemMessage.content += `\n\nContext:\n${data.context}`;
        } else {
          messages.unshift({
            role: 'system',
            content: `Use the following context to answer the user's question:\n\n${data.context}`,
          });
        }
      }

      const response = await this.client.chat.completions.create({
        model: this.chatModel,
        messages,
        temperature: 0.7,
        max_tokens: 1500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      const choice = response.choices[0];
      if (!choice || !choice.message) {
        throw new Error('No response received from OpenAI');
      }

      return {
        message: choice.message.content || '',
        tokens: {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('OpenAI chat completion error:', error);
      throw new Error(`Failed to generate chat completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAvailableModels(): Promise<{
    embeddings: string[];
    chat: string[];
  }> {
    try {
      const response = await this.client.models.list();
      const models = response.data.map(model => model.id);

      return {
        embeddings: models.filter(model => model.includes('embedding')),
        chat: models.filter(model => model.includes('gpt')),
      };
    } catch (error) {
      console.error('OpenAI models error:', error);
      throw new Error(`Failed to get available models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async countTokens(text: string, model?: string): Promise<number> {
    try {
      const modelToUse = model || this.chatModel;

      // Try to get encoding for the specific model
      let encoding;
      try {
        encoding = encoding_for_model(modelToUse as any);
      } catch {
        // Fallback to cl100k_base encoding (used by GPT-4 and newer models)
        encoding = get_encoding('cl100k_base');
      }

      const tokens = encoding.encode(text);
      encoding.free(); // Free the encoding to avoid memory leaks

      return tokens.length;
    } catch (error) {
      console.error('Token counting error:', error);
      // Fallback: rough estimate (1 token ≈ 4 characters)
      return Math.ceil(text.length / 4);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple embedding request
      await this.client.embeddings.create({
        model: this.embeddingsModel,
        input: 'test',
      });
      return true;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  // Utility method for safe embedding generation with chunking
  async generateEmbeddingsSafe(
    text: string,
    maxTokens: number = 8191
  ): Promise<{
    embeddings: number[][];
    chunks: string[];
    totalTokens: number;
  }> {
    const chunks = await this.chunkText(text, maxTokens);
    const results = await Promise.all(
      chunks.map(chunk => this.generateEmbedding(chunk))
    );

    return {
      embeddings: results.map(r => r.embedding),
      chunks,
      totalTokens: results.reduce((sum, r) => sum + r.tokens, 0),
    };
  }

  private async chunkText(text: string, maxTokens: number): Promise<string[]> {
    const tokens = await this.countTokens(text);

    if (tokens <= maxTokens) {
      return [text];
    }

    // Simple chunking by character count (rough approximation)
    const maxChars = maxTokens * 4; // Rough estimate: 1 token ≈ 4 characters
    const chunks: string[] = [];

    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + maxChars, text.length);

      // Try to break at word boundaries
      if (end < text.length) {
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start) {
          end = lastSpace;
        }
      }

      chunks.push(text.slice(start, end).trim());
      start = end;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }
}
