/**
 * Local embeddings using Transformers.js
 */

import { pipeline } from '@xenova/transformers';
import { EmbeddingProvider } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class TransformersEmbedding implements EmbeddingProvider {
  private model: string;
  private pipeline: any = null;
  private dimensions: number = 384; // Default for all-MiniLM-L6-v2

  constructor(model: string = 'Xenova/all-MiniLM-L6-v2') {
    this.model = model;
    
    // Set dimensions based on known models
    if (model.includes('all-MiniLM-L6-v2')) {
      this.dimensions = 384;
    } else if (model.includes('all-mpnet-base-v2')) {
      this.dimensions = 768;
    }
  }

  private async ensurePipeline(): Promise<any> {
    if (!this.pipeline) {
      logger.info(`Loading Transformers.js model: ${this.model}`);
      this.pipeline = await pipeline('feature-extraction', this.model);
      logger.info('Transformers.js model loaded successfully');
    }
    return this.pipeline;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const pipe = await this.ensurePipeline();
      const output = await pipe(text, { pooling: 'mean', normalize: true });
      
      // Convert to regular array
      const embedding = Array.from(output.data as Float32Array);
      
      logger.debug(`Generated embedding of dimension ${embedding.length}`);
      return embedding;
    } catch (error: any) {
      logger.error(`Failed to generate embedding: ${error.message}`);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      logger.info(`Generating embeddings for ${texts.length} texts`);
      const embeddings: number[][] = [];
      
      // Process in batches to avoid memory issues
      const batchSize = 32;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchEmbeddings = await Promise.all(
          batch.map(text => this.generateEmbedding(text))
        );
        embeddings.push(...batchEmbeddings);
        
        logger.debug(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);
      }
      
      logger.info(`Successfully generated ${embeddings.length} embeddings`);
      return embeddings;
    } catch (error: any) {
      logger.error(`Failed to generate batch embeddings: ${error.message}`);
      throw new Error(`Batch embedding generation failed: ${error.message}`);
    }
  }

  getDimensions(): number {
    return this.dimensions;
  }
}

