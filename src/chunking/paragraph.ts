/**
 * Paragraph-aware chunking strategy
 * Splits text at paragraph boundaries (double newlines)
 */

import { ChunkingStrategy, ChunkingOptions, DocumentChunk } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class ParagraphChunking implements ChunkingStrategy {
  chunk(text: string, options: ChunkingOptions): DocumentChunk[] {
    logger.debug(`Chunking text with paragraph-aware strategy (size: ${options.chunkSize}, overlap: ${options.chunkOverlap})`);
    
    // Split by paragraph (double newlines or more)
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const chunks: DocumentChunk[] = [];
    let currentChunk = '';
    let currentStart = 0;
    let chunkIndex = 0;
    let charPosition = 0;

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      const potentialChunk = currentChunk + (currentChunk ? '\n\n' : '') + trimmedParagraph;

      if (potentialChunk.length >= options.chunkSize && currentChunk.length > 0) {
        // Create a chunk
        const endChar = currentStart + currentChunk.length;
        chunks.push(this.createChunk(currentChunk, chunkIndex, currentStart, endChar));
        
        // Calculate overlap for next chunk
        const overlapText = this.getOverlapText(currentChunk, options.chunkOverlap);
        currentChunk = overlapText + (overlapText ? '\n\n' : '') + trimmedParagraph;
        currentStart = endChar - overlapText.length;
        chunkIndex++;
      } else {
        if (!currentChunk) {
          currentStart = charPosition;
        }
        currentChunk = potentialChunk;
      }

      charPosition += paragraph.length + 2; // +2 for the double newline
    }

    // Add the last chunk if there's remaining text
    if (currentChunk.trim().length > 0) {
      const endChar = currentStart + currentChunk.length;
      chunks.push(this.createChunk(currentChunk, chunkIndex, currentStart, endChar));
    }

    logger.info(`Created ${chunks.length} chunks using paragraph-aware strategy`);
    return chunks;
  }

  private createChunk(content: string, index: number, startChar: number, endChar: number): DocumentChunk {
    return {
      id: '',
      documentId: '',
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

    // Try to overlap at paragraph boundaries
    const paragraphs = text.split(/\n\s*\n/);
    let overlap = '';
    
    for (let i = paragraphs.length - 1; i >= 0; i--) {
      const potentialOverlap = paragraphs.slice(i).join('\n\n');
      if (potentialOverlap.length <= overlapSize) {
        overlap = potentialOverlap;
        break;
      }
    }

    return overlap || text.slice(-overlapSize);
  }
}

