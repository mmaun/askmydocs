/**
 * Embedding provider factory
 */

import { EmbeddingProvider, EmbeddingConfig } from '../types/index.js';
import { TransformersEmbedding } from './transformers.js';
import { OpenAIEmbedding } from './openai.js';
import { CohereEmbedding } from './cohere.js';

export function createEmbeddingProvider(config: EmbeddingConfig): EmbeddingProvider {
  switch (config.provider) {
    case 'transformers':
      return new TransformersEmbedding(config.model);
    
    case 'openai':
      if (!config.apiKey) {
        throw new Error('OpenAI API key is required');
      }
      return new OpenAIEmbedding(config.apiKey, config.model);
    
    case 'cohere':
      if (!config.apiKey) {
        throw new Error('Cohere API key is required');
      }
      return new CohereEmbedding(config.apiKey, config.model);
    
    default:
      throw new Error(`Unknown embedding provider: ${config.provider}`);
  }
}

export { TransformersEmbedding, OpenAIEmbedding, CohereEmbedding };

