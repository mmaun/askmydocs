/**
 * Cohere embeddings provider
 */

import { EmbeddingProvider } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class CohereEmbedding implements EmbeddingProvider {
  private apiKey: string;
  private model: string;
  private dimensions: number;
  private apiUrl = 'https://api.cohere.ai/v1/embed';

  constructor(apiKey: string, model: string = 'embed-english-v3.0') {
    if (!apiKey) {
      throw new Error('Cohere API key is required');
    }
    
    this.apiKey = apiKey;
    this.model = model;
    
    // Set dimensions based on model
    if (model.includes('v3.0')) {
      this.dimensions = 1024;
    } else if (model.includes('v2.0')) {
      this.dimensions = 4096;
    } else {
      this.dimensions = 1024; // Default
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      logger.info(`Generating Cohere embeddings for ${texts.length} texts`);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          texts: texts,
          model: this.model,
          input_type: 'search_document',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Cohere API error: ${response.status} - ${error}`);
      }

      const data: any = await response.json();
      
      if (!data.embeddings) {
        throw new Error('Invalid response from Cohere API');
      }

      logger.info(`Successfully generated ${data.embeddings.length} Cohere embeddings`);
      return data.embeddings;
    } catch (error: any) {
      logger.error(`Failed to generate Cohere embeddings: ${error.message}`);
      throw new Error(`Cohere embedding generation failed: ${error.message}`);
    }
  }

  getDimensions(): number {
    return this.dimensions;
  }
}

