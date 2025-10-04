/**
 * Search tool
 */

import { SearchResult, SearchOptions } from '../types/index.js';
import { EmbeddingProvider } from '../types/index.js';
import { StorageBackend } from '../types/index.js';
import { validateSearchQuery, validateMetadata } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

export class SearchTool {
  constructor(
    private embeddingProvider: EmbeddingProvider,
    private storage: StorageBackend
  ) {}

  async searchKnowledge(args: {
    query: string;
    max_results?: number;
    similarity_threshold?: number;
    filter_metadata?: Record<string, any>;
    filter_tags?: string[];
  }): Promise<{
    results: Array<{
      content: string;
      source: string;
      score: number;
      metadata: any;
      chunk_index: number;
    }>;
    total_results: number;
  }> {
    try {
      // Validate query
      validateSearchQuery(args.query);

      // Validate metadata filter if provided
      if (args.filter_metadata) {
        validateMetadata(args.filter_metadata);
      }

      logger.info(`Searching for: "${args.query}"`);

      // Generate query embedding
      const queryEmbedding = await this.embeddingProvider.generateEmbedding(args.query);

      // Search
      const searchOptions: SearchOptions = {
        query: args.query,
        maxResults: args.max_results || 10,
        similarityThreshold: args.similarity_threshold || 0.0,
        filterMetadata: args.filter_metadata,
        filterTags: args.filter_tags,
      };

      const results = await this.storage.searchSimilar(queryEmbedding, searchOptions);

      // Format results
      const formattedResults = results.map(result => ({
        content: result.chunk.content,
        source: result.document.metadata.filename || result.document.id,
        score: result.score,
        metadata: {
          document_id: result.document.id,
          file_type: result.document.metadata.fileType,
          tags: result.document.metadata.tags,
          ...result.document.metadata.customMetadata,
        },
        chunk_index: result.chunk.index,
      }));

      logger.info(`Found ${formattedResults.length} results`);

      return {
        results: formattedResults,
        total_results: formattedResults.length,
      };
    } catch (error: any) {
      logger.error(`Search failed: ${error.message}`);
      throw new Error(`Search failed: ${error.message}`);
    }
  }
}

