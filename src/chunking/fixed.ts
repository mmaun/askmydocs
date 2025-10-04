/**
 * Fixed-size chunking strategy
 * Splits text into fixed-size chunks with specified overlap
 */

import { ChunkingStrategy, ChunkingOptions, DocumentChunk } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class FixedChunking implements ChunkingStrategy {
  chunk(text: string, options: ChunkingOptions): DocumentChunk[] {
    logger.debug(`Chunking text with fixed-size strategy (size: ${options.chunkSize}, overlap: ${options.chunkOverlap})`);
    
    const chunks: DocumentChunk[] = [];
    const textLength = text.length;
    let chunkIndex = 0;
    let position = 0;

    while (position < textLength) {
      const endPosition = Math.min(position + options.chunkSize, textLength);
      const chunkText = text.slice(position, endPosition);

      if (chunkText.trim().length > 0) {
        chunks.push({
          id: '',
          documentId: '',
          content: chunkText.trim(),
          index: chunkIndex,
          metadata: {
            startChar: position,
            endChar: endPosition,
          },
        });
        chunkIndex++;
      }

      // Move position forward by (chunkSize - overlap)
      position += options.chunkSize - options.chunkOverlap;

      // Prevent infinite loop if overlap is too large
      if (position <= 0) {
        position = options.chunkSize;
      }
    }

    logger.info(`Created ${chunks.length} chunks using fixed-size strategy`);
    return chunks;
  }
}

