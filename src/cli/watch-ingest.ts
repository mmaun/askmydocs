#!/usr/bin/env node

/**
 * Directory watcher for automatic document ingestion
 * Monitors a directory and automatically ingests new files
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { loadConfig } from '../utils/config.js';
import { processFile } from '../processors/index.js';
import { getChunkingStrategy } from '../chunking/index.js';
import { createEmbeddingProvider } from '../embeddings/index.js';
import { ChromaStorage } from '../storage/chroma.js';
import { Document, DocumentChunk } from '../types/index.js';
import { logger } from '../utils/logger.js';

class WatchIngest {
  private config: any;
  private storage!: ChromaStorage;
  private embeddingProvider!: any;
  private isProcessing = false;
  private queue: string[] = [];

  constructor() {}

  async initialize(options: {
    chunkSize?: number;
    strategy?: 'sentence' | 'paragraph' | 'fixed';
    provider?: 'transformers' | 'openai' | 'cohere';
    model?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  } = {}) {
    // Load config
    this.config = await loadConfig();
    
    // Override config with options
    if (options.chunkSize) this.config.chunkingOptions.chunkSize = options.chunkSize;
    if (options.strategy) this.config.chunkingOptions.strategy = options.strategy;
    if (options.provider) this.config.embeddingConfig.provider = options.provider;
    if (options.model) this.config.embeddingConfig.model = options.model;

    // Initialize storage and embedding provider
    this.storage = new ChromaStorage(this.config.chromaDbDir, this.config.storageDir);
    await this.storage.initialize();
    
    this.embeddingProvider = createEmbeddingProvider(this.config.embeddingConfig);

    console.log('🔧 Watch ingest initialized');
  }

  async processFile(filePath: string, options: {
    tags?: string[];
    metadata?: Record<string, any>;
  } = {}): Promise<void> {
    try {
      console.log(`📄 Processing: ${path.basename(filePath)}`);

      // Extract text content
      const content = await processFile(filePath);
      const filename = path.basename(filePath);
      const fileType = path.extname(filePath).toLowerCase().slice(1);

      // Chunk the content
      const chunkingStrategy = getChunkingStrategy(this.config.chunkingOptions.strategy);
      const chunks = chunkingStrategy.chunk(content, this.config.chunkingOptions);

      // Generate embeddings in batch
      const chunkTexts = chunks.map(c => c.content);
      const embeddings = await this.embeddingProvider.generateEmbeddings(chunkTexts);

      // Create document chunks with embeddings
      const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index],
      }));

      // Create document
      const document: Document = {
        id: this.generateDocumentId(filename),
        content,
        chunks: documentChunks,
        metadata: {
          filename,
          fileType,
          filePath,
          tags: options.tags || [],
          customMetadata: {
            ingestionDate: new Date().toISOString(),
            ...options.metadata,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store document
      await this.storage.storeDocument(document);
      
      console.log(`✅ Processed: ${filename} (${document.chunks.length} chunks)`);
      
    } catch (error: any) {
      console.error(`❌ Failed to process ${filePath}: ${error.message}`);
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const filePath = this.queue.shift()!;
      await this.processFile(filePath);
    }
    
    this.isProcessing = false;
  }

  async watchDirectory(directory: string, options: {
    recursive?: boolean;
    tags?: string[];
    metadata?: Record<string, any>;
  } = {}): Promise<void> {
    const chokidar = await import('chokidar');
    
    console.log(`👀 Watching directory: ${directory}`);
    console.log(`📁 Recursive: ${options.recursive ? 'Yes' : 'No'}`);
    console.log('⏹️  Press Ctrl+C to stop\n');

    const watcher = chokidar.watch(directory, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
      depth: options.recursive ? undefined : 1,
    });

    watcher.on('add', async (filePath: string) => {
      console.log(`🆕 New file detected: ${path.basename(filePath)}`);
      
      // Add to queue and process
      this.queue.push(filePath);
      await this.processQueue();
    });

    watcher.on('change', async (filePath: string) => {
      console.log(`🔄 File changed: ${path.basename(filePath)}`);
      
      // Re-process changed file
      this.queue.push(filePath);
      await this.processQueue();
    });

    watcher.on('error', (error: any) => {
      console.error('❌ Watcher error:', error);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n⏹️  Stopping file watcher...');
      watcher.close();
      process.exit(0);
    });

    // Keep the process alive
    await new Promise(() => {});
  }

  private generateDocumentId(filename: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const sanitized = filename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `${sanitized}_${timestamp}_${random}`;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const directory = process.argv[2];
  
  if (!directory) {
    console.log('Usage: node watch-ingest.js <directory> [options]');
    console.log('Example: node watch-ingest.js ./documents --recursive');
    process.exit(1);
  }

  const options = {
    recursive: process.argv.includes('--recursive'),
    tags: process.argv.includes('--tags') ? 
      process.argv[process.argv.indexOf('--tags') + 1]?.split(',') : undefined,
  };

  const watcher = new WatchIngest();
  watcher.initialize().then(() => {
    watcher.watchDirectory(directory, options);
  }).catch(console.error);
}

export { WatchIngest };
