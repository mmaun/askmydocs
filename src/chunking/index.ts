/**
 * Chunking strategy factory
 */

import { ChunkingStrategy, ChunkingOptions } from '../types/index.js';
import { SentenceChunking } from './sentence.js';
import { ParagraphChunking } from './paragraph.js';
import { FixedChunking } from './fixed.js';

export function getChunkingStrategy(strategy: string): ChunkingStrategy {
  switch (strategy.toLowerCase()) {
    case 'sentence':
      return new SentenceChunking();
    case 'paragraph':
      return new ParagraphChunking();
    case 'fixed':
      return new FixedChunking();
    default:
      throw new Error(`Unknown chunking strategy: ${strategy}`);
  }
}

export { SentenceChunking, ParagraphChunking, FixedChunking };

