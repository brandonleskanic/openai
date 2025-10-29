import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import { OpenAIService } from './openai';
import { DocumentChunk } from './azure';

interface ProcessResult {
  chunks: DocumentChunk[];
  category: string;
  totalTokens: number;
}

export class DocumentProcessor {
  private openaiService: OpenAIService;
  private categories = [
    'authentication',
    'models',
    'techniques',
    'tools',
    'setup',
    'billing_limits',
    'other'
  ];

  constructor() {
    this.openaiService = new OpenAIService();
  }

  async processDocument(filePath: string, metadata: {
    filename: string;
    fileId: string;
  }): Promise<ProcessResult> {
    try {
      // Extract text from file
      const text = await this.extractText(filePath);

      if (!text || text.trim().length === 0) {
        throw new Error('No text content found in document');
      }

      // Categorize the document
      const category = await this.categorizeText(text);

      // Chunk the text
      const textChunks = await this.chunkText(text);

      // Generate embeddings for chunks
      const chunks: DocumentChunk[] = [];
      let totalTokens = 0;

      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i];

        // Generate embeddings for title and content
        const titleEmbedding = await this.openaiService.generateEmbedding(metadata.filename);
        const contentEmbedding = await this.openaiService.generateEmbedding(chunk);

        totalTokens += titleEmbedding.tokens + contentEmbedding.tokens;

        chunks.push({
          id: `${metadata.fileId}_${i}`,
          vector_id: `${metadata.fileId}_${i}`,
          title: metadata.filename,
          text: chunk,
          title_vector: titleEmbedding.embedding,
          content_vector: contentEmbedding.embedding,
          category,
        });
      }

      return {
        chunks,
        category,
        totalTokens,
      };

    } catch (error) {
      console.error('Document processing error:', error);
      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractText(filePath: string): Promise<string> {
    const fileExtension = path.extname(filePath).toLowerCase();

    switch (fileExtension) {
      case '.pdf':
        return await this.extractFromPDF(filePath);
      case '.txt':
        return await this.extractFromText(filePath);
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  }

  private async extractFromPDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractFromText(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error('Text file reading error:', error);
      throw new Error(`Failed to read text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async categorizeText(text: string): Promise<string> {
    try {
      const response = await this.openaiService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: `You are an expert in LLMs and AI documentation. Categorize the following document into one of these categories: ${this.categories.join(', ')}. Only respond with the category name and nothing else.`
          },
          {
            role: 'user',
            content: text.length > 4000 ? text.substring(0, 4000) + '...' : text
          }
        ]
      });

      const category = response.message.trim().toLowerCase();

      // Validate the category
      if (this.categories.includes(category)) {
        return category;
      } else {
        console.warn(`Unknown category returned: ${category}, defaulting to 'other'`);
        return 'other';
      }

    } catch (error) {
      console.error('Text categorization error:', error);
      return 'other'; // Default category
    }
  }

  private async chunkText(text: string, maxChunkSize: number = 1000): Promise<string[]> {
    // Simple chunking strategy - can be improved with more sophisticated methods
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();

      if (!trimmedSentence) continue;

      // Check if adding this sentence would exceed the chunk size
      if (currentChunk.length + trimmedSentence.length + 1 > maxChunkSize) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = trimmedSentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
      }
    }

    // Add the last chunk if it has content
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // If no chunks were created (very short text), create a single chunk
    if (chunks.length === 0 && text.trim()) {
      chunks.push(text.trim());
    }

    return chunks;
  }

  // Advanced chunking with overlap (optional enhancement)
  private async chunkTextWithOverlap(
    text: string,
    maxChunkSize: number = 1000,
    overlapSize: number = 100
  ): Promise<string[]> {
    const chunks: string[] = [];
    const words = text.split(/\s+/);

    let startIndex = 0;

    while (startIndex < words.length) {
      let endIndex = Math.min(startIndex + maxChunkSize, words.length);

      // Try to end at a sentence boundary
      if (endIndex < words.length) {
        for (let i = endIndex; i > startIndex + maxChunkSize - 100; i--) {
          if (words[i].match(/[.!?]$/)) {
            endIndex = i + 1;
            break;
          }
        }
      }

      const chunk = words.slice(startIndex, endIndex).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }

      // Move start index with overlap
      startIndex = Math.max(startIndex + maxChunkSize - overlapSize, endIndex);

      if (startIndex >= words.length) break;
    }

    return chunks;
  }

  // Utility method to estimate token count for chunking
  private async estimateTokens(text: string): Promise<number> {
    try {
      return await this.openaiService.countTokens(text);
    } catch (error) {
      // Fallback: rough estimate (1 token ≈ 4 characters)
      return Math.ceil(text.length / 4);
    }
  }

  // Smart chunking based on token count
  async chunkByTokens(text: string, maxTokens: number = 1500): Promise<string[]> {
    const totalTokens = await this.estimateTokens(text);

    if (totalTokens <= maxTokens) {
      return [text];
    }

    // Split by paragraphs first
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      const paragraphTokens = await this.estimateTokens(paragraph);
      const currentTokens = await this.estimateTokens(currentChunk);

      if (currentTokens + paragraphTokens > maxTokens && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // If any chunk is still too large, split it further
    const finalChunks: string[] = [];
    for (const chunk of chunks) {
      const chunkTokens = await this.estimateTokens(chunk);
      if (chunkTokens > maxTokens) {
        const subChunks = await this.chunkText(chunk, Math.floor(maxTokens * 4)); // Rough character estimate
        finalChunks.push(...subChunks);
      } else {
        finalChunks.push(chunk);
      }
    }

    return finalChunks;
  }
}
