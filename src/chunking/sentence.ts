/**
 * Sentence-aware chunking strategy
 * Uses natural language processing to split text at sentence boundaries
 */

import { WordTokenizer, SentenceTokenizer } from 'natural';
import { ChunkingStrategy, ChunkingOptions, DocumentChunk } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class SentenceChunking implements ChunkingStrategy {
  private sentenceTokenizer: SentenceTokenizer;

  constructor() {
    this.sentenceTokenizer = new SentenceTokenizer();
  }

  chunk(text: string, options: ChunkingOptions): DocumentChunk[] {
    logger.debug(`Chunking text with sentence-aware strategy (size: ${options.chunkSize}, overlap: ${options.chunkOverlap})`);
    
    const sentences = this.sentenceTokenizer.tokenize(text);
    const chunks: DocumentChunk[] = [];
    let currentChunk = '';
    let currentStart = 0;
    let chunkIndex = 0;

    for (const sentence of sentences) {
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;

      if (potentialChunk.length >= options.chunkSize && currentChunk.length > 0) {
        // Create a chunk
        const endChar = currentStart + currentChunk.length;
        chunks.push(this.createChunk(currentChunk, chunkIndex, currentStart, endChar));
        
        // Calculate overlap for next chunk
        const overlapText = this.getOverlapText(currentChunk, options.chunkOverlap);
        currentChunk = overlapText + (overlapText ? ' ' : '') + sentence;
        currentStart = endChar - overlapText.length;
        chunkIndex++;
      } else {
        currentChunk = potentialChunk;
      }
    }

    // Add the last chunk if there's remaining text
    if (currentChunk.trim().length > 0) {
      const endChar = currentStart + currentChunk.length;
      chunks.push(this.createChunk(currentChunk, chunkIndex, currentStart, endChar));
    }

    logger.info(`Created ${chunks.length} chunks using sentence-aware strategy`);
    return chunks;
  }

  private createChunk(content: string, index: number, startChar: number, endChar: number): DocumentChunk {
    return {
      id: '',  // Will be set by the caller
      documentId: '',  // Will be set by the caller
      content: content.trim(),
      index,
      metadata: {
        startChar,
        endChar,
      },
    };
  }

  private getOverlapText(text: string, overlapSize: number): string {
    if (overlapSize === 0 || text.length <= overlapSize) {
      return text;
    }

    // Try to overlap at sentence boundaries
    const sentences = this.sentenceTokenizer.tokenize(text);
    let overlap = '';
    
    for (let i = sentences.length - 1; i >= 0; i--) {
      const potentialOverlap = sentences.slice(i).join(' ');
      if (potentialOverlap.length <= overlapSize) {
        overlap = potentialOverlap;
        break;
      }
    }

    return overlap || text.slice(-overlapSize);
  }
}

