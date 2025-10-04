#!/usr/bin/env node

/**
 * Fast CLI tool for document ingestion
 * Bypasses MCP protocol for direct, fast processing
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';

import { loadConfig } from '../utils/config.js';
import { processFile } from '../processors/index.js';
import { getChunkingStrategy } from '../chunking/index.js';
import { createEmbeddingProvider } from '../embeddings/index.js';
import { ChromaStorage } from '../storage/chroma.js';
import { Document, DocumentChunk } from '../types/index.js';
import { logger } from '../utils/logger.js';

interface IngestOptions {
  directory?: string;
  files?: string[];
  recursive: boolean;
  parallel: number;
  chunkSize: number;
  strategy: 'sentence' | 'paragraph' | 'fixed';
  provider: 'transformers' | 'openai' | 'cohere';
  model?: string;
  tags?: string[];
  metadata?: string;
  dryRun: boolean;
  verbose: boolean;
}

class FastIngestCLI {
  private config: any;
  private storage!: ChromaStorage;
  private embeddingProvider!: any;
  private spinner: any;

  constructor() {
    this.spinner = ora();
  }

  async initialize(options: IngestOptions): Promise<void> {
    // Load and override config
    this.config = await loadConfig();
    
    // Override config with CLI options
    if (options.chunkSize) {
      this.config.chunkingOptions.chunkSize = options.chunkSize;
    }
    if (options.strategy) {
      this.config.chunkingOptions.strategy = options.strategy;
    }
    if (options.provider) {
      this.config.embeddingConfig.provider = options.provider;
    }
    if (options.model) {
      this.config.embeddingConfig.model = options.model;
    }

    // Initialize storage and embedding provider
    this.storage = new ChromaStorage(this.config.chromaDbDir, this.config.storageDir);
    await this.storage.initialize();
    
    this.embeddingProvider = createEmbeddingProvider(this.config.embeddingConfig);
  }

  async findFiles(options: IngestOptions): Promise<string[]> {
    const files: string[] = [];

    if (options.directory) {
      const pattern = options.recursive 
        ? `${options.directory}/**/*.{pdf,docx,txt,md,csv,json,html}`
        : `${options.directory}/*.{pdf,docx,txt,md,csv,json,html}`;
      
      const found = await glob.glob(pattern, { nodir: true });
      files.push(...found);
    }

    if (options.files) {
      files.push(...options.files);
    }

    // Filter by allowed file types
    const allowedExtensions = this.config.allowedFileTypes || ['.pdf', '.docx', '.txt', '.md', '.csv', '.json', '.html'];
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return allowedExtensions.includes(ext);
    });
  }

  async processFile(filePath: string, options: IngestOptions): Promise<Document | null> {
    try {
      // Extract text content
      const content = await processFile(filePath);
      const filename = path.basename(filePath);
      const fileType = path.extname(filePath).toLowerCase().slice(1);

      // Chunk the content
      const chunkingStrategy = getChunkingStrategy(this.config.chunkingOptions.strategy);
      const chunks = chunkingStrategy.chunk(content, this.config.chunkingOptions);

      // Generate embeddings in batch (much faster!)
      const chunkTexts = chunks.map(c => c.content);
      const embeddings = await this.embeddingProvider.generateEmbeddings(chunkTexts);

      // Create document chunks with embeddings
      const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index],
      }));

      // Parse metadata if provided
      let metadata = {};
      if (options.metadata) {
        try {
          metadata = JSON.parse(options.metadata);
        } catch (e) {
          logger.warn(`Invalid metadata JSON: ${options.metadata}`);
        }
      }

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
            ...metadata,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return document;
    } catch (error: any) {
      logger.error(`Failed to process ${filePath}: ${error.message}`);
      return null;
    }
  }

  async ingestFiles(files: string[], options: IngestOptions): Promise<void> {
    const startTime = Date.now();
    const results = {
      processed: 0,
      failed: 0,
      totalChunks: 0,
      totalSize: 0,
    };

    this.spinner.start(`Processing ${files.length} files...`);

    // Process files in parallel batches
    const batchSize = options.parallel || 3;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (filePath) => {
        const stats = await fs.stat(filePath);
        results.totalSize += stats.size;

        if (options.dryRun) {
          console.log(chalk.yellow(`[DRY RUN] Would process: ${filePath}`));
          results.processed++;
          return;
        }

        const document = await this.processFile(filePath, options);
        if (document) {
          await this.storage.storeDocument(document);
          results.processed++;
          results.totalChunks += document.chunks.length;
          
          if (options.verbose) {
            console.log(chalk.green(`✓ Processed: ${filePath} (${document.chunks.length} chunks)`));
          }
        } else {
          results.failed++;
        }
      });

      await Promise.all(batchPromises);
      
      // Update progress
      const progress = Math.round(((i + batch.length) / files.length) * 100);
      this.spinner.text = `Processing files... ${progress}% (${i + batch.length}/${files.length})`;
    }

    this.spinner.succeed(chalk.green('Ingestion completed!'));

    // Display results
    const duration = (Date.now() - startTime) / 1000;
    const sizeMB = (results.totalSize / 1024 / 1024).toFixed(2);
    
    const tableData = [
      ['Files Processed', results.processed.toString()],
      ['Files Failed', results.failed.toString()],
      ['Total Chunks', results.totalChunks.toString()],
      ['Total Size', `${sizeMB} MB`],
      ['Duration', `${duration.toFixed(2)}s`],
      ['Speed', `${(results.totalSize / 1024 / duration).toFixed(2)} KB/s`],
    ];

    console.log('\n' + table(tableData, {
      header: {
        alignment: 'center',
        content: chalk.blue.bold('Ingestion Results'),
      },
    }));
  }

  private generateDocumentId(filename: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const sanitized = filename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `${sanitized}_${timestamp}_${random}`;
  }
}

// CLI Setup
const program = new Command();
program
  .name('fast-ingest')
  .description('Fast document ingestion tool for Knowledge Management MCP')
  .version('1.1.0');

program
  .command('files')
  .description('Ingest specific files')
  .argument('<files...>', 'File paths to ingest')
  .option('-p, --parallel <number>', 'Number of parallel processes', '3')
  .option('-c, --chunk-size <number>', 'Chunk size in characters', '1000')
  .option('-s, --strategy <strategy>', 'Chunking strategy', 'sentence')
  .option('--provider <provider>', 'Embedding provider', 'transformers')
  .option('--model <model>', 'Embedding model')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .option('-m, --metadata <json>', 'Metadata as JSON string')
  .option('--dry-run', 'Show what would be processed without actually doing it')
  .option('-v, --verbose', 'Verbose output')
  .action(async (files: string[], options: any) => {
    const cli = new FastIngestCLI();
    await cli.initialize(options);
    
    const ingestOptions: IngestOptions = {
      files,
      parallel: parseInt(options.parallel),
      chunkSize: parseInt(options.chunkSize),
      strategy: options.strategy,
      provider: options.provider,
      model: options.model,
      tags: options.tags ? options.tags.split(',') : undefined,
      metadata: options.metadata,
      dryRun: options.dryRun,
      verbose: options.verbose,
      recursive: false,
    };

    await cli.ingestFiles(files, ingestOptions);
  });

program
  .command('directory')
  .description('Ingest all files in a directory')
  .argument('<directory>', 'Directory path to ingest')
  .option('-r, --recursive', 'Process subdirectories recursively')
  .option('-p, --parallel <number>', 'Number of parallel processes', '3')
  .option('-c, --chunk-size <number>', 'Chunk size in characters', '1000')
  .option('-s, --strategy <strategy>', 'Chunking strategy', 'sentence')
  .option('--provider <provider>', 'Embedding provider', 'transformers')
  .option('--model <model>', 'Embedding model')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .option('-m, --metadata <json>', 'Metadata as JSON string')
  .option('--dry-run', 'Show what would be processed without actually doing it')
  .option('-v, --verbose', 'Verbose output')
  .action(async (directory: string, options: any) => {
    const cli = new FastIngestCLI();
    await cli.initialize(options);
    
    const files = await cli.findFiles({
      directory,
      recursive: options.recursive,
      parallel: parseInt(options.parallel),
      chunkSize: parseInt(options.chunkSize),
      strategy: options.strategy,
      provider: options.provider,
      model: options.model,
      tags: options.tags ? options.tags.split(',') : undefined,
      metadata: options.metadata,
      dryRun: options.dryRun,
      verbose: options.verbose,
    });

    if (files.length === 0) {
      console.log(chalk.yellow(`No supported files found in ${directory}`));
      return;
    }

    console.log(chalk.blue(`Found ${files.length} files to process`));
    await cli.ingestFiles(files, {
      directory,
      recursive: options.recursive,
      parallel: parseInt(options.parallel),
      chunkSize: parseInt(options.chunkSize),
      strategy: options.strategy,
      provider: options.provider,
      model: options.model,
      tags: options.tags ? options.tags.split(',') : undefined,
      metadata: options.metadata,
      dryRun: options.dryRun,
      verbose: options.verbose,
    });
  });

program
  .command('watch')
  .description('Watch directory for new files and auto-ingest')
  .argument('<directory>', 'Directory to watch')
  .option('-r, --recursive', 'Watch subdirectories recursively')
  .option('-p, --parallel <number>', 'Number of parallel processes', '2')
  .option('-c, --chunk-size <number>', 'Chunk size in characters', '1000')
  .option('-s, --strategy <strategy>', 'Chunking strategy', 'sentence')
  .option('--provider <provider>', 'Embedding provider', 'transformers')
  .option('--model <model>', 'Embedding model')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .option('-m, --metadata <json>', 'Metadata as JSON string')
  .option('-v, --verbose', 'Verbose output')
  .action(async (directory: string, options: any) => {
    const chokidar = await import('chokidar');
    const cli = new FastIngestCLI();
    await cli.initialize(options);

    console.log(chalk.blue(`Watching ${directory} for new files...`));
    console.log(chalk.gray('Press Ctrl+C to stop'));

    const watcher = chokidar.watch(directory, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on('add', async (filePath: string) => {
      console.log(chalk.green(`New file detected: ${filePath}`));
      
      const ingestOptions: IngestOptions = {
        files: [filePath],
        parallel: parseInt(options.parallel),
        chunkSize: parseInt(options.chunkSize),
        strategy: options.strategy,
        provider: options.provider,
        model: options.model,
        tags: options.tags ? options.tags.split(',') : undefined,
        metadata: options.metadata,
        dryRun: false,
        verbose: options.verbose,
        recursive: false,
      };

      await cli.ingestFiles([filePath], ingestOptions);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nStopping file watcher...'));
      watcher.close();
      process.exit(0);
    });
  });

// Error handling
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled error:'), error);
  process.exit(1);
});

program.parse();
