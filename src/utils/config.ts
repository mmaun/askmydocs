/**
 * Configuration loader for the MCP server
 * Reads from environment variables with sensible defaults
 */

import { ServerConfig, EmbeddingConfig, ChunkingOptions } from '../types/index.js';
import * as path from 'path';
import * as os from 'os';

export function loadConfig(): ServerConfig {
  const storageDir = process.env.STORAGE_DIR || path.join(os.homedir(), '.knowledge-mgmt-mcp', 'storage');
  const chromaDbDir = process.env.CHROMA_DB_DIR || path.join(os.homedir(), '.knowledge-mgmt-mcp', 'chroma_db');

  const embeddingConfig: EmbeddingConfig = {
    provider: (process.env.EMBEDDING_PROVIDER as any) || 'transformers',
    model: process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2',
    apiKey: process.env.OPENAI_API_KEY || process.env.COHERE_API_KEY,
  };

  const chunkingOptions: ChunkingOptions = {
    chunkSize: parseInt(process.env.CHUNK_SIZE || '1000', 10),
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '200', 10),
    strategy: (process.env.CHUNKING_STRATEGY as any) || 'sentence',
  };

  const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '104857600', 10); // 100MB default
  const allowedFileTypes = process.env.ALLOWED_FILE_TYPES
    ? process.env.ALLOWED_FILE_TYPES.split(',')
    : ['.pdf', '.PDF', '.docx', '.DOCX', '.txt', '.TXT', '.md', '.MD', '.csv', '.CSV', '.json', '.JSON', '.html', '.HTML'];

  return {
    storageDir,
    chromaDbDir,
    embeddingConfig,
    chunkingOptions,
    maxFileSize,
    allowedFileTypes,
  };
}

export function validateConfig(config: ServerConfig): void {
  if (!config.storageDir) {
    throw new Error('STORAGE_DIR is required');
  }

  if (!config.chromaDbDir) {
    throw new Error('CHROMA_DB_DIR is required');
  }

  if (!['transformers', 'openai', 'cohere'].includes(config.embeddingConfig.provider)) {
    throw new Error(`Invalid embedding provider: ${config.embeddingConfig.provider}`);
  }

  if (config.embeddingConfig.provider !== 'transformers' && !config.embeddingConfig.apiKey) {
    throw new Error(`API key required for ${config.embeddingConfig.provider} provider`);
  }

  if (!['sentence', 'paragraph', 'fixed'].includes(config.chunkingOptions.strategy)) {
    throw new Error(`Invalid chunking strategy: ${config.chunkingOptions.strategy}`);
  }

  if (config.chunkingOptions.chunkSize < 100) {
    throw new Error('Chunk size must be at least 100 characters');
  }

  if (config.chunkingOptions.chunkOverlap >= config.chunkingOptions.chunkSize) {
    throw new Error('Chunk overlap must be less than chunk size');
  }
}

