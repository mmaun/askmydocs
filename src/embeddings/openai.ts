/**
 * OpenAI embeddings provider
 */

import { EmbeddingProvider } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class OpenAIEmbedding implements EmbeddingProvider {
  private apiKey: string;
  private model: string;
  private dimensions: number;
  private apiUrl = 'https://api.openai.com/v1/embeddings';

  constructor(apiKey: string, model: string = 'text-embedding-3-small') {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    this.apiKey = apiKey;
    this.model = model;
    
    // Set dimensions based on model
    if (model === 'text-embedding-3-small') {
      this.dimensions = 1536;
    } else if (model === 'text-embedding-3-large') {
      this.dimensions = 3072;
    } else if (model === 'text-embedding-ada-002') {
      this.dimensions = 1536;
    } else {
      this.dimensions = 1536; // Default
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: text,
          model: this.model,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data: any = await response.json();
      
      if (!data.data || !data.data[0] || !data.data[0].embedding) {
        throw new Error('Invalid response from OpenAI API');
      }

      logger.debug(`Generated OpenAI embedding of dimension ${data.data[0].embedding.length}`);
      return data.data[0].embedding;
    } catch (error: any) {
      logger.error(`Failed to generate OpenAI embedding: ${error.message}`);
      throw new Error(`OpenAI embedding generation failed: ${error.message}`);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      logger.info(`Generating OpenAI embeddings for ${texts.length} texts`);
      
      // OpenAI supports batch requests
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: texts,
          model: this.model,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data: any = await response.json();
      
      if (!data.data) {
        throw new Error('Invalid response from OpenAI API');
      }

      const embeddings = data.data.map((item: any) => item.embedding);
      logger.info(`Successfully generated ${embeddings.length} OpenAI embeddings`);
      
      return embeddings;
    } catch (error: any) {
      logger.error(`Failed to generate OpenAI batch embeddings: ${error.message}`);
      throw new Error(`OpenAI batch embedding generation failed: ${error.message}`);
    }
  }

  getDimensions(): number {
    return this.dimensions;
  }
}

