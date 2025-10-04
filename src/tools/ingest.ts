/**
 * Document ingestion tool
 */

import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';
import {
  Document,
  DocumentChunk,
  IngestResult,
  BatchIngestResult,
  ServerConfig,
} from '../types/index.js';
import { processFile } from '../processors/index.js';
import { getChunkingStrategy } from '../chunking/index.js';
import { EmbeddingProvider } from '../types/index.js';
import { StorageBackend } from '../types/index.js';
import {
  validateFilePath,
  validateFileSize,
  validateFileType,
  validateMetadata,
  validateTags,
  validateDirectoryPath,
  sanitizeFilename,
} from '../utils/validation.js';
import { logger } from '../utils/logger.js';

export class IngestTool {
  constructor(
    private config: ServerConfig,
    private embeddingProvider: EmbeddingProvider,
    private storage: StorageBackend
  ) {}

  async ingestDocument(args: {
    file_path?: string;
    text_content?: string;
    metadata?: Record<string, any>;
    tags?: string[];
  }): Promise<IngestResult> {
    try {
      // Validate inputs
      if (!args.file_path && !args.text_content) {
        throw new Error('Either file_path or text_content must be provided');
      }

      if (args.file_path && args.text_content) {
        throw new Error('Cannot provide both file_path and text_content');
      }

      let content: string;
      let filename: string;
      let fileType: string;
      let filePath: string | undefined;

      if (args.file_path) {
        // Validate file path
        await validateFilePath(args.file_path);
        await validateFileSize(args.file_path, this.config.maxFileSize);
        validateFileType(args.file_path, this.config.allowedFileTypes);

        // Process file
        content = await processFile(args.file_path);
        filename = path.basename(args.file_path);
        fileType = path.extname(args.file_path).toLowerCase().slice(1);
        filePath = args.file_path;
      } else {
        // Use text content
        content = args.text_content!;
        filename = 'text_content';
        fileType = 'txt';
      }

      // Validate metadata and tags
      const customMetadata = args.metadata || {};
      if (Object.keys(customMetadata).length > 0) {
        validateMetadata(customMetadata);
      }

      const tags = args.tags ? validateTags(args.tags) : [];

      // Generate document ID
      const documentId = this.generateDocumentId(filename);

      // Chunk the content
      const chunkingStrategy = getChunkingStrategy(this.config.chunkingOptions.strategy);
      const chunks = chunkingStrategy.chunk(content, this.config.chunkingOptions);

      // Generate embeddings for chunks
      logger.info(`Generating embeddings for ${chunks.length} chunks`);
      const chunkTexts = chunks.map(c => c.content);
      const embeddings = await this.embeddingProvider.generateEmbeddings(chunkTexts);

      // Assign embeddings and IDs to chunks
      const processedChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
        ...chunk,
        id: `${documentId}_chunk_${index}`,
        documentId,
        embedding: embeddings[index],
      }));

      // Create document
      const document: Document = {
        id: documentId,
        content,
        metadata: {
          filename,
          filePath,
          fileType,
          tags,
          customMetadata,
          size: content.length,
        },
        chunks: processedChunks,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store document
      await this.storage.storeDocument(document);

      logger.info(`Successfully ingested document ${documentId}`);

      return {
        documentId,
        chunksCreated: processedChunks.length,
        status: 'success',
        message: `Document ingested successfully with ${processedChunks.length} chunks`,
      };
    } catch (error: any) {
      logger.error(`Document ingestion failed: ${error.message}`);
      return {
        documentId: '',
        chunksCreated: 0,
        status: 'error',
        message: error.message,
      };
    }
  }

  async batchIngest(args: {
    directory_path: string;
    file_patterns?: string[];
    recursive?: boolean;
  }): Promise<BatchIngestResult> {
    try {
      await validateDirectoryPath(args.directory_path);

      const files = await this.findFiles(
        args.directory_path,
        args.file_patterns || ['*'],
        args.recursive !== false
      );

      logger.info(`Found ${files.length} files to ingest`);

      const results: IngestResult[] = [];
      const errors: Array<{ file: string; error: string }> = [];
      let successCount = 0;
      let failedCount = 0;

      for (const file of files) {
        try {
          const result = await this.ingestDocument({ file_path: file });
          results.push(result);
          
          if (result.status === 'success') {
            successCount++;
          } else {
            failedCount++;
            errors.push({ file, error: result.message || 'Unknown error' });
          }
        } catch (error: any) {
          failedCount++;
          errors.push({ file, error: error.message });
        }
      }

      return {
        totalFiles: files.length,
        successCount,
        failedCount,
        documents: results,
        errors,
      };
    } catch (error: any) {
      logger.error(`Batch ingestion failed: ${error.message}`);
      throw error;
    }
  }

  private generateDocumentId(filename: string): string {
    const sanitized = sanitizeFilename(filename);
    const timestamp = Date.now();
    const hash = crypto.createHash('md5').update(`${sanitized}_${timestamp}`).digest('hex').slice(0, 8);
    return `doc_${timestamp}_${hash}`;
  }

  private async findFiles(
    dirPath: string,
    patterns: string[],
    recursive: boolean
  ): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (recursive) {
          const subFiles = await this.findFiles(fullPath, patterns, recursive);
          files.push(...subFiles);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase().slice(1);
        
        // Check if file matches any pattern
        const matchesPattern = patterns.some(pattern => {
          if (pattern === '*') return true;
          if (pattern.startsWith('*.')) return ext === pattern.slice(2);
          return entry.name.includes(pattern);
        });

        if (matchesPattern && this.config.allowedFileTypes.includes(ext)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }
}

