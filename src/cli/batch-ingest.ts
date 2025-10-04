#!/usr/bin/env node

/**
 * Simple batch ingestion script
 * Fast alternative to MCP ingestion
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

async function batchIngest(files: string[], options: {
  parallel?: number;
  chunkSize?: number;
  strategy?: 'sentence' | 'paragraph' | 'fixed';
  provider?: 'transformers' | 'openai' | 'cohere';
  model?: string;
  tags?: string[];
  metadata?: Record<string, any>;
} = {}) {
  console.log(`🚀 Starting batch ingestion of ${files.length} files...`);
  
  // Load config
  const config = await loadConfig();
  
    // Override config with options
    if (options.chunkSize) config.chunkingOptions.chunkSize = options.chunkSize;
    if (options.strategy) config.chunkingOptions.strategy = options.strategy;
    if (options.provider) config.embeddingConfig.provider = options.provider;
    if (options.model) config.embeddingConfig.model = options.model;

  // Initialize storage and embedding provider
  const storage = new ChromaStorage(config.chromaDbDir, config.storageDir);
  await storage.initialize();
  
  const embeddingProvider = createEmbeddingProvider(config.embeddingConfig);

  const startTime = Date.now();
  const results = {
    processed: 0,
    failed: 0,
    totalChunks: 0,
    totalSize: 0,
  };

  // Process files in parallel batches
  const batchSize = options.parallel || 3;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (filePath) => {
      try {
        const stats = await fs.stat(filePath);
        results.totalSize += stats.size;

        console.log(`📄 Processing: ${path.basename(filePath)}`);

        // Extract text content
        const content = await processFile(filePath);
        const filename = path.basename(filePath);
        const fileType = path.extname(filePath).toLowerCase().slice(1);

        // Chunk the content
        const chunkingStrategy = getChunkingStrategy(config.chunkingOptions.strategy);
        const chunks = chunkingStrategy.chunk(content, config.chunkingOptions);

        // Generate embeddings in batch (much faster!)
        const chunkTexts = chunks.map(c => c.content);
        const embeddings = await embeddingProvider.generateEmbeddings(chunkTexts);

        // Create document chunks with embeddings
        const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
          ...chunk,
          embedding: embeddings[index],
        }));

      // Create document
      const document: Document = {
        id: generateDocumentId(filename),
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
        await storage.storeDocument(document);
        
        results.processed++;
        results.totalChunks += document.chunks.length;
        console.log(`✅ Processed: ${filename} (${document.chunks.length} chunks)`);
        
      } catch (error: any) {
        results.failed++;
        console.error(`❌ Failed: ${filePath} - ${error.message}`);
      }
    });

    await Promise.all(batchPromises);
    
    // Progress update
    const progress = Math.round(((i + batch.length) / files.length) * 100);
    console.log(`📊 Progress: ${progress}% (${i + batch.length}/${files.length})`);
  }

  // Display results
  const duration = (Date.now() - startTime) / 1000;
  const sizeMB = (results.totalSize / 1024 / 1024).toFixed(2);
  
  console.log('\n🎉 Batch ingestion completed!');
  console.log(`📈 Results:`);
  console.log(`   • Files processed: ${results.processed}`);
  console.log(`   • Files failed: ${results.failed}`);
  console.log(`   • Total chunks: ${results.totalChunks}`);
  console.log(`   • Total size: ${sizeMB} MB`);
  console.log(`   • Duration: ${duration.toFixed(2)}s`);
  console.log(`   • Speed: ${(results.totalSize / 1024 / duration).toFixed(2)} KB/s`);
}

function generateDocumentId(filename: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const sanitized = filename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  return `${sanitized}_${timestamp}_${random}`;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const files = process.argv.slice(2);
  
  if (files.length === 0) {
    console.log('Usage: node batch-ingest.js <file1> <file2> ...');
    console.log('Example: node batch-ingest.js document1.pdf document2.docx');
    process.exit(1);
  }

  batchIngest(files).catch(console.error);
}

export { batchIngest };
